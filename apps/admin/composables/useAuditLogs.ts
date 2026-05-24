import { ref } from 'vue';
import type { AdminAuditListParams, AuditLogDetailDto, AuditLogListItemDto } from '@dragon/sdk';
import * as auditApi from '~/features/audit/admin-audit.api';

const _logs = ref<readonly AuditLogListItemDto[]>([]);
const _logsTotal = ref(0);
const _logsPage = ref(1);
const _logsLoading = ref(false);
const _logsError = ref<string | null>(null);

const _log = ref<AuditLogDetailDto | null>(null);
const _logLoading = ref(false);
const _logError = ref<string | null>(null);

export function useAuditLogs() {
  async function loadAuditLogs(params?: AdminAuditListParams) {
    _logsLoading.value = true;
    _logsError.value = null;

    try {
      const res = await auditApi.listAuditLogs(useAdminApiClient(), params);
      _logs.value = res.items;
      _logsTotal.value = res.total;
      _logsPage.value = res.page;
    } catch (err) {
      _logsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری لاگ‌های حسابرسی.';
    } finally {
      _logsLoading.value = false;
    }
  }

  async function loadAuditLog(id: string) {
    _log.value = null;
    _logLoading.value = true;
    _logError.value = null;

    try {
      const res = await auditApi.getAuditLog(useAdminApiClient(), id);
      _log.value = res;
    } catch (err) {
      _logError.value = err instanceof Error ? err.message : 'خطا در بارگذاری لاگ حسابرسی.';
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

    loadAuditLogs,
    loadAuditLog,
  };
}
