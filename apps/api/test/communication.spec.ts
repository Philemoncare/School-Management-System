import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from '../src/communication/communication.service';
import { AppModule } from '../src/app.module';

describe('Communication System (Integration)', () => {
  let service: CommunicationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = moduleFixture.get<CommunicationService>(CommunicationService);
  });

  it('should verify communication service is available', () => {
    expect(service).toBeDefined();
  });
});
