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
    files: [
      'composables/**/*.ts',
      'middleware/**/*.ts',
      'pages/**/*.vue',
      'layouts/**/*.vue',
      'components/**/*.vue',
    ],
    languageOptions: {
      globals: {
        defineNuxtRouteMiddleware: 'readonly',
        definePageMeta: 'readonly',
        navigateTo: 'readonly',
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        onMounted: 'readonly',
        useHead: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useRuntimeConfig: 'readonly',
        useAdminApiClient: 'readonly',
        useAdminAuthState: 'readonly',
        useAdminDashboard: 'readonly',
        useAdminPermissions: 'readonly',
        useAdminRoles: 'readonly',
        useAdminSystem: 'readonly',
        useAdminUsers: 'readonly',
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
