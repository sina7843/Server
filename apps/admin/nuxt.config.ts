import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
});
