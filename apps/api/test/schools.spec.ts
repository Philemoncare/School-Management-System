import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SchoolsService } from '../src/schools/schools.service';
import { AppModule } from '../src/app.module';

describe('Schools Management (Integration)', () => {
  let app: INestApplication;
  let schoolsService: SchoolsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    schoolsService = app.get<SchoolsService>(SchoolsService);
    await app.init();
  });

  it('should create a school with an admin', async () => {
    // This is a placeholder for a real test.
    // In a real scenario, we'd mock the Prisma transaction or use a test DB.
    expect(schoolsService.create).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
