const baseConfig = require('../../packages/config/eslint/base.js');

module.exports = [
  ...baseConfig,
  {
    files: ['nuxt.config.ts'],
    languageOptions: {
      globals: {
        defineNuxtConfig: 'readonly',
      },
    },
  },
  {
    files: ['composables/**/*.ts', 'middleware/**/*.ts'],
    languageOptions: {
      globals: {
        defineNuxtRouteMiddleware: 'readonly',
        navigateTo: 'readonly',
        ref: 'readonly',
        computed: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
      },
    },
  },
  {
    files: ['features/**/*.spec.ts'],
    languageOptions: {
      globals: {
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        global: 'writable',
        it: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
