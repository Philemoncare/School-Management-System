import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ResultsService } from '../src/results/results.service';
import { AppModule } from '../src/app.module';

describe('Results Management (Integration)', () => {
  let app: INestApplication;
  let resultsService: ResultsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    resultsService = app.get<ResultsService>(ResultsService);
    await app.init();
  });

  it('should verify results service is available', () => {
    expect(resultsService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
