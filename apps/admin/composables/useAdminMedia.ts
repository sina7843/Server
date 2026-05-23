import { ref } from 'vue';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  UpdateMediaAssetDto,
} from '@dragon/sdk';
import type { AdminMediaListParams, AdminMediaUploadParams } from '@dragon/sdk';
import * as mediaApi from '~/features/media/admin-media.api';

// ─── Media list ───────────────────────────────────────────────────────────────

const _assets = ref<readonly AdminMediaAssetDto[]>([]);
const _assetsTotal = ref(0);
const _assetsPage = ref(1);
const _assetsLimit = ref(20);
const _assetsLoading = ref(false);
const _assetsError = ref<string | null>(null);

// ─── Single asset ─────────────────────────────────────────────────────────────

const _asset = ref<AdminMediaAssetDto | null>(null);
const _assetLoading = ref(false);
const _assetError = ref<string | null>(null);

// ─── Action state (shared) ───────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminMedia() {
  async function loadMedia(params?: AdminMediaListParams) {
    _assetsLoading.value = true;
    _assetsError.value = null;

    try {
      const res: AdminMediaListResponseDto = await mediaApi.listMedia(useAdminApiClient(), params);
      _assets.value = res.items;
      _assetsTotal.value = res.total;
      _assetsPage.value = res.page;
      _assetsLimit.value = res.limit;
    } catch (err) {
      _assetsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری رسانه‌ها.';
    } finally {
      _assetsLoading.value = false;
    }
  }

  async function loadAsset(id: string) {
    _asset.value = null;
    _assetLoading.value = true;
    _assetError.value = null;

    try {
      _asset.value = await mediaApi.getMedia(useAdminApiClient(), id);
    } catch (err) {
      _assetError.value = err instanceof Error ? err.message : 'خطا در بارگذاری رسانه.';
    } finally {
      _assetLoading.value = false;
    }
  }

  async function uploadMedia(params: AdminMediaUploadParams): Promise<AdminMediaAssetDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await mediaApi.uploadMedia(useAdminApiClient(), params);
      _actionSuccess.value = 'فایل با موفقیت آپلود شد.';
      return res.asset;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در آپلود فایل.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateAsset(
    id: string,
    input: UpdateMediaAssetDto,
  ): Promise<AdminMediaAssetDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await mediaApi.updateMedia(useAdminApiClient(), id, input);
      _asset.value = updated;
      _assets.value = _assets.value.map((a) => (a.id === id ? updated : a));
      _actionSuccess.value = 'تغییرات ذخیره شد.';
      return updated;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ذخیره تغییرات.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function regenerateVariants(id: string): Promise<AdminMediaAssetDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await mediaApi.regenerateVariants(useAdminApiClient(), id);
      _asset.value = updated;
      _assets.value = _assets.value.map((a) => (a.id === id ? updated : a));
      _actionSuccess.value = 'بازسازی واریانت‌ها آغاز شد.';
      return updated;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در بازسازی واریانت‌ها.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deleteAsset(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await mediaApi.deleteMedia(useAdminApiClient(), id);
      _assets.value = _assets.value.filter((a) => a.id !== id);
      if (_asset.value?.id === id) _asset.value = null;
      _actionSuccess.value = 'رسانه حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف رسانه.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  function clearActionState() {
    _actionLoading.value = false;
    _actionError.value = null;
    _actionSuccess.value = null;
  }

  return {
    // List
    assets: _assets,
    assetsTotal: _assetsTotal,
    assetsPage: _assetsPage,
    assetsLimit: _assetsLimit,
    assetsLoading: _assetsLoading,
    assetsError: _assetsError,
    loadMedia,

    // Single asset
    asset: _asset,
    assetLoading: _assetLoading,
    assetError: _assetError,
    loadAsset,

    // Actions
    uploadMedia,
    updateAsset,
    regenerateVariants,
    deleteAsset,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
