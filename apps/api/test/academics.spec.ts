import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AcademicYearsService } from '../src/academics/academic-years.service';
import { AppModule } from '../src/app.module';

describe('Academics Management (Integration)', () => {
  let app: INestApplication;
  let academicYearsService: AcademicYearsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    academicYearsService = app.get<AcademicYearsService>(AcademicYearsService);
    await app.init();
  });

  it('should verify academic year service is available', () => {
    expect(academicYearsService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
