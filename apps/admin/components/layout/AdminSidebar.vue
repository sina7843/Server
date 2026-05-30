<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">D</div>
      <div class="brand-text">
        <span class="brand-name">DRAGON</span>
        <span class="brand-sub">Admin Console</span>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="ناوبری اصلی">
      <div v-for="section in navSections" :key="section.label" class="nav-section">
        <div class="nav-section-label">{{ section.label }}</div>
        <AdminNavItem v-for="item in section.items" :key="item.key" :item="item" />
      </div>
    </nav>

    <div class="sidebar-foot">
      <div class="user-row">
        <div class="dr-avatar dr-avatar-sm">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ displayName || 'Admin' }}</div>
          <div class="user-role">مدیر سیستم</div>
        </div>
        <button class="logout-btn" type="button" aria-label="خروج" @click="handleLogout">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminPermissions } from '~/composables/useAdminPermissions';
import { useAdminAuth } from '~/composables/useAdminAuth';

const { visibleNavItems } = useAdminPermissions();
const { displayName, logout } = useAdminAuth();
const router = useRouter();

const userInitial = computed(() =>
  displayName.value ? displayName.value.charAt(0).toUpperCase() : 'A',
);

function handleLogout() {
  logout();
  router.push('/login');
}

const navSections = computed(() => {
  const all = visibleNavItems.value;
  const mainKeys = ['dashboard', 'users', 'roles', 'permissions', 'analytics'];
  const contentKeys = ['content', 'media', 'notifications'];
  const systemKeys = ['system-health', 'backups', 'audit', 'jobs'];

  const main = all.filter((i) => mainKeys.includes(i.key));
  const content = all.filter((i) => contentKeys.includes(i.key));
  const system = all.filter((i) => systemKeys.includes(i.key));
  const rest = all.filter(
    (i) => !mainKeys.includes(i.key) && !contentKeys.includes(i.key) && !systemKeys.includes(i.key),
  );

  const sections = [];
  if (main.length) sections.push({ label: 'اصلی', items: main });
  if (content.length) sections.push({ label: 'محتوا', items: content });
  if (system.length) sections.push({ label: 'سیستم', items: system });
  if (rest.length) sections.push({ label: 'سایر', items: rest });
  return sections;
});
</script>

<style scoped>
.sidebar {
  width: 280px;
  min-height: 100vh;
  background: var(--glass-sidebar);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border-left: 1px solid var(--glass-hairline);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  z-index: var(--z-sticky);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 18px;
  border-bottom: 1px solid var(--glass-border);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #fff;
  box-shadow: var(--glow-primary);
  flex-shrink: 0;
}

.brand-name {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-sub {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  margin-top: 1px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section-label {
  padding: 6px 12px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  font-weight: 600;
  margin-bottom: 4px;
}

.sidebar-foot {
  padding: 12px;
  border-top: 1px solid var(--glass-border);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  background: var(--input-bg);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.logout-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 120ms var(--ease-out);
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--hover-overlay);
  color: var(--danger-400);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-height: unset;
    position: static;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
