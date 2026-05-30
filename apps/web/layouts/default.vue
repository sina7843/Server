<template>
  <div class="site-shell">
    <AppHeader />
    <div class="site-body">
      <slot />
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
.site-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-body {
  flex: 1;
}
</style>
