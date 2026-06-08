<template>
  <NuxtLink :to="item.path" class="nav-item" active-class="nav-item--active">
    <span class="nav-icon" aria-hidden="true">
      <component :is="iconComponent" />
    </span>
    <span class="nav-label">{{ item.label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import type { AdminNavItem } from '~/features/navigation/admin-navigation';

const props = defineProps<{ item: AdminNavItem }>();

const ICONS: Record<string, string> = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  users:
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  roles: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  permissions: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  content:
    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  media:
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  'system-health': 'M22 12h-4l-3 9L9 3l-3 9H2',
  backups: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  audit: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  jobs: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  notifications: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
};

const iconComponent = computed(() =>
  defineComponent({
    render() {
      const pathData = ICONS[props.item.key] ?? 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0';
      const paths = pathData.split(' M').map((p, i) => (i === 0 ? p : 'M' + p));
      return h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        paths.map((d) => h('path', { d })),
      );
    },
  }),
);
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms var(--ease-out);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--hover-overlay);
  color: var(--text-primary);
}

.nav-item--active {
  background: linear-gradient(270deg, rgba(109, 40, 217, 0.16), rgba(109, 40, 217, 0.04));
  color: var(--text-primary);
  box-shadow: inset 2px 0 0 var(--purple-400);
}

.nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.8;
}

.nav-item--active .nav-icon {
  opacity: 1;
  color: var(--purple-300);
}

.nav-label {
  flex: 1;
}
</style>
