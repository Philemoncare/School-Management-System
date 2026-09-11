import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { MfaType, MfaStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  // ... (keep generateRecoveryCodes and verifyRecoveryCode)

  async setupTotp(userId: string) {
    const secret = crypto.randomBytes(20).toString('hex');
    const encryptedSecret = this.encryptionService.encrypt(secret);

    return this.prisma.mfaMethod.create({
      data: {
        userId,
        type: MfaType.TOTP,
        status: MfaStatus.PENDING_VERIFICATION,
        secret: encryptedSecret,
      }
    });
  }

  async verifyTotp(userId: string, code: string): Promise<boolean> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: MfaType.TOTP },
    });

    if (!method || !method.secret) return false;

    const secret = this.encryptionService.decrypt(method.secret);

    // In production, use otplib to verify code with secret
    // return otplib.authenticator.check(code, secret);
    return code === '000000'; // Placeholder
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const activeMethods = await this.prisma.mfaMethod.count({
      where: { userId, status: MfaStatus.ACTIVE },
    });
    return activeMethods > 0;
  }
}
