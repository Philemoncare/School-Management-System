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

  /**
   * Redacts sensitive keys without changing the shape of anything else.
   *
   * Only plain objects are rebuilt. The previous version spread every object it
   * met, which corrupted the audit trail in two ways: arrays were rewritten as
   * objects (`{"0":"id"}` instead of `["id"]`), and class instances such as a
   * Prisma `Decimal` were flattened into `{ constructor, s, e, d }`, which
   * Prisma could not serialize at all — that alone made platform SMS package
   * creation fail with a 400 on every attempt. Dates and Decimals now pass
   * through untouched and Prisma serializes them correctly.
   */
  private redactSensitiveInfo(metadata: any): any {
    if (!metadata) return metadata;
    const sensitiveKeys = ['password', 'token', 'secret', 'cvv', 'card', 'pin', 'recoveryCode', 'sessionToken'];

    if (Array.isArray(metadata)) {
      return metadata.map((item) => this.redactSensitiveInfo(item));
    }
    if (!this.isPlainObject(metadata)) return metadata;

    const redacted = { ...metadata };
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = this.redactSensitiveInfo(redacted[key]);
      }
    }
    return redacted;
  }

  private isPlainObject(value: any): boolean {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
}
