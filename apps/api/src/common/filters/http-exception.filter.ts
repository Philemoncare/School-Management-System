import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    // Log the error for diagnostics
    const correlationId = request.headers['x-correlation-id'] || 'N/A';
    this.logger.error(`[${request.method}] ${request.url} - Status: ${status} - Correlation: ${correlationId} - Error: ${JSON.stringify(message)}`);

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    // Prepare clean response
    const isProduction = process.env.NODE_ENV === 'production';

    const responseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status >= 500 && isProduction
        ? 'Internal server error'
        : (typeof message === 'string' ? message : (message as any).message || 'An unexpected error occurred'),
      requestId: request.headers['x-request-id'],
    };

    // Return safe, sanitized response
    response.status(status).json(responseBody);
  }
}
