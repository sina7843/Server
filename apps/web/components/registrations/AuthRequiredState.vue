<template>
  <div class="auth-required-state" role="status">
    <p>You must be signed in to register for this tournament.</p>
    <a href="/login" class="sign-in-link">Sign in</a>
  </div>
</template>

<style scoped>
.auth-required-state {
  display: grid;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.sign-in-link {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: #2563eb;
  color: #fff;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
}

.sign-in-link:hover {
  background: #1d4ed8;
}
</style>
