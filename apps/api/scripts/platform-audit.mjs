/**
 * Platform-scope data snapshot.
 *
 * Reads the rows the Platform Super Admin dashboards are built from, so an
 * empty-looking panel can be proven to be either "correctly empty" or "filtered
 * wrongly". Safe to re-run after any repair.
 *
 * Run from apps/api: node scripts/platform-audit.mjs
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, '..', '.env') });

const prisma = new PrismaClient();

function section(title) {
  console.log(`\n=== ${title} ===`);
}

section('Subscription plans (trial-capable = ACTIVE and trialDays > 0)');
const plans = await prisma.subscriptionPlan.findMany({
  include: { pricing: true, _count: { select: { subscriptions: true } } },
  orderBy: { displayOrder: 'asc' },
});
for (const plan of plans) {
  console.log(
    `  ${plan.code.padEnd(12)} status=${plan.status.padEnd(8)} trialDays=${String(plan.trialDays).padStart(2)} subs=${plan._count.subscriptions} ` +
      plan.pricing.map((p) => `[${p.interval}/${p.amount}/${p.isActive ? 'active' : 'inactive'}]`).join(''),
  );
}

section('Schools by status / subscriptions by status');
const schoolGroups = await prisma.school.groupBy({ by: ['status'], _count: { _all: true } });
console.log('  schools:', JSON.stringify(schoolGroups.map((g) => [g.status, g._count._all])));
const subGroups = await prisma.schoolSubscription.groupBy({ by: ['status'], _count: { _all: true } });
console.log('  subscriptions:', JSON.stringify(subGroups.map((g) => [g.status, g._count._all])));
const orphanTrialSchools = await prisma.school.findMany({
  // `subscription` is a to-one relation, so absence is expressed with `is: null`.
  where: { status: 'TRIAL', subscription: { is: null } },
  select: { id: true, code: true, name: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});
console.log(`  schools in TRIAL with NO subscription row: ${orphanTrialSchools.length}`);

section('Announcements — platform rows require schoolId IS NULL');
const announcements = await prisma.announcement.findMany({
  select: { id: true, schoolId: true, status: true, title: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
for (const a of announcements) {
  console.log(`  status=${a.status.padEnd(10)} schoolId=${a.schoolId ?? 'NULL (platform)'} title=${a.title}`);
}
console.log(`  platform-scope count: ${announcements.filter((a) => a.schoolId === null).length}`);

section('Other platform tables');
console.log('  SmsPackage:', await prisma.smsPackage.count());
console.log('  SmsCreditPurchase:', await prisma.smsCreditPurchase.count());
console.log('  PlatformInvoice:', await prisma.platformInvoice.count());
console.log('  PlatformPayment:', await prisma.platformPayment.count());
console.log('  PlatformSetting:', await prisma.platformSetting.count());
console.log('  MaintenanceWindow:', await prisma.maintenanceWindow.count());
console.log('  SupportAccessGrant:', await prisma.supportAccessGrant.count());

await prisma.$disconnect();
