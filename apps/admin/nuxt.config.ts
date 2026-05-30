import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const adminRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',

  ssr: false,

  srcDir: '.',

  alias: {
    '~': adminRoot,
    '@': adminRoot,
    '@dragon/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)),
    '@dragon/sdk': fileURLToPath(new URL('../../packages/sdk/src/index.ts', import.meta.url)),
  },

  imports: {
    autoImport: true,
    dirs: ['composables', 'features/**'],
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
      adminUrl: process.env.NUXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? 'development',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fa' },
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
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
});
