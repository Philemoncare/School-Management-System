import { Logger } from '@nestjs/common';

export function validateEnv() {
  const logger = new Logger('EnvValidation');
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];

  const missing = requiredEnv.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    // In production, we might want to exit the process
    // process.exit(1);
  }
}
