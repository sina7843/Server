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
    files: ['composables/**/*.ts', 'middleware/**/*.ts', 'pages/**/*.vue'],
    languageOptions: {
      globals: {
        computed: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        navigateTo: 'readonly',
        ref: 'readonly',
        useCookie: 'readonly',
        useRuntimeConfig: 'readonly',
        useState: 'readonly',
      },
    },
  },
  {
    files: ['features/**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
