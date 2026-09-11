import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityPolicy, MfaEnforcement } from '@prisma/client';

@Injectable()
export class SecurityPolicyService {
  private readonly platformDefaults: Partial<SecurityPolicy> = {
    passwordMinLength: 8,
    passwordRequireUpper: true,
    passwordRequireNumber: true,
    passwordRequireSymbol: true,
    mfaEnforcement: MfaEnforcement.OPTIONAL,
    sessionTimeoutMinutes: 120,
    idleTimeoutMinutes: 30,
    maxConcurrentSessions: 5,
    lockoutThreshold: 5,
    lockoutDurationMinutes: 30,
  };

  constructor(private prisma: PrismaService) {}

  async getEffectivePolicy(schoolId?: string): Promise<Partial<SecurityPolicy>> {
    if (!schoolId) return this.platformDefaults;

    const schoolPolicy = await this.prisma.securityPolicy.findUnique({
      where: { schoolId },
    });

    if (!schoolPolicy) return this.platformDefaults;

    // Merge logic: school policy can only STRENGTHEN platform defaults
    return {
      passwordMinLength: Math.max(this.platformDefaults.passwordMinLength!, schoolPolicy.passwordMinLength),
      passwordRequireUpper: this.platformDefaults.passwordRequireUpper || schoolPolicy.passwordRequireUpper,
      passwordRequireNumber: this.platformDefaults.passwordRequireNumber || schoolPolicy.passwordRequireNumber,
      passwordRequireSymbol: this.platformDefaults.passwordRequireSymbol || schoolPolicy.passwordRequireSymbol,
      mfaEnforcement: this.resolveMfaEnforcement(this.platformDefaults.mfaEnforcement!, schoolPolicy.mfaEnforcement),
      sessionTimeoutMinutes: Math.min(this.platformDefaults.sessionTimeoutMinutes!, schoolPolicy.sessionTimeoutMinutes),
      idleTimeoutMinutes: Math.min(this.platformDefaults.idleTimeoutMinutes!, schoolPolicy.idleTimeoutMinutes),
      maxConcurrentSessions: Math.min(this.platformDefaults.maxConcurrentSessions!, schoolPolicy.maxConcurrentSessions),
      lockoutThreshold: Math.min(this.platformDefaults.lockoutThreshold!, schoolPolicy.lockoutThreshold),
      lockoutDurationMinutes: Math.max(this.platformDefaults.lockoutDurationMinutes!, schoolPolicy.lockoutDurationMinutes),
    };
  }

  private resolveMfaEnforcement(platform: MfaEnforcement, school: MfaEnforcement): MfaEnforcement {
    const levels = { [MfaEnforcement.OPTIONAL]: 0, [MfaEnforcement.REQUIRED_FOR_ADMINS]: 1, [MfaEnforcement.REQUIRED_FOR_ALL]: 2 };
    return levels[school] > levels[platform] ? school : platform;
  }
}
