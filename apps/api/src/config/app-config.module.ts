import { Global, Module } from '@nestjs/common';
import { getAuthConfig } from './auth.config';
import { getBullMQConfig, BULLMQ_CONFIG } from './redis.config';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: getAuthConfig,
    },
    {
      provide: BULLMQ_CONFIG,
      useFactory: getBullMQConfig,
    },
  ],
  exports: [AUTH_CONFIG, BULLMQ_CONFIG],
})
export class AppConfigModule {}
