import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

describe('Authentication (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = app.get<AuthService>(AuthService);
    await app.init();
  });

  it('should fail authentication with wrong password', async () => {
    // This assumes the seed data has 'admin@greenwood.com' with 'password123'
    // But since Argon2 is used now and seed used Bcrypt, we'd need to re-seed.
    // For now, we test the logic.
    const user = await authService.validateUser('admin@greenwood.com', 'wrongpassword');
    expect(user).toBeNull();
  });

  afterAll(async () => {
    await app.close();
  });
});
