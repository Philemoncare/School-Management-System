import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tenant Isolation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const created = { schoolIds: [] as string[], userIds: [] as string[] };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should not allow School A to access School B students', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const schoolA = await prisma.school.create({
      data: { name: `School A ${unique}`, code: `SA-${unique}`, slug: `school-a-${unique}` },
    });
    const schoolB = await prisma.school.create({
      data: { name: `School B ${unique}`, code: `SB-${unique}`, slug: `school-b-${unique}` },
    });
    created.schoolIds.push(schoolA.id, schoolB.id);

    const userA = await prisma.user.create({
      data: {
        email: `admin-${unique}@schoola.com`,
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'A',
        accountState: 'ACTIVE',
        emailVerified: new Date(),
        memberships: {
          create: { schoolId: schoolA.id, status: 'ACTIVE' },
        },
      },
    });

    created.userIds.push(userA.id);

    const studentB = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        firstName: 'Student',
        lastName: 'B',
        studentNumber: `STB-${unique}`,
        dateOfBirth: new Date(),
        admissionDate: new Date(),
      },
    });

    const adminRole = await prisma.role.create({
      data: { name: 'SCHOOL_ADMIN', schoolId: schoolA.id, isSystem: true },
    });

    await prisma.userRole.create({
      data: {
        userId: userA.id,
        roleId: adminRole.id,
        schoolId: schoolA.id,
      },
    });

    const session = await prisma.userSession.create({
      data: {
        userId: userA.id,
        tokenHash: `test-session-${unique}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'development-only-insecure-secret',
    });
    const token = jwtService.sign({
      sub: userA.id,
      email: userA.email,
      sid: session.id,
      roles: ['SCHOOL_ADMIN'],
    });

    const response = await request(app.getHttpServer())
      .get(`/students/${studentB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-school-id', schoolA.id);

    expect(response.status).toBe(404);

    const responseWrongHeader = await request(app.getHttpServer())
      .get(`/students/${studentB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-school-id', schoolB.id);

    expect(responseWrongHeader.status).toBe(403);
  });

  afterAll(async () => {
    if (prisma) {
      for (const userId of created.userIds) {
        await prisma.userSession.deleteMany({ where: { userId } });
        await prisma.userRole.deleteMany({ where: { userId } });
        await prisma.schoolMembership.deleteMany({ where: { userId } });
        await prisma.auditLog.deleteMany({ where: { userId } });
        await prisma.securityEvent.deleteMany({ where: { userId } });
      }

      for (const schoolId of created.schoolIds) {
        await prisma.student.deleteMany({ where: { schoolId } });
        await prisma.userRole.deleteMany({ where: { schoolId } });
        await prisma.role.deleteMany({ where: { schoolId } });
        await prisma.schoolMembership.deleteMany({ where: { schoolId } });
        await prisma.auditLog.deleteMany({ where: { schoolId } });
        await prisma.securityEvent.deleteMany({ where: { schoolId } });
        await prisma.school.deleteMany({ where: { id: schoolId } });
      }

      for (const userId of created.userIds) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    }

    await app.close();
  });
});
