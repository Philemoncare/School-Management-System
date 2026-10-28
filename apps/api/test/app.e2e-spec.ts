import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        // Redis is optional in SchooMA. When it is not configured the API is
        // still healthy and reports `degraded`, never `ok`, so assert the real
        // contract instead of a single happy-path value.
        expect(['ok', 'degraded']).toContain(res.body.status);
        expect(res.body.services.database).toBe('up');
        expect(res.body.services.api).toBe('up');
      });
  });
});
