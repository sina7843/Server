import { Global, Module } from '@nestjs/common';
import { getAuthConfig } from './auth.config';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: getAuthConfig,
    },
  ],
  exports: [AUTH_CONFIG],
})
export class AppConfigModule {}
