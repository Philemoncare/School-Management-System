/**
 * Phase 5 live verification for the Platform Super Admin repairs.
 *
 * Every check drives the RUNNING API over HTTP with a genuine session and then
 * reads the database to confirm the write actually happened, because "the
 * endpoint answered 200" is not the same claim as "the record changed".
 *
 * Artifacts are labelled PROBE- and torn down at the end; the audit rows and
 * the archived SMS package are left in place as the trail.
 *
 * Run from apps/api with the API listening:
 *   node scripts/super-admin-verify.mjs
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'node:crypto';

const here = new URL('../.env', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
loadEnv({ path: here });

const BASE = process.env.PROBE_BASE || `http://localhost:${process.env.PORT || 4000}/api/v1`;
const SWEEP_ONLY = process.argv.includes('--sweep-only');
const prisma = new PrismaClient();
const stamp = Date.now().toString(36).toUpperCase();

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
function signAccessToken({ sub, sid, email, roles }) {
  const secret = process.env.JWT_SECRET || 'development-only-insecure-secret';
  const iat = Math.floor(Date.now() / 1000);
  const body = { email, sub, sid, roles, iat, exp: iat + 2 * 3600 };
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64u(JSON.stringify(body));
  const sig = createHmac('sha256', secret).update(`${head}.${payload}`).digest();
  return `${head}.${payload}.${b64u(sig)}`;
}

const sessions = [];
async function openSession(user, roleNames) {
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: randomBytes(32).toString('hex'),
      ipAddress: '127.0.0.1',
      userAgent: 'super-admin-verify',
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
    },
  });
  sessions.push(session.id);
  return signAccessToken({ sub: user.id, sid: session.id, email: user.email, roles: roleNames });
}

async function call(method, path, token, { body, schoolId } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(schoolId ? { 'x-school-id': schoolId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text: text.slice(0, 300) };
}

let cleanup = { schoolId: null, userId: null, ticketId: null, packageId: null, notificationIds: [] };

// A previous run that aborted mid-flight can leave PROBE artifacts behind, and a
// stale tenant would make the orphan-count assertions lie. The suite sweeps on
// entry; `--sweep-only` runs just this part to clear leftovers after a crash.
async function sweepProbeArtifacts() {
  const staleSchools = await prisma.school.findMany({
    where: { code: { startsWith: 'PROBE' } },
    select: { id: true, code: true },
  });
  for (const stale of staleSchools) {
    const notes = await prisma.notification.findMany({ where: { schoolId: stale.id }, select: { id: true } });
    if (notes.length) {
      await prisma.notificationDelivery.deleteMany({ where: { notificationId: { in: notes.map((n) => n.id) } } });
      await prisma.notification.deleteMany({ where: { schoolId: stale.id } });
    }
    await prisma.supportTicket.deleteMany({ where: { schoolId: stale.id } }).catch(() => {});
    await prisma.smsCreditPurchase.deleteMany({ where: { schoolId: stale.id } });
    await prisma.schoolSubscription.deleteMany({ where: { schoolId: stale.id } });
    await prisma.schoolMembership.deleteMany({ where: { schoolId: stale.id } });
    await prisma.userRole.deleteMany({ where: { schoolId: stale.id } });
    await prisma.role.deleteMany({ where: { schoolId: stale.id } });
    await prisma.schoolSetting.deleteMany({ where: { schoolId: stale.id } });
    await prisma.school.delete({ where: { id: stale.id } }).catch((e) => console.log(`sweep ${stale.code}: ${e.message.slice(0, 80)}`));
  }
  const staleUsers = await prisma.user.findMany({ where: { email: { startsWith: 'probe+' } }, select: { id: true } });
  for (const stale of staleUsers) {
    await prisma.userSession.deleteMany({ where: { userId: stale.id } });
    await prisma.userRole.deleteMany({ where: { userId: stale.id } });
    await prisma.schoolMembership.deleteMany({ where: { userId: stale.id } });
    await prisma.user.delete({ where: { id: stale.id } }).catch(() => {});
  }
  // A run that died before the archive step would otherwise leave probe
  // packages in the live catalogue.
  const stalePackages = await prisma.smsPackage.findMany({
    where: { OR: [{ code: { startsWith: 'PROBE' } }, { name: { startsWith: 'PROBE Package' } }, { name: { startsWith: 'PROBE Empty' } }, { name: { startsWith: 'PROBE Orphan' } }] },
    select: { id: true, code: true },
  });
  for (const stale of stalePackages) {
    await prisma.auditLog.deleteMany({ where: { resourceId: stale.id } });
    await prisma.smsPackage.delete({ where: { id: stale.id } })
      .catch(() => console.log(`sweep package ${stale.code}: referenced by real purchases, left in place`));
  }
  return { schools: staleSchools.length, users: staleUsers.length, packages: stalePackages.length };
}

try {
  const swept = await sweepProbeArtifacts();
  if (swept.schools || swept.users || swept.packages) {
    console.log(
      `swept ${swept.schools} stale PROBE tenant(s), ${swept.users} stale probe user(s), ${swept.packages} stale probe package(s)\n`,
    );
  }
  if (SWEEP_ONLY) {
    console.log('sweep-only run complete; no checks executed.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // ---------------------------------------------------------------- actors
  const platformRow = await prisma.userRole.findFirst({
    where: { schoolId: null, role: { name: 'PLATFORM_SUPER_ADMIN' }, user: { isActive: true } },
    include: { user: true, role: true },
  });
  if (!platformRow) {
    console.log('FATAL: no active PLATFORM_SUPER_ADMIN account — nothing can be verified.');
    process.exit(1);
  }
  const platformToken = await openSession(platformRow.user, [platformRow.role.name]);
  console.log(`platform actor: ${platformRow.user.email}\n`);

  // A school admin from an existing tenant, for the isolation + permission tests.
  // SchoolMembership has no `userRoles` relation, so anchor on UserRole, which
  // carries the tenant id directly.
  const otherRole = await prisma.userRole.findFirst({
    where: { schoolId: { not: null }, role: { name: 'SCHOOL_ADMIN' }, user: { isActive: true } },
    include: { user: true, role: true },
  });
  const otherUser = otherRole?.user ?? null;
  const otherSchoolId = otherRole?.schoolId ?? null;
  const otherToken = otherUser ? await openSession(otherUser, ['SCHOOL_ADMIN']) : null;
  console.log(`second tenant actor: ${otherUser?.email ?? 'NONE'} @ ${otherSchoolId ?? '-'}\n`);

  // ------------------------------------------------- 1. new GET surfaces live
  console.log('=== 1. New / repaired GET surfaces ===');
  const gets = [
    '/super-admin/tickets?take=5',
    '/super-admin/tickets/metrics',
    '/super-admin/sms-credits/transactions',
    '/super-admin/sms-packages/purchases',
    '/super-admin/sms-packages/balances',
    '/super-admin/schools?status=TRIAL&take=3',
  ];
  for (const path of gets) {
    const res = await call('GET', path, platformToken);
    check(`GET ${path}`, res.status === 200, `${res.status} ${res.text.slice(0, 90)}`);
  }

  // -------------------------------------- 2. provision + approve => trial sub
  console.log('\n=== 2. Approval grants a real subscription (r1) ===');
  const schoolCode = `PROBE${stamp.slice(-5)}`;
  const adminEmail = `probe+${stamp.toLowerCase()}@schoolma.test`;
  const provision = await call('POST', '/super-admin/schools', platformToken, {
    body: {
      name: `PROBE School ${stamp}`,
      code: schoolCode,
      email: adminEmail,
      schoolType: 'Basic School',
      region: 'Greater Accra',
      status: 'PENDING',
      adminFirstName: 'Probe',
      adminLastName: 'Admin',
      adminEmail,
      adminPassword: 'ProbePass!234',
    },
  });
  check('POST /super-admin/schools (PENDING tenant)', provision.status === 201 || provision.status === 200, `${provision.status} ${provision.text.slice(0, 120)}`);
  const probeSchoolId = provision.json?.id ?? null;
  cleanup.schoolId = probeSchoolId;

  if (probeSchoolId) {
    const created = await prisma.school.findUnique({ where: { id: probeSchoolId } });
    check('provisioned school exists with status PENDING', created?.status === 'PENDING', String(created?.status));
    const settings = await prisma.schoolSetting.findMany({ where: { schoolId: probeSchoolId } });
    check(
      'provisioning persisted region/school_type as SchoolSetting rows',
      settings.some((s) => s.key === 'region') && settings.some((s) => s.key === 'school_type'),
      settings.map((s) => `${s.key}=${s.value}`).join(', '),
    );

    const noSubYet = await prisma.schoolSubscription.count({ where: { schoolId: probeSchoolId } });
    check('no subscription before approval', noSubYet === 0, `count=${noSubYet}`);

    const approve = await call('PATCH', `/super-admin/schools/${probeSchoolId}/status`, platformToken, {
      body: { status: 'ACTIVE' },
    });
    check('PATCH status PENDING->ACTIVE', approve.status === 200, `${approve.status} ${approve.text.slice(0, 140)}`);
    check('response reports the trial grant', approve.json?.trialGrant?.kind === 'granted', JSON.stringify(approve.json?.trialGrant ?? {}).slice(0, 160));

    const sub = await prisma.schoolSubscription.findUnique({
      where: { schoolId: probeSchoolId },
      include: { plan: true, pricing: true },
    });
    check('SchoolSubscription row written', Boolean(sub), sub ? `status=${sub.status} plan=${sub.plan?.code}` : 'none');
    check(
      'trial window derived from the plan record, not a constant',
      Boolean(sub?.trialEnd && sub?.plan?.trialDays) &&
        Math.round((sub.trialEnd - sub.startDate) / 86400000) === sub.plan.trialDays,
      sub ? `days=${sub.plan.trialDays} span=${sub.trialEnd && Math.round((sub.trialEnd - sub.startDate) / 86400000)}` : 'n/a',
    );

    const trialAudit = await prisma.auditLog.findFirst({
      where: { schoolId: probeSchoolId, action: 'SUBSCRIPTION_TRIAL_GRANTED' },
    });
    check('trial grant written to the audit trail', Boolean(trialAudit), trialAudit?.metadata ? JSON.stringify(trialAudit.metadata).slice(0, 120) : 'missing');

    const approveAgain = await call('PATCH', `/super-admin/schools/${probeSchoolId}/status`, platformToken, { body: { status: 'SUSPENDED', reason: 'PROBE lifecycle check' } });
    check('PATCH ACTIVE->SUSPENDED still works after the change', approveAgain.status === 200, `${approveAgain.status}`);
    const reactivate = await call('PATCH', `/super-admin/schools/${probeSchoolId}/status`, platformToken, { body: { status: 'ACTIVE' } });
    check(
      'reactivation does not mint a second subscription',
      (await prisma.schoolSubscription.count({ where: { schoolId: probeSchoolId } })) === 1,
      `status after reactivation=${reactivate.json?.status} trialGrant=${reactivate.json?.trialGrant?.kind ?? 'not attempted'}`,
    );
  }

  // ------------------------------------------------------- 3. SMS catalogue
  console.log('\n=== 3. SMS package -> grant -> purchase -> confirm (r2/r3) ===');
  // The tenant's own admin is minted here rather than inside the SMS block, so
  // the school-side checks in section 5 are never skipped because a platform
  // step failed.
  const probeAdminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  let schoolToken = null;
  if (probeAdminUser) {
    cleanup.userId = probeAdminUser.id;
    schoolToken = await openSession(probeAdminUser, ['SCHOOL_ADMIN']);
  }
  const pkgCode = `PROBE${stamp.slice(-5)}`;
  const createPkg = await call('POST', '/super-admin/sms-packages', platformToken, {
    body: { name: `PROBE Package ${stamp}`, code: pkgCode, credits: 500, price: 25.5, currency: 'USD', status: 'ACTIVE' },
  });
  check('POST /super-admin/sms-packages with a numeric price', createPkg.status === 201 || createPkg.status === 200, `${createPkg.status} ${createPkg.text.slice(0, 200)}`);
  const packageId = createPkg.json?.id ?? null;
  cleanup.packageId = packageId;

  if (packageId && probeSchoolId) {
    const dbPkg = await prisma.smsPackage.findUnique({ where: { id: packageId } });
    check('package persisted', dbPkg?.credits === 500 && Number(dbPkg?.price) === 25.5, dbPkg ? `credits=${dbPkg.credits} price=${dbPkg.price} status=${dbPkg.status}` : 'none');

    const before = await prisma.school.findUnique({ where: { id: probeSchoolId } });
    const beforeBalance = Number(before?.smsCreditBalance ?? 0);

    const grant = await call('POST', '/super-admin/sms-credits/topup', platformToken, {
      body: { schoolId: probeSchoolId, packageId, reason: 'PROBE verification grant' },
    });
    check('POST /super-admin/sms-credits/topup (delegated to SmsService)', grant.status === 201 || grant.status === 200, `${grant.status} ${grant.text.slice(0, 160)}`);

    const after = await prisma.school.findUnique({ where: { id: probeSchoolId } });
    const afterBalance = Number(after?.smsCreditBalance ?? 0);
    check('balance moved by exactly the package credits', afterBalance - beforeBalance === 500, `${beforeBalance} -> ${afterBalance}`);

    const grantPurchase = await prisma.smsCreditPurchase.findFirst({
      where: { schoolId: probeSchoolId, packageId, status: 'COMPLETED' },
      orderBy: { purchasedAt: 'desc' },
    });
    check('grant created an SmsCreditPurchase ledger row (real transaction history)', Boolean(grantPurchase), grantPurchase ? `amount=${grantPurchase.amount} provider=${grantPurchase.provider}` : 'none');

    const grantAudit = await prisma.auditLog.findFirst({ where: { schoolId: probeSchoolId, action: 'SMS_CREDIT_GRANTED' } });
    check('grant audited', Boolean(grantAudit), grantAudit ? `by=${grantAudit.userId?.slice(0, 8)}` : 'missing');

    const badGrant = await call('POST', '/super-admin/sms-credits/topup', platformToken, {
      body: { schoolId: probeSchoolId, packageId: '00000000-0000-0000-0000-000000000000', reason: 'PROBE unknown package' },
    });
    check('grant against a nonexistent package is rejected', badGrant.status >= 400 && badGrant.status < 500, `${badGrant.status} ${badGrant.text.slice(0, 120)}`);
    const noDrift = Number((await prisma.school.findUnique({ where: { id: probeSchoolId } }))?.smsCreditBalance ?? 0);
    check('rejected grant did not change the balance', noDrift === afterBalance, `${afterBalance} -> ${noDrift}`);

    // School raises its own purchase, then tries to complete it without paying.
    if (schoolToken) {
      const purchase = await call('POST', '/school/sms/purchase', schoolToken, { body: { packageId }, schoolId: probeSchoolId });
      check('school can raise a credit purchase', purchase.status === 201 || purchase.status === 200, `${purchase.status} ${purchase.text.slice(0, 140)}`);
      const purchaseId = purchase.json?.id ?? purchase.json?.purchase?.id ?? null;

      if (purchaseId) {
        const pending = await prisma.smsCreditPurchase.findUnique({ where: { id: purchaseId } });
        check('school purchase starts PENDING with no credits added', pending?.status === 'PENDING', String(pending?.status));
        const balanceBeforeConfirm = Number((await prisma.school.findUnique({ where: { id: probeSchoolId } }))?.smsCreditBalance ?? 0);

        const selfComplete = await call('POST', `/school/sms/purchases/${purchaseId}/complete`, schoolToken, { schoolId: probeSchoolId });
        check('school can no longer complete its own purchase (free-credit hole closed)', selfComplete.status === 404 || selfComplete.status === 403, `${selfComplete.status} ${selfComplete.text.slice(0, 120)}`);
        const afterSelfComplete = Number((await prisma.school.findUnique({ where: { id: probeSchoolId } }))?.smsCreditBalance ?? 0);
        check('attempted self-completion added no credits', afterSelfComplete === balanceBeforeConfirm, `${balanceBeforeConfirm} -> ${afterSelfComplete}`);

        const confirmNoRef = await call('POST', `/super-admin/sms-packages/purchases/${purchaseId}/confirm`, platformToken, { body: { note: 'PROBE missing reference' } });
        check('confirmation without a payment reference is refused', confirmNoRef.status === 400, `${confirmNoRef.status} ${confirmNoRef.text.slice(0, 140)}`);

        const confirm = await call('POST', `/super-admin/sms-packages/purchases/${purchaseId}/confirm`, platformToken, {
          body: { reference: `PROBE-PAY-${stamp}`, note: 'PROBE bank transfer verified' },
        });
        check('platform confirms the purchase with a reference', confirm.status === 201 || confirm.status === 200, `${confirm.status} ${confirm.text.slice(0, 140)}`);

        const confirmedRow = await prisma.smsCreditPurchase.findUnique({ where: { id: purchaseId } });
        const balanceAfterConfirm = Number((await prisma.school.findUnique({ where: { id: probeSchoolId } }))?.smsCreditBalance ?? 0);
        check(
          'credits are added only after verified confirmation',
          confirmedRow?.status === 'COMPLETED' && balanceAfterConfirm - balanceBeforeConfirm === 500,
          `status=${confirmedRow?.status} ref=${confirmedRow?.externalReference} ${balanceBeforeConfirm} -> ${balanceAfterConfirm}`,
        );

        const doubleConfirm = await call('POST', `/super-admin/sms-packages/purchases/${purchaseId}/confirm`, platformToken, {
          body: { reference: `PROBE-PAY-${stamp}-DOUBLE` },
        });
        check('re-confirming an already-completed purchase is refused (idempotent)', doubleConfirm.status === 409 || doubleConfirm.status === 400, `${doubleConfirm.status} ${doubleConfirm.text.slice(0, 120)}`);
        const noDoubleCredit = Number((await prisma.school.findUnique({ where: { id: probeSchoolId } }))?.smsCreditBalance ?? 0);
        check('double confirmation did not double-credit', noDoubleCredit === balanceAfterConfirm, `${balanceAfterConfirm} -> ${noDoubleCredit}`);
      }
    }

    // Archiving a package that has been bought must be refused: the purchase
    // rows are billing history and would lose their catalogue reference.
    const archiveInUse = await call('POST', `/super-admin/sms-packages/${packageId}/archive`, platformToken, {});
    check('archiving a purchased package is refused (409, protects billing history)', archiveInUse.status === 409, `${archiveInUse.status} ${archiveInUse.text.slice(0, 120)}`);
    check(
      'refused archive left the package status untouched',
      (await prisma.smsPackage.findUnique({ where: { id: packageId } }))?.status !== 'ARCHIVED',
      String((await prisma.smsPackage.findUnique({ where: { id: packageId } }))?.status),
    );

    const deactivate = await call('PATCH', `/super-admin/sms-packages/${packageId}`, platformToken, { body: { status: 'INACTIVE' } });
    check('PATCH deactivates an in-use package instead', deactivate.status === 200 || deactivate.status === 201, `${deactivate.status} ${deactivate.text.slice(0, 120)}`);
    check('package marked INACTIVE', (await prisma.smsPackage.findUnique({ where: { id: packageId } }))?.status === 'INACTIVE');

    // A package nobody has bought can still be archived.
    const freshPkg = await call('POST', '/super-admin/sms-packages', platformToken, {
      body: { name: `PROBE Empty ${stamp}`, code: `${pkgCode}X`, credits: 100, price: 5, currency: 'USD', status: 'ACTIVE' },
    });
    const freshId = freshPkg.json?.id ?? null;
    const archiveFresh = await call('POST', `/super-admin/sms-packages/${freshId}/archive`, platformToken, {});
    check('POST /super-admin/sms-packages/:id/archive on an unused package', archiveFresh.status === 200 || archiveFresh.status === 201, `${archiveFresh.status} ${archiveFresh.text.slice(0, 120)}`);
    check(
      'unused package marked ARCHIVED',
      (await prisma.smsPackage.findUnique({ where: { id: freshId } }))?.status === 'ARCHIVED',
      String((await prisma.smsPackage.findUnique({ where: { id: freshId } }))?.status),
    );

    const txns = await call('GET', '/super-admin/sms-credits/transactions', platformToken);
    const txnRows = Array.isArray(txns.json?.items) ? txns.json.items : Array.isArray(txns.json) ? txns.json : [];
    check('credit transaction history lists the real grants', txnRows.length > 0, `rows=${txnRows.length}`);
  }

  // --------------------------------------------- 4. trial orphan backfill r6
  console.log('\n=== 4. Trial subscription reconciliation (r6) ===');
  // The live database has already been reconciled, so a commit would correctly
  // find nothing to do and prove nothing. Create the orphan state the endpoint
  // exists to repair -- TRIAL tenants with no subscription row -- and remove it
  // again at the end of this section.
  const fixtureIds = [];
  for (const suffix of ['A', 'B']) {
    const fixture = await prisma.school.create({
      data: {
        name: `PROBE Orphan ${stamp}${suffix}`,
        code: `PROBE${stamp.slice(-4)}O${suffix}`,
        slug: `probe-orphan-${stamp.toLowerCase()}${suffix.toLowerCase()}`,
        status: 'TRIAL',
      },
      select: { id: true },
    });
    fixtureIds.push(fixture.id);
  }

  const dry = await call('POST', '/super-admin/schools/backfill-subscriptions', platformToken, {});
  check('POST backfill defaults to a dry run', dry.status === 201 || dry.status === 200, `${dry.status} candidates=${dry.json?.candidates}`);
  check('dry run wrote nothing', dry.json?.dryRun === true && dry.json?.candidates >= 2, `dryRun=${dry.json?.dryRun} candidates=${dry.json?.candidates}`);
  const dryCandidates = dry.json?.candidates ?? 0;
  const fixtureSubsBefore = await prisma.schoolSubscription.count({ where: { schoolId: { in: fixtureIds } } });
  check('dry run created no subscription for the fixtures', fixtureSubsBefore === 0, `count=${fixtureSubsBefore}`);

  const commit = await call('POST', '/super-admin/schools/backfill-subscriptions?dryRun=false', platformToken, {});
  check('commit created the missing subscriptions', commit.status === 201 || commit.status === 200, `granted=${commit.json?.granted} skipped=${commit.json?.skipped}`);
  const fixtureSubs = await prisma.schoolSubscription.findMany({ where: { schoolId: { in: fixtureIds } }, include: { plan: true } });
  check(
    'each orphan fixture now has a real trial subscription',
    fixtureSubs.length === 2 && fixtureSubs.every((s) => s.plan?.trialDays > 0 && s.trialEnd > s.startDate),
    fixtureSubs.map((s) => `${s.schoolId.slice(0, 8)}:${s.status}:${s.plan?.code}`).join(', '),
  );
  const orphansAfter = await prisma.school.count({ where: { status: 'TRIAL', subscription: { is: null } } });
  check('no TRIAL school is left without a subscription', orphansAfter === 0, `remaining=${orphansAfter} (was ${dryCandidates})`);

  const backfillAudit = await prisma.auditLog.findFirst({
    where: { action: 'SUBSCRIPTION_TRIAL_BACKFILLED' },
    orderBy: { createdAt: 'desc' },
  });
  check('backfill audited as one operator action', Boolean(backfillAudit), backfillAudit ? JSON.stringify(backfillAudit.metadata).slice(0, 140) : 'missing');
  // Audit metadata used to arrive mangled because the redactor spread every
  // object it met, turning arrays into {"0":...} maps.
  check(
    'audit metadata arrays are stored as arrays, not rewritten as objects',
    Array.isArray(backfillAudit?.metadata?.grantedSchoolIds),
    backfillAudit?.metadata?.grantedSchoolIds
      ? `${Array.isArray(backfillAudit.metadata.grantedSchoolIds) ? 'array' : typeof backfillAudit.metadata.grantedSchoolIds} of ${
          Array.isArray(backfillAudit.metadata.grantedSchoolIds) ? backfillAudit.metadata.grantedSchoolIds.length : '?'
        }`
      : 'no ids recorded',
  );

  const again = await call('POST', '/super-admin/schools/backfill-subscriptions?dryRun=false', platformToken, {});
  check('second run grants nothing new (idempotent)', again.json?.granted === 0 && again.json?.candidates === 0, `candidates=${again.json?.candidates} granted=${again.json?.granted}`);

  const subsTotal = await prisma.schoolSubscription.count();
  check('billing surfaces are now populated', subsTotal > 0, `subscriptions=${subsTotal}`);

  // Remove the reconciliation fixtures; the real tenants are untouched.
  await prisma.schoolSubscription.deleteMany({ where: { schoolId: { in: fixtureIds } } });
  await prisma.school.deleteMany({ where: { id: { in: fixtureIds } } });
  console.log(`removed ${fixtureIds.length} reconciliation fixture(s)`);

  // ------------------------------------------------------- 5. support tickets
  console.log('\n=== 5. Support ticket module (r5) ===');
  if (probeSchoolId) {
    const create = await call('POST', '/super-admin/tickets', platformToken, {
      body: {
        schoolId: probeSchoolId,
        subject: `PROBE cannot send bulk SMS ${stamp}`,
        description: `PROBE verification ticket raised through the platform API to exercise the full support workflow. Ref ${stamp}.`,
        category: 'SMS',
        priority: 'HIGH',
        notifySchoolAdmins: true,
      },
    });
    check('POST /super-admin/tickets', create.status === 201 || create.status === 200, `${create.status} ref=${create.json?.reference}`);
    const ticketId = create.json?.id ?? null;
    cleanup.ticketId = ticketId;

    if (ticketId) {
      const row = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
      check('ticket persisted with a unique reference', Boolean(row) && Boolean(row?.reference), row ? `${row.reference} status=${row.status}` : 'none');

      const notifyProbe = await prisma.notification.findMany({ where: { schoolId: probeSchoolId, notificationType: 'SUPPORT_TICKET' } });
      check('school administrators were notified in-app', notifyProbe.length > 0, `notifications=${notifyProbe.length}`);
      cleanup.notificationIds = notifyProbe.map((n) => n.id);

      const assign = await call('PATCH', `/super-admin/tickets/${ticketId}/assign`, platformToken, { body: { assigneeId: platformRow.userId } });
      check('PATCH assign', assign.status === 200, `${assign.status} ${assign.text.slice(0, 120)}`);
      const afterAssign = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
      check('assignee stored and OPEN becomes IN_PROGRESS', afterAssign?.assignedToId === platformRow.userId && afterAssign?.status === 'IN_PROGRESS', `assignee=${Boolean(afterAssign?.assignedToId)} status=${afterAssign?.status}`);

      const badAssign = await call('PATCH', `/super-admin/tickets/${ticketId}/assign`, platformToken, { body: { assigneeId: 'not-a-real-user' } });
      check('assigning to an unknown user is refused', badAssign.status >= 400 && badAssign.status < 500, `${badAssign.status}`);

      const reply = await call('POST', `/super-admin/tickets/${ticketId}/messages`, platformToken, {
        body: { body: `PROBE reply: please confirm the Arkesel sender ID on your account. ${stamp}` },
      });
      check('POST public reply', reply.status === 201 || reply.status === 200, `${reply.status}`);
      check('public reply flips the ticket to AWAITING_SCHOOL', (await prisma.supportTicket.findUnique({ where: { id: ticketId } }))?.status === 'AWAITING_SCHOOL');

      const note = await call('POST', `/super-admin/tickets/${ticketId}/messages`, platformToken, {
        body: { body: `PROBE internal note — do not show to school. ${stamp}`, internal: true },
      });
      check('POST internal note', note.status === 201 || note.status === 200, `${note.status}`);

      const platformView = await call('GET', `/super-admin/tickets/${ticketId}`, platformToken);
      const platformMessages = platformView.json?.messages ?? [];
      check('platform sees internal notes', platformMessages.some((m) => m.internal), `messages=${platformMessages.length}`);

      if (otherToken && otherSchoolId) {
        const crossRead = await call('GET', `/school/support/tickets/${ticketId}`, otherToken, { schoolId: otherSchoolId });
        check('another school cannot read this ticket (tenant isolation)', crossRead.status === 404, `${crossRead.status} ${crossRead.text.slice(0, 100)}`);

        const crossWrite = await call('PATCH', `/school/support/tickets/${ticketId}/status`, otherToken, { schoolId: otherSchoolId, body: { status: 'IN_PROGRESS' } });
        check('another school cannot mutate this ticket', crossWrite.status === 404, `${crossWrite.status}`);

        const forbidden = await call('POST', '/super-admin/tickets', otherToken, { body: { schoolId: otherSchoolId, subject: 'PROBE permission test', description: 'A school admin must not reach the platform queue endpoint.' } });
        check('SCHOOL_ADMIN is denied the platform queue endpoint', forbidden.status === 403, `${forbidden.status}`);
      } else {
        check('tenant isolation + permission probes', false, 'no second tenant admin available');
      }

      if (schoolToken) {
        const ownToken = schoolToken;
        const ownView = await call('GET', `/school/support/tickets/${ticketId}`, ownToken, { schoolId: probeSchoolId });
        const ownMessages = ownView.json?.messages ?? [];
        check('owning school reads its ticket', ownView.status === 200, `${ownView.status} messages=${ownMessages.length}`);
        check('internal notes are hidden from the school', ownMessages.length > 0 && !ownMessages.some((m) => m.internal), `visible=${ownMessages.length}`);

        const schoolNote = await call('POST', `/school/support/tickets/${ticketId}/messages`, ownToken, {
          schoolId: probeSchoolId,
          body: { body: `PROBE school reply. ${stamp}`, internal: true },
        });
        check('a school reply cannot be marked internal', schoolNote.status === 201 || schoolNote.status === 200, `${schoolNote.status}`);
        const persisted = await prisma.supportTicketMessage.findFirst({
          where: { ticketId, body: { contains: 'PROBE school reply' } },
        });
        check('a school reply cannot be stored as an internal note', persisted?.internal === false, `internal=${persisted?.internal}`);

        const schoolResolves = await call('PATCH', `/school/support/tickets/${ticketId}/status`, ownToken, {
          schoolId: probeSchoolId,
          body: { status: 'RESOLVED', resolutionNote: 'school claims it fixed itself' },
        });
        check('school cannot mark its own ticket resolved', schoolResolves.status === 400, `${schoolResolves.status} ${schoolResolves.text.slice(0, 140)}`);
      }

      const resolveNoNote = await call('PATCH', `/super-admin/tickets/${ticketId}/status`, platformToken, { body: { status: 'RESOLVED' } });
      check('RESOLVED without a resolution note is refused', resolveNoNote.status === 400, `${resolveNoNote.status} ${resolveNoNote.text.slice(0, 140)}`);

      // Current status here is IN_PROGRESS, and no flow returns a live ticket
      // to OPEN.
      const badFlow = await call('PATCH', `/super-admin/tickets/${ticketId}/status`, platformToken, { body: { status: 'OPEN' } });
      check('illegal transition blocked by the status flow', badFlow.status === 400, `${badFlow.status} ${badFlow.text.slice(0, 160)}`);

      const resolve = await call('PATCH', `/super-admin/tickets/${ticketId}/status`, platformToken, {
        body: { status: 'RESOLVED', resolutionNote: `PROBE resolution: sender ID re-registered and bulk send re-tested. ${stamp}` },
      });
      check('RESOLVED with a note succeeds', resolve.status === 200, `${resolve.status}`);
      const resolvedRow = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
      check('resolution timestamp and note stored', Boolean(resolvedRow?.resolvedAt) && Boolean(resolvedRow?.resolutionNote), resolvedRow?.resolvedAt ? String(resolvedRow.resolvedAt) : 'missing');

      const resolveAgain = await call('PATCH', `/super-admin/tickets/${ticketId}/status`, platformToken, { body: { status: 'RESOLVED' } });
      check('re-resolving the same ticket is refused', resolveAgain.status === 400, `${resolveAgain.status}`);

      const thread = await prisma.supportTicketMessage.count({ where: { ticketId } });
      const statusMsgs = await prisma.supportTicketMessage.count({ where: { ticketId, statusChange: { not: null } } });
      check('resolution history recorded in the thread', thread >= 4 && statusMsgs >= 2, `messages=${thread} statusEntries=${statusMsgs}`);

      const ticketAudit = await prisma.auditLog.count({ where: { module: 'SUPPORT', resourceId: ticketId } });
      check('ticket actions audited', ticketAudit >= 3, `auditRows=${ticketAudit}`);

      const metrics = await call('GET', '/super-admin/tickets/metrics', platformToken);
      check('metrics reflect real rows', metrics.status === 200 && metrics.json?.total >= 1, `total=${metrics.json?.total} resolved=${metrics.json?.resolved}`);
    }
  }

  // ----------------------------------------------------- 6. degraded modes
  console.log('\n=== 6. Health honesty ===');
  const health = await call('GET', '/super-admin/monitoring/health', platformToken);
  const integrations = health.json?.integrations ?? {};
  const unconfigured = Object.entries(integrations).filter(([, v]) => v && v.configured === false).map(([k]) => k);
  check('health distinguishes configured from unconfigured integrations', Object.keys(integrations).length > 0, `unconfigured=[${unconfigured.join(',')}]`);
  const queues = await call('GET', '/super-admin/monitoring/queues', platformToken);
  check('queue endpoint answers', queues.status === 200, `${queues.status} ${queues.text.slice(0, 120)}`);

  console.log(`\n=== SUMMARY === ${results.filter((r) => r.pass).length}/${results.length} passed`);
  const failures = results.filter((r) => !r.pass);
  if (failures.length) {
    console.log('--- FAILED CHECKS ---');
    for (const f of failures) console.log(`  ${f.name}  ${f.detail ?? ''}`);
  }
  // Non-zero on any failure so a wrapper can treat this as a real gate.
  process.exitCode = failures.length ? 1 : 0;
} finally {
  // ------------------------------------------------------------- teardown
  console.log('\n=== TEARDOWN ===');
  try {
    if (cleanup.notificationIds.length) {
      await prisma.notificationDelivery.deleteMany({ where: { notificationId: { in: cleanup.notificationIds } } }).catch(() => {});
      await prisma.notification.deleteMany({ where: { id: { in: cleanup.notificationIds } } });
      console.log(`removed ${cleanup.notificationIds.length} probe notification(s)`);
    }
    if (cleanup.ticketId) {
      await prisma.supportTicket.delete({ where: { id: cleanup.ticketId } }).catch((e) => console.log(`ticket delete skipped: ${e.message}`));
      console.log('removed probe ticket (messages cascade)');
    }
    if (cleanup.schoolId) {
      // notifications.school_id is RESTRICT, so these must go before the tenant.
      const schoolNotifications = await prisma.notification.findMany({
        where: { schoolId: cleanup.schoolId },
        select: { id: true },
      });
      if (schoolNotifications.length) {
        await prisma.notificationDelivery.deleteMany({
          where: { notificationId: { in: schoolNotifications.map((n) => n.id) } },
        });
        await prisma.notification.deleteMany({ where: { schoolId: cleanup.schoolId } });
        console.log(`removed ${schoolNotifications.length} school notification(s)`);
      }
      await prisma.supportTicket.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.smsCreditPurchase.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.schoolSubscription.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.schoolMembership.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.userRole.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.role.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.schoolSetting.deleteMany({ where: { schoolId: cleanup.schoolId } });
      await prisma.school.delete({ where: { id: cleanup.schoolId } }).catch((e) => console.log(`school delete skipped: ${e.message}`));
      console.log('removed probe tenant');
    }
    if (sessions.length) {
      await prisma.userSession.deleteMany({ where: { id: { in: sessions } } });
      console.log(`removed ${sessions.length} probe session(s)`);
    }
    if (cleanup.userId) {
      // After sessions, because user_sessions.user_id is RESTRICT.
      await prisma.userRole.deleteMany({ where: { userId: cleanup.userId } });
      await prisma.schoolMembership.deleteMany({ where: { userId: cleanup.userId } });
      await prisma.user.delete({ where: { id: cleanup.userId } }).catch((e) => console.log(`user delete skipped: ${e.message}`));
      console.log('removed probe admin user');
    }
  } catch (err) {
    console.log(`teardown error (non-fatal): ${err.message}`);
  }
  await prisma.$disconnect();
}
