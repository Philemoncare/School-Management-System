/**
 * Platform data inventory.
 *
 * Answers "is this dashboard broken, or is it correctly showing an empty
 * database?" before any repair is attempted. Row counts only — no secrets, no
 * row contents.
 *
 * Run from apps/api: node scripts/db-inventory.mjs
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

loadEnv({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });

const prisma = new PrismaClient();

const TARGETS = [
  ['School', prisma.school],
  ['User', prisma.user],
  ['SchoolMembership', prisma.schoolMembership],
  ['UserRole (assignments; platform-scope ones have schoolId null)', prisma.userRole],
  ['SubscriptionPlan', prisma.subscriptionPlan],
  ['SubscriptionPricing', prisma.subscriptionPricing],
  ['SchoolSubscription', prisma.schoolSubscription],
  ['PlatformInvoice', prisma.platformInvoice],
  ['PlatformPayment', prisma.platformPayment],
  ['SmsPackage', prisma.smsPackage],
  ['SmsCreditPurchase', prisma.smsCreditPurchase],
  ['SubscriptionCredit', prisma.subscriptionCredit],
  ['AuditLog', prisma.auditLog],
  ['SecurityEvent', prisma.securityEvent],
  ['UserSession', prisma.userSession],
  ['Announcement', prisma.announcement],
  ['MaintenanceWindow', prisma.maintenanceWindow],
  ['PlatformSetting', prisma.platformSetting],
  ['PlatformBackup', prisma.platformBackup],
  ['SupportAccessGrant', prisma.supportAccessGrant],
  ['FeatureFlag', prisma.featureFlag],
  ['SchoolSetting', prisma.schoolSetting],
  ['Invitation', prisma.invitation],
];

const out = [];
for (const [label, delegate] of TARGETS) {
  if (!delegate) {
    out.push([label, 'NO MODEL']);
    continue;
  }
  try {
    out.push([label, await delegate.count()]);
  } catch (err) {
    out.push([label, `ERROR ${err.code || err.name}`]);
  }
}

console.log('=== PLATFORM ROW COUNTS ===');
for (const [label, count] of out) console.log(`  ${String(count).padStart(7)}  ${label}`);

// What a school-facing operator would actually see per status.
try {
  const byStatus = await prisma.school.groupBy({ by: ['status'], _count: { _all: true } });
  console.log('\n=== SCHOOLS BY STATUS ===');
  for (const g of byStatus) console.log(`  ${String(g._count._all).padStart(7)}  ${g.status}`);
} catch (e) {
  console.log('school status breakdown failed:', e.message);
}

try {
  const subs = await prisma.schoolSubscription.groupBy({ by: ['status'], _count: { _all: true } });
  console.log('\n=== SUBSCRIPTIONS BY STATUS ===');
  for (const g of subs) console.log(`  ${String(g._count._all).padStart(7)}  ${g.status}`);
} catch (e) {
  console.log('subscription breakdown failed:', e.message);
}

try {
  const plat = await prisma.userRole.findMany({
    where: { schoolId: null },
    select: { userId: true, roleId: true },
    take: 50,
  });
  const roles = await prisma.role.findMany({ where: { id: { in: [...new Set(plat.map((r) => r.roleId))] } }, select: { id: true, name: true } });
  const map = new Map(roles.map((r) => [r.id, r.name]));
  console.log('\n=== GLOBAL (PLATFORM-SCOPE) ROLE ASSIGNMENTS ===');
  if (!plat.length) console.log('  none — no account holds a platform role');
  const grouped = new Map();
  for (const row of plat) grouped.set(map.get(row.roleId), (grouped.get(map.get(row.roleId)) || 0) + 1);
  for (const [name, n] of grouped) console.log(`  ${String(n).padStart(7)}  ${name}`);
} catch (e) {
  console.log('platform role scan failed:', e.message);
}

await prisma.$disconnect();
