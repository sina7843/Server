import path from 'path';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiInternalBaseUrl: process.env.API_INTERNAL_BASE_URL,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3002',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? 'development',
    },
  },
  typescript: {
    strict: true,
  },
  alias: {
    '@dragon/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    '@dragon/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
  },
});
