const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { spawn } = require('child_process');

async function waitForServer(port, maxWaitMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/api/v1/health`, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Server did not respond on port ${port} within ${maxWaitMs / 1000} seconds`);
}

async function testVerification() {
  console.log('--- STARTING VERIFICATION ---');
  const prisma = new PrismaClient();

  // 0. Spawn backend NestJS server
  console.log('0. Spawning NestJS API server on port 4000...');
  const serverProcess = spawn('node', ['dist/src/main.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, SKIP_EMAIL_VERIFICATION: 'true', PORT: '4000', NODE_ENV: 'development' }
  });

  await waitForServer(4000, 30000);
  console.log('   NestJS API Server is running and responding on port 4000!');

  try {
    // 1. Check DB connectivity
    const dbName = await prisma.$queryRaw`SELECT current_database() as db`;
    console.log('1. DB Connection:', dbName[0].db);

    // 2. Test HTTP API server endpoint: POST /api/v1/auth/register-school
    const testTimestamp = Date.now();
    const testSchoolCode = `TST${testTimestamp.toString().slice(-4)}`;
    const testSlug = `test-school-${testTimestamp}`;
    const testEmail = `admin.${testTimestamp}@testschool.edu`;
    const testPassword = 'Password123!@#';

    const payload = JSON.stringify({
      school: {
        name: `Test Academy ${testTimestamp}`,
        code: testSchoolCode,
        slug: testSlug,
        timezone: 'UTC',
        currency: 'USD',
        email: testEmail,
      },
      admin: {
        firstName: 'Test',
        lastName: 'Admin',
        email: testEmail,
        password: testPassword,
      },
      setup: {
        academicYearName: '2025/2026',
        academicYearStart: '2025-09-01',
        academicYearEnd: '2026-06-30',
        terms: [
          { name: 'Term 1', startDate: '2025-09-01', endDate: '2025-12-20' }
        ],
        classes: [
          { name: 'Grade 1', code: 'G1', sections: ['A'] }
        ]
      },
      consentToTerms: true,
    });

    console.log('2. Sending POST /api/v1/auth/register-school to port 4000...');

    const regOptions = {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/v1/auth/register-school',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const regResult = await new Promise((resolve, reject) => {
      const req = http.request(regOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });

    console.log('   Registration Status:', regResult.statusCode);
    console.log('   Registration Response:', JSON.stringify(regResult.body));

    if (regResult.statusCode !== 201 && regResult.statusCode !== 200) {
      throw new Error(`Registration failed with status ${regResult.statusCode}: ${JSON.stringify(regResult.body)}`);
    }

    // 3. Verify database records
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { memberships: { include: { school: true } } }
    });

    console.log('3. Database User Verification:');
    console.log('   User ID:', createdUser?.id);
    console.log('   Email:', createdUser?.email);
    console.log('   Account State:', createdUser?.accountState);
    console.log('   Email Verified At:', createdUser?.emailVerified);
    console.log('   Memberships count:', createdUser?.memberships?.length);
    console.log('   School Name:', createdUser?.memberships[0]?.school?.name);

    if (!createdUser) {
      throw new Error('User record was not found in database!');
    }
    if (createdUser.accountState !== 'ACTIVE') {
      throw new Error(`Expected Account State ACTIVE, got ${createdUser.accountState}`);
    }

    // 4. Test Login via POST /api/v1/auth/login
    console.log('4. Testing Login via POST /api/v1/auth/login...');
    const loginPayload = JSON.stringify({
      email: testEmail,
      password: testPassword,
    });

    const loginOptions = {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
      },
    };

    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(loginPayload);
      req.end();
    });

    console.log('   Login Status:', loginResult.statusCode);
    console.log('   Access Token received:', !!loginResult.body?.access_token);
    console.log('   User ID in login response:', loginResult.body?.user?.id);

    if (loginResult.statusCode !== 200 && loginResult.statusCode !== 201) {
      throw new Error(`Login failed with status ${loginResult.statusCode}: ${JSON.stringify(loginResult.body)}`);
    }

    console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');

    // Cleanup test user & school
    if (createdUser) {
      const schoolId = createdUser.memberships[0]?.schoolId;
      await prisma.userRole.deleteMany({ where: { userId: createdUser.id } });
      await prisma.schoolMembership.deleteMany({ where: { userId: createdUser.id } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: createdUser.id } });
      await prisma.auditLog.deleteMany({ where: { userId: createdUser.id } });
      await prisma.securityEvent.deleteMany({ where: { userId: createdUser.id } });
      await prisma.userSession.deleteMany({ where: { userId: createdUser.id } });
      await prisma.user.delete({ where: { id: createdUser.id } });
      if (schoolId) {
        await prisma.schoolSetting.deleteMany({ where: { schoolId } });
        await prisma.section.deleteMany({ where: { class: { schoolId } } });
        await prisma.class.deleteMany({ where: { schoolId } });
        await prisma.term.deleteMany({ where: { academicYear: { schoolId } } });
        await prisma.academicYear.deleteMany({ where: { schoolId } });
        await prisma.role.deleteMany({ where: { schoolId } });
        await prisma.school.delete({ where: { id: schoolId } });
      }
      console.log('   Cleanup completed.');
    }

  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exitCode = 1;
  } finally {
    serverProcess.kill('SIGTERM');
    await prisma.$disconnect();
  }
}

testVerification();
