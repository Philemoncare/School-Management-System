import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

function httpMessage(response: unknown): any {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object') {
    const body = response as Record<string, any>;
    if (body.message !== undefined) return body.message;
    if (body.error !== undefined) return body.error;
  }
  return 'Request failed';
}

function extractDetails(response: unknown): Record<string, any> | undefined {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const body = response as Record<string, any>;
    if (body.details && typeof body.details === 'object') {
      return sanitizePayload(body.details);
    }
  }
  return undefined;
}

function sanitizePayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'privateKey', 'creditCard'];

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message: any = 'An unexpected server error occurred.';
    let details: Record<string, any> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = httpMessage(exceptionResponse);
      details = extractDetails(exceptionResponse);

      const explicitCode =
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        typeof (exceptionResponse as Record<string, unknown>).code === 'string'
          ? ((exceptionResponse as Record<string, unknown>).code as string)
          : null;

      if (explicitCode) {
        code = explicitCode;
      } else if (status === HttpStatus.NOT_IMPLEMENTED) {
        code = 'NOT_IMPLEMENTED';
      } else if (status === HttpStatus.BAD_REQUEST) {
        code = 'VALIDATION_ERROR';
      } else if (status === HttpStatus.UNAUTHORIZED) {
        code = 'UNAUTHORIZED';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = 'FORBIDDEN';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = 'NOT_FOUND';
      } else if (status === HttpStatus.CONFLICT) {
        code = 'CONFLICT';
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = 'RATE_LIMITED';
      } else if (status === HttpStatus.SERVICE_UNAVAILABLE) {
        code = 'SERVICE_UNAVAILABLE';
      } else if (status >= 500) {
        code = 'SERVICE_ERROR';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RESOURCE';
        const target = (exception.meta?.target as string[]) || [];
        const field = Array.isArray(target) ? target.join(', ') : String(target);
        if (field.includes('email')) {
          message = 'An account with this email address already exists.';
        } else if (field.includes('code')) {
          message = 'A school with this Short Code already exists.';
        } else if (field.includes('slug')) {
          message = 'A school with this Workspace URL Slug already exists.';
        } else if (field.includes('phone')) {
          message = 'An account with this phone number already exists.';
        } else {
          message = `A record with this ${field || 'field'} already exists.`;
        }
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'The requested resource was not found.';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist or has invalid relationships.';
      } else if (['P1001', 'P1002', 'P1008', 'P1017'].includes(exception.code)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        code = 'DATABASE_UNAVAILABLE';
        message = 'The school database is temporarily unavailable. Please try again shortly.';
      } else if (['P2021', 'P2022'].includes(exception.code)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        code = 'DATABASE_SCHEMA_ERROR';
        message = 'The database schema is not ready. Please contact support.';
      } else {
        code = 'DATABASE_ERROR';
        message = 'A database error prevented this request from completing.';
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      code = 'DATABASE_UNAVAILABLE';
      message = 'The school database is temporarily unavailable. Please try again shortly.';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_DATABASE_REQUEST';
      message = 'The request contained invalid data.';
    }

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Safe logging without exposing sensitive params
    const safeUrl = request.url ? request.url.split('?')[0] : 'unknown';
    this.logger.error(
      `[${request.method}] ${safeUrl} - Status: ${status} - Code: ${code} - Correlation: ${correlationId} - Message: ${typeof message === 'object' ? JSON.stringify(message) : message}`,
    );

    const errorResponseBody: Record<string, any> = {
      success: false,
      statusCode: status,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      requestId: correlationId,
    };

    if (details) {
      errorResponseBody.details = details;
    }

    response.status(status).json(errorResponseBody);
  }
}
