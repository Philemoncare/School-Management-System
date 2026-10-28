import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { validateEnv } from './env';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Queue } from 'bullmq';

// Prevent unhandled 'error' events on BullMQ Queue instances from crashing Node when Redis is offline
const originalQueueEmit = Queue.prototype.emit;
Queue.prototype.emit = function (event: string | symbol, ...args: any[]) {
  if (event === 'error' && this.listenerCount('error') === 0) {
    return true;
  }
  return originalQueueEmit.call(this, event, ...args);
};

process.on('uncaughtException', (err: any) => {
  if (err?.code === 'ECONNREFUSED' && (err?.address === '127.0.0.1' || err?.port === 6379 || err?.message?.includes('6379'))) {
    return;
  }
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'ECONNREFUSED' && (reason?.address === '127.0.0.1' || reason?.port === 6379 || reason?.message?.includes('6379'))) {
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate environment variables
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || '').split(','),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));

  const developmentOrigins =
    process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
        ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...developmentOrigins]),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-school-id', 'x-device-id', 'x-correlation-id'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
