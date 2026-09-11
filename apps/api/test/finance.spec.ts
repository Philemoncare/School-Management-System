import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FinanceService } from '../src/finance/finance.service';
import { AppModule } from '../src/app.module';

describe('Finance Management (Integration)', () => {
  let app: INestApplication;
  let financeService: FinanceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    financeService = app.get<FinanceService>(FinanceService);
    await app.init();
  });

  it('should verify finance service is available', () => {
    expect(financeService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
