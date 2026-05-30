import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { getCorsConfig } from './config/cors.config';

const JSON_BODY_LIMIT = '1mb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Remove Express server fingerprint header
  app.disable('x-powered-by');

  // JSON and URL-encoded body size limits — prevents oversized payload attacks
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: JSON_BODY_LIMIT });

  // CORS — allowlist driven by CORS_ALLOWED_ORIGINS env; wildcard never used with credentials
  const { allowedOrigins } = getCorsConfig();
  app.enableCors({
    origin: allowedOrigins.length > 0 ? (allowedOrigins as string[]) : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env['PORT'] ? Number(process.env['PORT']) : 4000;

  await app.listen(port);
}

void bootstrap();
