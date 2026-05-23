import path from 'path';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
  alias: {
    '@dragon/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    '@dragon/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
  },
});
