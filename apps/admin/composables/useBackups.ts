import { ref } from 'vue';
import type { BackupLogDto, BackupLogListItemDto, BackupLogListQueryDto } from '@dragon/sdk';
import * as backupsApi from '~/features/system/admin-backups.api';

const _backups = ref<BackupLogListItemDto[]>([]);
const _backupsLoading = ref(false);
const _backupsError = ref<string | null>(null);
const _total = ref(0);

const _latest = ref<BackupLogDto | null>(null);
const _latestLoading = ref(false);
const _latestError = ref<string | null>(null);

const _running = ref(false);
const _runSuccess = ref(false);
const _runError = ref<string | null>(null);

export function useBackups() {
  async function loadBackups(params?: BackupLogListQueryDto) {
    _backupsLoading.value = true;
    _backupsError.value = null;

    try {
      const client = useAdminApiClient();
      const result = await backupsApi.listBackups(client, params);
      _backups.value = result.items;
      _total.value = result.total;
    } catch (err) {
      _backupsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری لیست پشتیبان‌ها.';
    } finally {
      _backupsLoading.value = false;
    }
  }

  async function loadLatestBackup() {
    _latestLoading.value = true;
    _latestError.value = null;

    try {
      const client = useAdminApiClient();
      _latest.value = await backupsApi.getLatestBackup(client);
    } catch (err) {
      _latestError.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری آخرین پشتیبان.';
    } finally {
      _latestLoading.value = false;
    }
  }

  async function triggerBackup() {
    _running.value = true;
    _runError.value = null;
    _runSuccess.value = false;

    try {
      const client = useAdminApiClient();
      await backupsApi.runBackup(client);
      _runSuccess.value = true;
    } catch (err) {
      _runError.value =
        err instanceof Error ? err.message : 'خطا در راه‌اندازی پشتیبان‌گیری.';
    } finally {
      _running.value = false;
    }
  }

  return {
    backups: _backups,
    backupsLoading: _backupsLoading,
    backupsError: _backupsError,
    total: _total,
    loadBackups,

    latest: _latest,
    latestLoading: _latestLoading,
    latestError: _latestError,
    loadLatestBackup,

    running: _running,
    runSuccess: _runSuccess,
    runError: _runError,
    triggerBackup,
  };
}
