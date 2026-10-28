import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { validateEnv } from './env';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Queue, QueueEvents, Worker } from 'bullmq';
import {
  isRedisUnavailableError,
  logRedisUnavailable,
} from './redis/redis-connection';

const redisLogger = new Logger('Redis');

/**
 * BullMQ emits `error` on Queue/Worker/QueueEvents instances when the Redis
 * connection drops. With no listener attached, Node prints the full stack for
 * every retry (twice, via BullMQ's own fallback) which floods the console.
 *
 * We intercept those events and log a single throttled warning instead. Real
 * job errors are still logged when Redis is healthy.
 */
function guardEmitterPrototype(prototype: any, label: string) {
  if (!prototype || typeof prototype.emit !== 'function') return;
  if (prototype.__schoolMaRedisGuard) return;

  const originalEmit = prototype.emit;

  prototype.emit = function guardedEmit(
    this: any,
    event: string | symbol,
    ...args: any[]
  ) {
    if (event === 'error' && this.listenerCount?.('error') === 0) {
      const error = args[0];
      if (isRedisUnavailableError(error)) {
        logRedisUnavailable(label);
      } else {
        redisLogger.error(
          `${label} emitted an unhandled error: ${error?.message ?? error}`,
          error?.stack,
        );
      }
      return false;
    }
    return originalEmit.apply(this, args);
  };

  Object.defineProperty(prototype.emit, '__schoolMaRedisGuard', {
    value: true,
  });
  prototype.__schoolMaRedisGuard = true;
}

guardEmitterPrototype(Queue.prototype, 'Background queue');
guardEmitterPrototype(Worker.prototype, 'Background worker');
guardEmitterPrototype(QueueEvents.prototype, 'Queue events listener');

process.on('uncaughtException', (err: any) => {
  if (isRedisUnavailableError(err)) {
    logRedisUnavailable('Uncaught Redis error');
    return;
  }
  redisLogger.error(`Uncaught Exception: ${err?.message ?? err}`, err?.stack);
});

process.on('unhandledRejection', (reason: any) => {
  if (isRedisUnavailableError(reason)) {
    logRedisUnavailable('Unhandled Redis rejection');
    return;
  }
  redisLogger.error(
    `Unhandled Rejection: ${reason?.message ?? reason}`,
    reason?.stack,
  );
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
