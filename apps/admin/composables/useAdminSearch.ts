import { ref } from 'vue';
import type { AdminSearchParams } from '@dragon/sdk';
import type { AdminReindexRequestDto, SearchResultItemDto } from '@dragon/types';
import * as searchApi from '~/features/search/admin-search.api';

// ─── Users search state ───────────────────────────────────────────────────────

const _userItems = ref<readonly SearchResultItemDto[]>([]);
const _userTotal = ref(0);
const _userPage = ref(1);
const _userLoading = ref(false);
const _userError = ref<string | null>(null);

// ─── Content search state ─────────────────────────────────────────────────────

const _contentItems = ref<readonly SearchResultItemDto[]>([]);
const _contentTotal = ref(0);
const _contentPage = ref(1);
const _contentLoading = ref(false);
const _contentError = ref<string | null>(null);

// ─── Media search state ───────────────────────────────────────────────────────

const _mediaItems = ref<readonly SearchResultItemDto[]>([]);
const _mediaTotal = ref(0);
const _mediaPage = ref(1);
const _mediaLoading = ref(false);
const _mediaError = ref<string | null>(null);

export function useAdminSearch() {
  async function searchUsers(params?: AdminSearchParams) {
    _userLoading.value = true;
    _userError.value = null;

    try {
      const res = await searchApi.searchUsers(useAdminApiClient(), params);
      _userItems.value = res.items;
      _userTotal.value = res.total;
      _userPage.value = res.page;
    } catch (err) {
      _userError.value = err instanceof Error ? err.message : 'خطا در جستجوی کاربران.';
      _userItems.value = [];
      _userTotal.value = 0;
    } finally {
      _userLoading.value = false;
    }
  }

  async function searchContent(params?: AdminSearchParams) {
    _contentLoading.value = true;
    _contentError.value = null;

    try {
      const res = await searchApi.searchContent(useAdminApiClient(), params);
      _contentItems.value = res.items;
      _contentTotal.value = res.total;
      _contentPage.value = res.page;
    } catch (err) {
      _contentError.value = err instanceof Error ? err.message : 'خطا در جستجوی محتوا.';
      _contentItems.value = [];
      _contentTotal.value = 0;
    } finally {
      _contentLoading.value = false;
    }
  }

  async function searchMedia(params?: AdminSearchParams) {
    _mediaLoading.value = true;
    _mediaError.value = null;

    try {
      const res = await searchApi.searchMedia(useAdminApiClient(), params);
      _mediaItems.value = res.items;
      _mediaTotal.value = res.total;
      _mediaPage.value = res.page;
    } catch (err) {
      _mediaError.value = err instanceof Error ? err.message : 'خطا در جستجوی رسانه‌ها.';
      _mediaItems.value = [];
      _mediaTotal.value = 0;
    } finally {
      _mediaLoading.value = false;
    }
  }

  async function reindex(input?: AdminReindexRequestDto) {
    return searchApi.reindex(useAdminApiClient(), input);
  }

  return {
    // Users
    userItems: _userItems,
    userTotal: _userTotal,
    userPage: _userPage,
    userLoading: _userLoading,
    userError: _userError,

    // Content
    contentItems: _contentItems,
    contentTotal: _contentTotal,
    contentPage: _contentPage,
    contentLoading: _contentLoading,
    contentError: _contentError,

    // Media
    mediaItems: _mediaItems,
    mediaTotal: _mediaTotal,
    mediaPage: _mediaPage,
    mediaLoading: _mediaLoading,
    mediaError: _mediaError,

    // Methods
    searchUsers,
    searchContent,
    searchMedia,
    reindex,
  };
}
