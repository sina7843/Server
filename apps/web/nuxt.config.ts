import path from 'path';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiInternalBaseUrl: process.env.API_INTERNAL_BASE_URL,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? 'development',
    },
  },
  typescript: {
    strict: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fa' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&family=Manrope:wght@200..800&family=JetBrains+Mono:wght@400;500;700&family=Markazi+Text:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  vite: {
    clearScreen: false,
  },
  alias: {
    '@dragon/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    '@dragon/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
  },
});
