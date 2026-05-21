import { defineNuxtConfig } from 'nuxt/config';
import { fileURLToPath, URL } from 'node:url';

export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },
  vite: {
    resolve: {
      alias: {
        '@dragon/types': fileURLToPath(
          new URL('../../packages/types/src/index.ts', import.meta.url),
        ),
      },
    },
  },
});
