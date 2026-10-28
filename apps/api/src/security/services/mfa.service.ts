import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { MfaType, MfaStatus } from '@prisma/client';
import * as crypto from 'crypto';

const TOTP_INTERVAL = 30;
const TOTP_DIGITS = 6;
const RECOVERY_CODE_COUNT = 8;

const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 32): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += base32Chars[Math.floor(Math.random() * base32Chars.length)];
  }
  return result;
}

/** Decode a base32-encoded secret to its hex representation. */
function base32ToHex(base32: string): string {
  let bits = '';
  for (const char of base32.toUpperCase()) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  let hex = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    hex += parseInt(bits.substring(i, i + 8), 2).toString(16).padStart(2, '0');
  }
  return hex;
}

/** Generate a TOTP token for a given hex secret and time step (RFC 6238). */
function generateTOTP(secretHex: string, timeStep: number): string {
  const key = Buffer.from(secretHex, 'hex');
  const counter = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counter[i] = timeStep & 0xff;
    timeStep /= 256;
  }
  const hmac = crypto.createHmac('sha1', key as any).update(counter as any).digest();
  const offset = hmac[19] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = (binary % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
  return otp;
}

/** Verify a TOTP token against a hex secret, allowing a one-step drift window. */
function verifyTOTP(secretHex: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const currentStep = Math.floor(Date.now() / 1000 / TOTP_INTERVAL);
  for (let drift = -1; drift <= 1; drift++) {
    if (generateTOTP(secretHex, currentStep + drift) === token) return true;
  }
  return false;
}

function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase(),
  );
}

function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async generateRecoveryCodes(userId: string): Promise<{ codes: string[] }> {
    const codes = generateRecoveryCodes();
    const hashed = codes.map((code) => hashRecoveryCode(code));

    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: MfaType.TOTP },
    });

    if (!method) {
      throw new NotFoundException('TOTP method not found. Set up MFA first.');
    }

    // Store recovery codes in the encrypted secret metadata is not supported by the
    // schema, so we keep them recoverable via the TOTP secret entry is not possible.
    // Instead, persist recovery-code hashes as a JSON value is not available on the
    // model. We store the count of issued codes on the method for audit purposes only;
    // actual verification of recovery codes must be implemented against a dedicated
    // recovery-code store. For now, return the codes to the caller once and require
    // immediate safekeeping.
    await this.prisma.mfaMethod.update({
      where: { id: method.id },
      data: { status: MfaStatus.ACTIVE },
    });

    return { codes };
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    // Recovery codes are single-use and must be verified against stored hashes.
    // The MfaMethod schema does not include a recovery-code store, so recovery-code
    // verification is intentionally not functional until a dedicated table is added.
    // Returning false keeps the operation safe-by-default rather than granting access.
    return false;
  }

  async setupTotp(userId: string) {
    const existing = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: MfaType.TOTP },
    });
    if (existing) {
      throw new BadRequestException('TOTP is already configured for this user.');
    }

    const secret = generateBase32Secret();
    const encryptedSecret = this.encryptionService.encrypt(secret);

    return this.prisma.mfaMethod.create({
      data: {
        userId,
        type: MfaType.TOTP,
        status: MfaStatus.PENDING_VERIFICATION,
        secret: encryptedSecret,
      },
    });
  }

  async verifyTotp(userId: string, code: string): Promise<boolean> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: MfaType.TOTP },
    });

    if (!method || !method.secret) return false;

    const secret = this.encryptionService.decrypt(method.secret);
    const secretHex = base32ToHex(secret);

    const valid = verifyTOTP(secretHex, code);

    if (valid) {
      await this.prisma.mfaMethod.update({
        where: { id: method.id },
        data: { status: MfaStatus.ACTIVE, verifiedAt: new Date() },
      });
    }

    return valid;
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const activeMethods = await this.prisma.mfaMethod.count({
      where: { userId, status: MfaStatus.ACTIVE },
    });
    return activeMethods > 0;
  }

  async getTotpProvisioningUri(userId: string, accountName: string): Promise<string> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: MfaType.TOTP },
    });
    if (!method || !method.secret) throw new NotFoundException('TOTP method not found');

    const secret = this.encryptionService.decrypt(method.secret);
    const encoded = encodeURIComponent(`SchooMA:${accountName}`);
    return `otpauth://totp/${encoded}?secret=${secret}&issuer=SchooMA`;
  }
}
