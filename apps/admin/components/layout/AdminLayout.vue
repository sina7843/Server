<template>
  <div class="admin-shell">
    <AdminSidebar />
    <div class="admin-main">
      <AdminTopbar />
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  direction: rtl;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}

@media (max-width: 768px) {
  .admin-shell {
    flex-direction: column;
  }

  .admin-content {
    padding: 20px 16px;
  }
}
</style>
