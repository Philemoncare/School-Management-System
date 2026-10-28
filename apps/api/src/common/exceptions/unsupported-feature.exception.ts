import { HttpException, HttpStatus } from '@nestjs/common';

export type UnsupportedReasonCode =
  | 'NOT_IMPLEMENTED'
  | 'SERVICE_UNCONFIGURED'
  | 'PLAN_RESTRICTED'
  | 'PERMISSION_DENIED'
  | 'SERVICE_UNAVAILABLE'
  | 'BROWSER_UNSUPPORTED'
  | 'NETWORK_ERROR';

export const STANDARD_MESSAGES: Record<UnsupportedReasonCode, string> = {
  NOT_IMPLEMENTED: 'This feature is not available yet. Please check back later.',
  SERVICE_UNCONFIGURED: 'This service has not been configured. Please contact your school administrator.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  SERVICE_UNAVAILABLE: 'This service is temporarily unavailable. Please try again later.',
  BROWSER_UNSUPPORTED: 'Your browser does not support this feature. Please use a supported browser.',
  PLAN_RESTRICTED: 'This feature is not included in your current subscription. Contact your school administrator for assistance.',
  NETWORK_ERROR: 'Unable to connect to SchooMA services. Please check your network connection and try again.',
};

export class UnsupportedFeatureException extends HttpException {
  constructor(
    featureName?: string,
    message?: string,
    details?: Record<string, any>,
  ) {
    const customMessage =
      message ||
      (featureName
        ? `The '${featureName}' feature is not available yet. Please check back later.`
        : STANDARD_MESSAGES.NOT_IMPLEMENTED);

    super(
      {
        success: false,
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        code: 'NOT_IMPLEMENTED',
        message: customMessage,
        details: {
          featureName,
          ...details,
        },
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}

export class ServiceUnconfiguredException extends HttpException {
  constructor(
    serviceName: string,
    message?: string,
    missingConfig?: string[],
  ) {
    const customMessage =
      message ||
      `The ${serviceName} service has not been configured. Please contact your school administrator.`;

    super(
      {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SERVICE_UNCONFIGURED',
        message: customMessage,
        details: {
          serviceName,
          missingConfig: missingConfig || [],
        },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class PlanRestrictedException extends HttpException {
  constructor(requiredPlan?: string, message?: string) {
    const customMessage =
      message ||
      (requiredPlan
        ? `This feature requires the ${requiredPlan} subscription plan. Contact your school administrator to upgrade.`
        : STANDARD_MESSAGES.PLAN_RESTRICTED);

    super(
      {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        code: 'PLAN_RESTRICTED',
        message: customMessage,
        details: {
          requiredPlan,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(serviceName?: string, message?: string) {
    const customMessage =
      message ||
      (serviceName
        ? `The ${serviceName} service is temporarily unavailable. Please try again later.`
        : STANDARD_MESSAGES.SERVICE_UNAVAILABLE);

    super(
      {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SERVICE_UNAVAILABLE',
        message: customMessage,
        details: {
          serviceName,
        },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
