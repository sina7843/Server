<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-mark">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">DRAGON</span>
        <span class="brand-sub font-en">Admin Console</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav" aria-label="ناوبری اصلی">
      <div v-for="section in navSections" :key="section.label" class="nav-section">
        <div class="nav-section-label">{{ section.label }}</div>
        <AdminNavItem v-for="item in section.items" :key="item.key" :item="item" />
      </div>
    </nav>

    <!-- User footer -->
    <div class="sidebar-foot">
      <div class="user-row">
        <div class="dr-avatar dr-avatar-sm user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ displayName || 'Admin' }}</div>
          <div class="user-role">مدیر سیستم</div>
        </div>
        <button class="logout-btn" type="button" aria-label="خروج" @click="handleLogout">
          <svg
            width="15"
            height="15"
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
    (i) =>
      !mainKeys.includes(i.key) &&
      !contentKeys.includes(i.key) &&
      !systemKeys.includes(i.key),
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
  width: 272px;
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

/* ── Brand ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 18px;
  border-bottom: 1px solid var(--glass-hairline);
  background: linear-gradient(180deg, rgba(109, 40, 217, 0.08), transparent);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow:
    var(--glow-primary),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
  transition:
    box-shadow var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.brand-mark:hover {
  box-shadow:
    var(--glow-primary-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transform: scale(1.04);
}

.brand-name {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.brand-sub {
  display: block;
  font-size: 10.5px;
  color: var(--text-muted);
  margin-top: 1px;
  letter-spacing: 0.02em;
}

/* ── Navigation ── */
.sidebar-nav {
  flex: 1;
  padding: 14px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-section-label {
  padding: 4px 12px 6px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-disabled);
  font-family: var(--font-sans-en);
  font-weight: 600;
}

/* ── User footer ── */
.sidebar-foot {
  padding: 10px;
  border-top: 1px solid var(--glass-hairline);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--hover-overlay);
  border: 1px solid var(--glass-border);
  transition: background var(--motion-fast);
}

.user-row:hover {
  background: var(--hover-overlay-strong);
}

.user-avatar {
  flex-shrink: 0;
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
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--motion-fast),
    color var(--motion-fast);
  flex-shrink: 0;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger-400);
}

/* ── Mobile ── */
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
