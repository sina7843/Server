import { ref } from 'vue';
import type {
  AdminNotificationsListParams,
  NotificationLogDto,
  NotificationLogListItemDto,
} from '@dragon/sdk';
import * as notificationsApi from '~/features/notifications/admin-notifications.api';

const _logs = ref<readonly NotificationLogListItemDto[]>([]);
const _logsTotal = ref(0);
const _logsPage = ref(1);
const _logsLoading = ref(false);
const _logsError = ref<string | null>(null);

const _log = ref<NotificationLogDto | null>(null);
const _logLoading = ref(false);
const _logError = ref<string | null>(null);

export function useNotificationLogs() {
  async function loadNotificationLogs(params?: AdminNotificationsListParams) {
    _logsLoading.value = true;
    _logsError.value = null;

    try {
      const res = await notificationsApi.listNotificationLogs(useAdminApiClient(), params);
      _logs.value = res.items;
      _logsTotal.value = res.total;
      _logsPage.value = res.page;
    } catch (err) {
      _logsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری لاگ‌های اعلان.';
    } finally {
      _logsLoading.value = false;
    }
  }

  async function loadNotificationLog(id: string) {
    _log.value = null;
    _logLoading.value = true;
    _logError.value = null;

    try {
      const res = await notificationsApi.getNotificationLog(useAdminApiClient(), id);
      _log.value = res;
    } catch (err) {
      _logError.value = err instanceof Error ? err.message : 'خطا در بارگذاری جزئیات اعلان.';
    } finally {
      _logLoading.value = false;
    }
  }

  return {
    logs: _logs,
    logsTotal: _logsTotal,
    logsPage: _logsPage,
    logsLoading: _logsLoading,
    logsError: _logsError,

    log: _log,
    logLoading: _logLoading,
    logError: _logError,

    loadNotificationLogs,
    loadNotificationLog,
  };
}
