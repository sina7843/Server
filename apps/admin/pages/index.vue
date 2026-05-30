<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth-required'] });
await navigateTo('/dashboard', { replace: true });
</script>
