import { AccountState, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { provisionPlatformSuperAdmin } from './auth/platform-role-provisioning';

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../.env') });

const prisma = new PrismaClient();

function requireValue(name: string, value: string | undefined): string {
  const normalized = (value || '').trim();
  if (!normalized) {
    throw new Error(`${name} is required.`);
  }
  return normalized;
}

function validatePassword(password: string) {
  if (
    password.length < 12 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)
  ) {
    throw new Error(
      'SUPER_ADMIN_PASSWORD must be at least 12 characters and contain uppercase, lowercase, number, and special character.',
    );
  }
}

async function bootstrap() {
  const email = requireValue('SUPER_ADMIN_EMAIL', process.env.SUPER_ADMIN_EMAIL).toLowerCase();
  const password = requireValue('SUPER_ADMIN_PASSWORD', process.env.SUPER_ADMIN_PASSWORD);
  const firstName = (process.env.SUPER_ADMIN_FIRST_NAME || 'System').trim();
  const lastName = (process.env.SUPER_ADMIN_LAST_NAME || 'Administrator').trim();

  validatePassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  const shouldResetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD === 'true';
  const passwordHash = !existing || shouldResetPassword
    ? await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      })
    : undefined;

  const role = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', schoolId: null },
  }) || await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      description: 'Platform-level administrator with full access to all tenants and platform settings.',
      isSystem: true,
      schoolId: null,
    },
  });

  const user = await prisma.$transaction(async (tx) => {
    const account = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            accountState: AccountState.ACTIVE,
            emailVerified: existing.emailVerified || new Date(),
            isActive: true,
            ...(passwordHash ? { passwordHash } : {}),
          },
        })
      : await tx.user.create({
          data: {
            email,
            passwordHash: passwordHash as string,
            firstName,
            lastName,
            accountState: AccountState.ACTIVE,
            emailVerified: new Date(),
            isActive: true,
          },
        });

    const assignment = await tx.userRole.findFirst({
      where: { userId: account.id, roleId: role.id, schoolId: null },
    });

    if (!assignment) {
      await tx.userRole.create({
        data: { userId: account.id, roleId: role.id, schoolId: null },
      });
    }

    await provisionPlatformSuperAdmin(tx, account.id);

    return account;
  });

  console.log('Super admin ready.');
  console.log(`Email: ${user.email}`);
  console.log(`User ID: ${user.id}`);
  console.log(`Password updated: ${passwordHash ? 'yes' : 'no'}`);
}

bootstrap()
  .catch((error) => {
    console.error('Super admin bootstrap failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
