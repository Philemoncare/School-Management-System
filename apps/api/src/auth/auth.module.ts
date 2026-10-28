import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailOtpService } from './email-otp.service';
import { SchoolRegistrationService } from './school-registration.service';
import { UsersController } from './users.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  return 'development-only-insecure-secret';
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    EmailOtpService,
    SchoolRegistrationService,
    LocalStrategy,
    JwtStrategy,
  ],
  controllers: [AuthController, UsersController],
  exports: [AuthService],
})
export class AuthModule {}
