import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const adminRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',

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

  typescript: {
    strict: true,
    typeCheck: false,
  },
});
