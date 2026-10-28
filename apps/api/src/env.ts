import { Logger } from '@nestjs/common';

export function validateEnv() {
  const logger = new Logger('EnvValidation');
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];

  const missing = requiredEnv.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    logger.error(message);
  }

  if (process.env.NODE_ENV === 'production') {
    if ((process.env.JWT_SECRET || '').length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
      throw new Error('SKIP_EMAIL_VERIFICATION must not be enabled in production');
    }
  }
}
