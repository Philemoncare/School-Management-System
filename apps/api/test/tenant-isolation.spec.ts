import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tenant Isolation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should not allow School A to access School B students', async () => {
    // 1. Setup Schools
    const schoolA = await prisma.school.create({
      data: { name: 'School A', code: 'SA', slug: 'school-a' }
    });
    const schoolB = await prisma.school.create({
      data: { name: 'School B', code: 'SB', slug: 'school-b' }
    });

    // 2. Setup User in School A
    const userA = await prisma.user.create({
      data: {
        email: 'admin@schoola.com',
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'A',
        memberships: {
          create: { schoolId: schoolA.id, status: 'ACTIVE' }
        }
      }
    });

    // 3. Setup Student in School B
    const studentB = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        firstName: 'Student',
        lastName: 'B',
        studentNumber: 'STB001',
        dateOfBirth: new Date(),
        admissionDate: new Date(),
      }
    });

    // 4. Get Token for User A
    const jwtService = (app as any).get('JwtService');
    const token = jwtService.sign({ sub: userA.id, email: userA.email, roles: ['SCHOOL_ADMIN'] });

    // 5. Attempt to fetch student from School B using School A context
    const response = await request(app.getHttpServer())
      .get(`/students/${studentB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-school-id', schoolA.id);

    // Should fail because the student doesn't belong to the school in the context
    // Even if we provide schoolB.id in header, the TenantGuard would check membership
    expect(response.status).toBe(403);

    const responseWrongHeader = await request(app.getHttpServer())
      .get(`/students/${studentB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-school-id', schoolB.id);

    expect(responseWrongHeader.status).toBe(403); // TenantGuard should block because userA is not in schoolB
  });

  afterAll(async () => {
    await app.close();
  });
});
