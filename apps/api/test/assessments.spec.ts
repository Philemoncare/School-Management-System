import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AssessmentsService } from '../src/assessments/assessments.service';
import { AppModule } from '../src/app.module';

describe('Assessments Management (Integration)', () => {
  let app: INestApplication;
  let assessmentsService: AssessmentsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    assessmentsService = app.get<AssessmentsService>(AssessmentsService);
    await app.init();
  });

  it('should verify assessments service is available', () => {
    expect(assessmentsService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
