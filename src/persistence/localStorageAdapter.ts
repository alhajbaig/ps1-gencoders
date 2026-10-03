import type { RaktSetuLocalState } from '../types/admin';
import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from './storageKeys';
import { migrateState } from './migrationManager';
import { createInitialSeedState } from './seedManager';

export interface PersistenceAdapter {
  getState(): RaktSetuLocalState;
  saveState(state: RaktSetuLocalState): void;
  clearState(): void;
  hasState(): boolean;
  getVersion(): number;
}

export class LocalStorageAdapter implements PersistenceAdapter {
  private cache: RaktSetuLocalState | null = null;

  getState(): RaktSetuLocalState {
    if (this.cache) {
      return this.cache;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CANONICAL_STATE);
      if (!raw) {
        const seed = createInitialSeedState();
        this.saveState(seed);
        this.cache = seed;
        return seed;
      }

      const parsed = JSON.parse(raw);
      const { state, migrated } = migrateState(parsed);
      if (migrated) {
        this.saveState(state);
      }
      this.cache = state;
      return state;
    } catch (e) {
      console.warn('[STORAGE] Failed reading local state, restoring initial seed state:', e);
      const seed = createInitialSeedState();
      this.saveState(seed);
      this.cache = seed;
      return seed;
    }
  }

  saveState(state: RaktSetuLocalState): void {
    try {
      this.cache = state;
      localStorage.setItem(STORAGE_KEYS.CANONICAL_STATE, JSON.stringify(state));
      localStorage.setItem(
        STORAGE_KEYS.METADATA,
        JSON.stringify({
          version: state.schemaVersion,
          stateVersion: state.stateVersion,
          lastUpdatedAt: state.meta.lastUpdatedAt,
        })
      );
    } catch (e) {
      console.error('[STORAGE] Failed to save state to localStorage:', e);
    }
  }

  clearState(): void {
    try {
      this.cache = null;
      localStorage.removeItem(STORAGE_KEYS.CANONICAL_STATE);
      localStorage.removeItem(STORAGE_KEYS.METADATA);
    } catch (e) {
      console.error('[STORAGE] Failed to clear local state:', e);
    }
  }

  hasState(): boolean {
    try {
      return !!localStorage.getItem(STORAGE_KEYS.CANONICAL_STATE);
    } catch {
      return false;
    }
  }

  getVersion(): number {
    return CURRENT_SCHEMA_VERSION;
  }
}

export const storageAdapter = new LocalStorageAdapter();
