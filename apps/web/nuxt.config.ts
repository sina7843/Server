import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
});
