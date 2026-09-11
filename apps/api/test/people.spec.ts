import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StudentsService } from '../src/students/students.service';
import { AppModule } from '../src/app.module';

describe('People Management (Integration)', () => {
  let app: INestApplication;
  let studentsService: StudentsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    studentsService = app.get<StudentsService>(StudentsService);
    await app.init();
  });

  it('should verify student service is available', () => {
    expect(studentsService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
