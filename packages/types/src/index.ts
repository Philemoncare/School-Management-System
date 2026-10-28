export type UnsupportedReasonCode =
  | 'NOT_IMPLEMENTED'
  | 'SERVICE_UNCONFIGURED'
  | 'PLAN_RESTRICTED'
  | 'PERMISSION_DENIED'
  | 'SERVICE_UNAVAILABLE'
  | 'BROWSER_UNSUPPORTED'
  | 'NETWORK_ERROR';

export type IntegrationType =
  | 'SMS'
  | 'EMAIL'
  | 'PAYMENTS'
  | 'STORAGE'
  | 'WHATSAPP'
  | 'REDIS';

export const STANDARD_UNSUPPORTED_MESSAGES: Record<UnsupportedReasonCode, string> = {
  NOT_IMPLEMENTED: 'This feature is not available yet. Please check back later.',
  SERVICE_UNCONFIGURED: 'This service has not been configured. Please contact your school administrator.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  SERVICE_UNAVAILABLE: 'This service is temporarily unavailable. Please try again later.',
  BROWSER_UNSUPPORTED: 'Your browser does not support this feature. Please use a supported browser.',
  PLAN_RESTRICTED: 'This feature is not included in your current subscription. Contact your school administrator for assistance.',
  NETWORK_ERROR: 'Unable to connect to SchooMA services. Please check your network connection and try again.',
};

export interface FeatureStatus {
  enabled: boolean;
  reason?: UnsupportedReasonCode;
  message?: string;
  service?: IntegrationType;
  requiredPlan?: string;
  missingConfig?: string[];
  actionText?: string;
  actionUrl?: string;
}

export interface StructuredApiErrorResponse {
  success: false;
  statusCode: number;
  code: UnsupportedReasonCode | string;
  message: string;
  timestamp: string;
  path: string;
  requestId: string;
  details?: Record<string, unknown>;
}
