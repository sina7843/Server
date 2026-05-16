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
];
