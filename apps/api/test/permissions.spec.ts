import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Regression coverage for portal role guards. Parent and student portals must
 * reject authenticated users who do not hold the matching role, and must still
 * serve the user who does.
 */
describe('Portal Permissions (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ids = {
    school: '',
    users: {} as Record<'parent' | 'teacher' | 'student', string>,
    sessions: {} as Record<'parent' | 'teacher' | 'student', string>,
  };

  const tokens: Record<'parent' | 'teacher' | 'student', string> = {
    parent: '',
    teacher: '',
    student: '',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    jwt = new JwtService({
      secret: process.env.JWT_SECRET || 'development-only-insecure-secret',
    });
    await app.init();

    const school = await prisma.school.create({
      data: {
        name: `Permissions School ${unique}`,
        code: `PERM-${unique}`,
        slug: `permissions-${unique}`,
      },
    });
    ids.school = school.id;

    const roleNames = ['PARENT', 'TEACHER', 'STUDENT'] as const;
    const roles: Record<string, string> = {};
    for (const name of roleNames) {
      const role = await prisma.role.create({
        data: { name, schoolId: school.id, isSystem: true },
      });
      roles[name] = role.id;
    }

    for (const key of ['parent', 'teacher', 'student'] as const) {
      const user = await prisma.user.create({
        data: {
          email: `${key}-${unique}@permissions.test`,
          passwordHash: 'not-used-in-this-test',
          firstName: key,
          lastName: 'User',
          accountState: 'ACTIVE',
          emailVerified: new Date(),
          memberships: { create: { schoolId: school.id, status: 'ACTIVE' } },
        },
      });
      ids.users[key] = user.id;

      const roleName = key.toUpperCase();
      await prisma.userRole.create({
        data: { userId: user.id, roleId: roles[roleName], schoolId: school.id },
      });

      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          tokenHash: `perm-${key}-${unique}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      ids.sessions[key] = session.id;

      tokens[key] = jwt.sign({
        sub: user.id,
        email: user.email,
        sid: session.id,
        roles: [roleName],
      });
    }

    await prisma.student.create({
      data: {
        schoolId: school.id,
        userId: ids.users.student,
        firstName: 'Student',
        lastName: 'User',
        studentNumber: `PERM-ST-${unique}`,
        dateOfBirth: new Date('2012-01-01'),
        admissionDate: new Date(),
      },
    });
  });

  const get = (key: 'parent' | 'teacher' | 'student', path: string) =>
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${tokens[key]}`)
      .set('x-school-id', ids.school);

  it('allows a parent to read the parent portal', async () => {
    const response = await get('parent', '/parent/dashboard');
    expect(response.status).toBe(200);
  });

  it('denies a teacher access to the parent portal', async () => {
    const response = await get('teacher', '/parent/dashboard');
    expect(response.status).toBe(403);
  });

  it('denies a student access to the parent portal', async () => {
    const response = await get('student', '/parent/dashboard');
    expect(response.status).toBe(403);
  });

  it('allows a student to read the student portal', async () => {
    const response = await get('student', '/student/dashboard');
    expect(response.status).toBe(200);
  });

  it('denies a parent access to the student portal', async () => {
    const response = await get('parent', '/student/dashboard');
    expect(response.status).toBe(403);
  });

  it('denies a teacher access to the student portal', async () => {
    const response = await get('teacher', '/student/dashboard');
    expect(response.status).toBe(403);
  });

  afterAll(async () => {
    if (prisma) {
      const userIds = Object.values(ids.users);
      await prisma.student.deleteMany({ where: { schoolId: ids.school } });
      await prisma.guardian.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.schoolMembership.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.securityEvent.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.role.deleteMany({ where: { schoolId: ids.school } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.school.deleteMany({ where: { id: ids.school } });
    }
    await app.close();
  });
});
