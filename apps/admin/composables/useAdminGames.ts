import { ref } from 'vue';
import type { GamesListParams } from '@dragon/sdk';
import type { GameDto, GameListResponseDto } from '@dragon/types';
import type { CreateGameInput, UpdateGameInput } from '~/features/games/admin-games.api';
import * as gamesApi from '~/features/games/admin-games.api';

// ─── Games list ───────────────────────────────────────────────────────────────

const _games = ref<readonly GameDto[]>([]);
const _gamesTotal = ref(0);
const _gamesPage = ref(1);
const _gamesLimit = ref(20);
const _gamesLoading = ref(false);
const _gamesError = ref<string | null>(null);

// ─── Single game ──────────────────────────────────────────────────────────────

const _game = ref<GameDto | null>(null);
const _gameLoading = ref(false);
const _gameError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminGames() {
  async function loadGames(params?: GamesListParams) {
    _gamesLoading.value = true;
    _gamesError.value = null;

    try {
      const res: GameListResponseDto = await gamesApi.listGames(useAdminApiClient(), params);
      _games.value = res.items;
      _gamesTotal.value = res.total;
      _gamesPage.value = res.page;
      _gamesLimit.value = res.limit;
    } catch (err) {
      _gamesError.value = err instanceof Error ? err.message : 'خطا در بارگذاری بازی‌ها.';
    } finally {
      _gamesLoading.value = false;
    }
  }

  async function loadGame(id: string) {
    _game.value = null;
    _gameLoading.value = true;
    _gameError.value = null;

    try {
      _game.value = await gamesApi.getGame(useAdminApiClient(), id);
    } catch (err) {
      _gameError.value = err instanceof Error ? err.message : 'خطا در بارگذاری بازی.';
    } finally {
      _gameLoading.value = false;
    }
  }

  async function createGame(input: CreateGameInput): Promise<GameDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const created = await gamesApi.createGame(useAdminApiClient(), input);
      _actionSuccess.value = 'بازی با موفقیت ایجاد شد.';
      return created;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد بازی.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateGame(id: string, input: UpdateGameInput): Promise<GameDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await gamesApi.updateGame(useAdminApiClient(), id, input);
      _game.value = updated;
      _games.value = _games.value.map((g) => (g.id === id ? updated : g));
      _actionSuccess.value = 'تغییرات ذخیره شد.';
      return updated;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش بازی.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deleteGame(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await gamesApi.deleteGame(useAdminApiClient(), id);
      _games.value = _games.value.filter((g) => g.id !== id);
      if (_game.value?.id === id) _game.value = null;
      _actionSuccess.value = 'بازی حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف بازی.';
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
    games: _games,
    gamesTotal: _gamesTotal,
    gamesPage: _gamesPage,
    gamesLimit: _gamesLimit,
    gamesLoading: _gamesLoading,
    gamesError: _gamesError,
    loadGames,

    // Single game
    game: _game,
    gameLoading: _gameLoading,
    gameError: _gameError,
    loadGame,

    // Actions
    createGame,
    updateGame,
    deleteGame,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
