import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityEventType, SecuritySeverity } from '@prisma/client';

@Injectable()
export class SecurityEventService {
  private readonly logger = new Logger(SecurityEventService.name);

  constructor(private prisma: PrismaService) {}

  async logEvent(params: {
    eventType: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    schoolId?: string;
    sessionId?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    riskScore?: number;
  }) {
    const cleanMetadata = this.redactSensitiveInfo(params.metadata);

    const event = await this.prisma.securityEvent.create({
      data: {
        eventType: params.eventType,
        severity: params.severity || SecuritySeverity.LOW,
        userId: params.userId,
        schoolId: params.schoolId,
        sessionId: params.sessionId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: cleanMetadata,
        riskScore: params.riskScore,
      },
    });

    if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
      this.logger.warn(`High severity security event: ${event.eventType} for user ${event.userId}`);
    }

    return event;
  }

  private redactSensitiveInfo(metadata: any): any {
    if (!metadata) return metadata;
    const sensitiveKeys = ['password', 'token', 'secret', 'cvv', 'card', 'pin', 'recoveryCode', 'sessionToken'];

    const redacted = { ...metadata };
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveInfo(redacted[key]);
      }
    }
    return redacted;
  }

  async getEvents(filters: any) {
    return this.prisma.securityEvent.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
