/**
 * Super Admin live probe.
 *
 * Creates a genuine UserSession for an account that already holds a platform
 * role, signs an access token exactly the way AuthService does ({email, sub,
 * sid, roles}), and calls every platform endpoint against the running API.
 *
 * This exercises the real JwtAuthGuard + RolesGuard + interceptor stack — it
 * does not bypass authorization, it satisfies it. The session is revoked in a
 * finally block.
 *
 * Run from apps/api with the API listening: node scripts/super-admin-probe.mjs
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'node:crypto';

const here = new URL('../.env', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
loadEnv({ path: here });

const BASE = process.env.PROBE_BASE || `http://localhost:${process.env.PORT || 4000}/api/v1`;
const prisma = new PrismaClient();

const b64u = (buf) => Buffer.from(buf).toString('base64url');

/** Mirrors auth.service.ts createAuthenticatedSession payload, HS256. */
function signAccessToken({ sub, sid, email, roles }) {
  const secret = process.env.JWT_SECRET || 'development-only-insecure-secret';
  const iat = Math.floor(Date.now() / 1000);
  const body = { email, sub, sid, roles, iat, exp: iat + 2 * 3600 };
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64u(JSON.stringify(body));
  const sig = createHmac('sha256', secret).update(`${head}.${payload}`).digest();
  return `${head}.${payload}.${b64u(sig)}`;
}

async function openSession(userId, email, roles) {
  const session = await prisma.userSession.create({
    data: {
      userId,
      tokenHash: randomBytes(32).toString('hex'),
      ipAddress: '127.0.0.1',
      userAgent: 'super-admin-probe',
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
    },
  });
  return { sessionId: session.id, token: signAccessToken({ sub: userId, sid: session.id, email, roles }) };
}

/** Summarizes a response without dumping tenant data into the console. */
function shape(body) {
  if (body === null || typeof body !== 'object') return `${typeof body}`;
  if (Array.isArray(body)) return `array[${body.length}]`;
  return Object.entries(body)
    .map(([k, v]) =>
      Array.isArray(v) ? `${k}[${v.length}]` : v && typeof v === 'object' ? `${k}{}` : `${k}=${JSON.stringify(v)}`,
    )
    .join(' ')
    .slice(0, 220);
}

const PLATFORM_GETS = [
  '/super-admin/dashboard/metrics',
  '/super-admin/dashboard/operations',
  '/super-admin/schools?take=5',
  '/super-admin/schools/filters',
  '/super-admin/plans',
  '/super-admin/billing/summary',
  '/super-admin/billing/invoices',
  '/super-admin/billing/payments',
  '/super-admin/audit?take=5',
  '/super-admin/audit/filters',
  '/super-admin/security/overview',
  '/super-admin/security/incidents',
  '/super-admin/security/events?take=5',
  '/super-admin/security/policy',
  '/super-admin/maintenance',
  '/super-admin/monitoring/health',
  '/super-admin/monitoring/queues',
  '/super-admin/monitoring/activity',
  '/super-admin/announcements',
  '/super-admin/backups',
  '/super-admin/sms-credits',
  '/super-admin/sms-packages',
  '/super-admin/sms-packages/balances',
  '/super-admin/sms-packages/provider-balance',
  '/super-admin/launch-readiness',
  '/super-admin/support-access',
  '/super-admin/settings/platform',
  '/dev-mode/status',
  '/dev-mode/diagnostics',
];

let created = [];
try {
  // The account that actually holds platform scope, and a school-only account
  // for the negative test. Roles come from global UserRole rows.
  const platformRows = await prisma.userRole.findMany({
    where: { schoolId: null },
    include: { user: true, role: true },
  });
  const platform = platformRows.find((r) => r.user?.isActive) ?? null;
  const schoolAdmin = await prisma.userRole.findFirst({
    where: { schoolId: { not: null }, role: { name: 'SCHOOL_ADMIN' }, user: { isActive: true } },
    include: { user: true, role: true },
  });

  if (!platform) {
    console.log('NO PLATFORM-SCOPE ACCOUNT FOUND — every /super-admin route would 403.');
  }

  const actor = platform
    ? await openSession(platform.userId, platform.user.email, [platform.role.name])
    : null;
  if (actor) created.push(actor.sessionId);

  const other = schoolAdmin
    ? await openSession(schoolAdmin.userId, schoolAdmin.user.email, [schoolAdmin.role.name])
    : null;
  if (other) created.push(other.sessionId);

  console.log(`actor: ${platform?.user?.email ?? '(none)'} role=${platform?.role?.name ?? '-'}`);
  console.log(`negative-test user: ${schoolAdmin?.user?.email ?? '(none)'} role=${schoolAdmin?.role?.name ?? '-'}\n`);

  const tally = { ok: 0, empty: 0, redirect: 0, clientError: 0, serverError: 0 };
  const problems = [];

  console.log('=== AUTHENTICATED GET PROBES (as platform role) ===');
  for (const path of PLATFORM_GETS) {
    if (!actor) {
      problems.push(`  skipped (no actor): ${path}`);
      continue;
    }
    const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${actor.token}` } });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 120);
    }
    const s = res.status;
    if (s >= 500) {
      tally.serverError++;
      problems.push(`  ${s} ${path}  ${String(body).slice(0, 160)}`);
    } else if (s === 401 || s === 403) {
      tally.clientError++;
      problems.push(`  ${s} ${path}  ${String(body).slice(0, 160)}`);
    } else if (s >= 400) {
      tally.clientError++;
      problems.push(`  ${s} ${path}  ${String(body).slice(0, 160)}`);
    } else {
      tally.ok++;
      const sh = shape(body);
      if (/\[\]|array\[0\]|:0 |"count":0/.test(sh)) tally.empty++;
      console.log(`  ${s} ${path}\n      ${sh}`);
    }
  }

  console.log('\n=== NEGATIVE TEST: school-scoped admin hitting platform routes ===');
  const probes403 = ['/super-admin/dashboard/metrics', '/super-admin/schools?take=1', '/super-admin/plans'];
  for (const path of probes403) {
    if (!other) {
      console.log(`  (no SCHOOL_ADMIN account available to test) ${path}`);
      continue;
    }
    const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${other.token}` } });
    console.log(`  ${res.status} ${path}  ${res.status === 403 ? 'correctly denied' : '*** PERMISSION LEAK ***'}`);
  }

  const anon = await fetch(`${BASE}/super-admin/dashboard/metrics`);
  console.log(`  ${anon.status} anonymous request  ${anon.status === 401 ? 'correctly rejected' : '*** UNAUTHENTICATED ACCESS ***'}`);

  console.log(`\n=== TALLY === ${JSON.stringify(tally)}`);
  if (problems.length) {
    console.log('\n=== PROBLEMS ===');
    for (const p of problems) console.log(p);
  }
} finally {
  if (created.length) {
    await prisma.userSession.updateMany({
      where: { id: { in: created } },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'super-admin-probe finished' },
    });
    await prisma.userSession.deleteMany({ where: { id: { in: created } } });
    console.log(`\ncleaned up ${created.length} probe session(s)`);
  }
  await prisma.$disconnect();
}
