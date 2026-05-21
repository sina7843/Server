<template>
  <div class="admin-shell">
    <AdminTopbar />
    <div class="admin-body">
      <AdminSidebar />
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f9fa;
}

.admin-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .admin-body {
    flex-direction: column;
  }
}
</style>
