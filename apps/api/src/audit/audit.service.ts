import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    data: {
      schoolId?: string;
      userId?: string;
      action: string;
      module: string;
      resourceId?: string;
      metadata?: any;
      ipAddress?: string;
      userAgent?: string;
      tx?: any;
    },
    tx?: any,
  ) {
    // Redact sensitive fields from metadata
    const cleanMetadata = this.redactSensitiveInfo(data.metadata);

    const client = tx || data.tx || this.prisma;
    return client.auditLog.create({
      data: {
        schoolId: data.schoolId,
        userId: data.userId,
        action: data.action,
        module: data.module,
        resourceId: data.resourceId,
        metadata: cleanMetadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
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
}
