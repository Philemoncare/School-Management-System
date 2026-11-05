import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../.env') });

const prisma = new PrismaClient();

const EMAIL = 'philemonmelabah0@gmail.com';
const NEW_PASSWORD = process.env.RESET_PASSWORD || '@Qwerty12345';

function validatePassword(password: string) {
  if (
    password.length < 12 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)
  ) {
    throw new Error(
      'Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.',
    );
  }
}

async function main() {
  validatePassword(NEW_PASSWORD);

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: EMAIL.toLowerCase() },
    include: {
      userRoles: { include: { role: true } },
      memberships: { include: { school: true } },
    },
  });

  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    console.log('Available users:');
    const allUsers = await prisma.user.findMany({
      select: { email: true, accountState: true, isActive: true },
    });
    for (const u of allUsers) {
      console.log(`  - ${u.email} (state: ${u.accountState}, active: ${u.isActive})`);
    }
    process.exit(1);
  }

  console.log(`Found user: ${user.email}`);
  console.log(`  Account state: ${user.accountState}`);
  console.log(`  Is active: ${user.isActive}`);
  console.log(`  Email verified: ${user.emailVerified ? 'yes' : 'no'}`);

  // Hash the new password
  const passwordHash = await argon2.hash(NEW_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Update the user: reset password, unlock account, activate
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      accountState: 'ACTIVE',
      isActive: true,
      emailVerified: user.emailVerified || new Date(),
    },
  });

  console.log(`\nPassword reset successful for ${updated.email}`);
  console.log(`  New account state: ${updated.accountState}`);
  console.log(`  You can now sign in with: ${EMAIL} / ${NEW_PASSWORD}`);

  // Show roles
  if (user.userRoles.length > 0) {
    console.log(`\nRoles:`);
    for (const ur of user.userRoles) {
      console.log(`  - ${ur.role.name} (schoolId: ${ur.schoolId ?? 'null (platform)'})`);
    }
  }

  if (user.memberships.length > 0) {
    console.log(`\nSchool memberships:`);
    for (const m of user.memberships) {
      console.log(`  - ${m.school?.name ?? 'unknown'} (${m.schoolId}) - status: ${m.status}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('Reset failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
