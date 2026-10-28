import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import {
  UnsupportedFeatureException,
  ServiceUnconfiguredException,
  PlanRestrictedException,
  ServiceUnavailableException,
} from '../src/common/exceptions/unsupported-feature.exception';
import { IntegrationStatusService } from '../src/common/services/integration-status.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Unsupported Feature Handling System', () => {
  let integrationService: IntegrationStatusService;
  let exceptionFilter: AllExceptionsFilter;

  beforeEach(() => {
    integrationService = new IntegrationStatusService();
    exceptionFilter = new AllExceptionsFilter();
  });

  describe('Custom Exceptions', () => {
    it('should throw UnsupportedFeatureException with 501 NOT_IMPLEMENTED', () => {
      const exception = new UnsupportedFeatureException('Voice Biometrics');
      const response = exception.getResponse() as any;

      expect(exception.getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
      expect(response.code).toBe('NOT_IMPLEMENTED');
      expect(response.message).toContain('Voice Biometrics');
    });

    it('should throw ServiceUnconfiguredException with 503 SERVICE_UNCONFIGURED', () => {
      const exception = new ServiceUnconfiguredException(
        'SMS',
        'SMS service is not configured.',
        ['SMS_API_KEY'],
      );
      const response = exception.getResponse() as any;

      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(response.code).toBe('SERVICE_UNCONFIGURED');
      expect(response.details.missingConfig).toContain('SMS_API_KEY');
    });

    it('should throw PlanRestrictedException with 403 PLAN_RESTRICTED', () => {
      const exception = new PlanRestrictedException('Enterprise');
      const response = exception.getResponse() as any;

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(response.code).toBe('PLAN_RESTRICTED');
      expect(response.details.requiredPlan).toBe('Enterprise');
    });

    it('should throw ServiceUnavailableException with 503 SERVICE_UNAVAILABLE', () => {
      const exception = new ServiceUnavailableException('Paystack');
      const response = exception.getResponse() as any;

      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(response.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('IntegrationStatusService', () => {
    it('should report correct status for SMS', () => {
      const status = integrationService.checkSms();
      expect(status.service).toBe('SMS');
      expect(typeof status.configured).toBe('boolean');
      expect(Array.isArray(status.missingConfig)).toBe(true);
    });

    it('should report correct status for Email', () => {
      const status = integrationService.checkEmail();
      expect(status.service).toBe('EMAIL');
      expect(typeof status.configured).toBe('boolean');
    });

    it('should report correct status for Payments', () => {
      const status = integrationService.checkPayments();
      expect(status.service).toBe('PAYMENTS');
      expect(typeof status.configured).toBe('boolean');
    });

    it('should report all integration statuses', () => {
      const all = integrationService.getAllStatuses();
      expect(all).toHaveProperty('SMS');
      expect(all).toHaveProperty('EMAIL');
      expect(all).toHaveProperty('PAYMENTS');
      expect(all).toHaveProperty('STORAGE');
      expect(all).toHaveProperty('REDIS');
      expect(all).toHaveProperty('WHATSAPP');
    });

    it('should assert configuration and throw ServiceUnconfiguredException when missing', () => {
      // Force missing env
      const originalKey = process.env.SMS_API_KEY;
      delete process.env.SMS_API_KEY;
      delete process.env.HUBTEL_CLIENT_SECRET;
      delete process.env.ARKESEL_API_KEY;
      delete process.env.TWILIO_AUTH_TOKEN;

      expect(() => {
        integrationService.assertConfigured('SMS', 'Bulk SMS Broadcast');
      }).toThrow(ServiceUnconfiguredException);

      if (originalKey) {
        process.env.SMS_API_KEY = originalKey;
      }
    });
  });

  describe('Exception Filter Format & Sanitization', () => {
    it('should format Exception filter response correctly', () => {
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus }),
          getRequest: () => ({
            method: 'POST',
            url: '/api/v1/test',
            headers: { 'x-correlation-id': 'test-corr-123' },
          }),
        }),
      } as any;

      const exception = new ServiceUnconfiguredException('EMAIL');
      exceptionFilter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'SERVICE_UNCONFIGURED',
          path: '/api/v1/test',
          requestId: 'test-corr-123',
        }),
      );
    });
  });
});
