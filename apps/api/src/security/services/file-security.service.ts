import { Injectable, BadRequestException } from '@nestjs/common';
import { SecurityEventService } from './security-event.service';
import { SecuritySeverity, SecurityEventType } from '@prisma/client';

@Injectable()
export class FileSecurityService {
  private readonly ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private securityEventService: SecurityEventService) {}

  async validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }, context: any) {
    // 1. Check size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds limit');
    }

    // 2. Check extension
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('Invalid file extension');
    }

    // 3. Simple Magic Bytes check (simplified for demo)
    if (ext === 'pdf' && !this.isPdf(file.buffer)) {
      await this.logSecurityFailure(file.originalname, 'Invalid PDF magic bytes', context);
      throw new BadRequestException('Invalid file content');
    }

    // 4. Malware scanning placeholder
    // In production, send to a scanner (e.g., ClamAV)
    const isMalicious = await this.scanForMalware(file.buffer);
    if (isMalicious) {
      await this.logSecurityFailure(file.originalname, 'Malware detected', context, SecuritySeverity.CRITICAL, SecurityEventType.FILE_MALWARE_DETECTED as any);
      throw new BadRequestException('File is blocked for security reasons');
    }

    return true;
  }

  private isPdf(buffer: Buffer): boolean {
    return buffer.toString('utf8', 0, 4) === '%PDF';
  }

  private async scanForMalware(buffer: Buffer): Promise<boolean> {
    // Placeholder
    return false;
  }

  private async logSecurityFailure(filename: string, reason: string, context: any, severity = SecuritySeverity.HIGH, eventType = SecurityEventType.SUSPICIOUS_ACTIVITY) {
    await this.securityEventService.logEvent({
      eventType,
      severity,
      metadata: { filename, reason },
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });
  }
}
