<template>
  <ErrorState label="خطایی رخ داد" message="لطفاً بعداً دوباره تلاش کنید." />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }], title: 'Error' });
</script>
