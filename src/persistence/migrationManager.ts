import type { RaktSetuLocalState } from '../types/admin';
import { CURRENT_SCHEMA_VERSION } from './storageKeys';
import { createInitialSeedState } from './seedManager';

export interface MigrationResult {
  migrated: boolean;
  state: RaktSetuLocalState;
  fromVersion?: number;
  toVersion: number;
}

/**
 * Migration Manager for RaktSetu local-first state
 */
export function migrateState(rawState: unknown): MigrationResult {
  if (!rawState || typeof rawState !== 'object') {
    return {
      migrated: true,
      state: createInitialSeedState(),
      toVersion: CURRENT_SCHEMA_VERSION,
    };
  }

  const candidate = rawState as Partial<RaktSetuLocalState>;
  const version = candidate.schemaVersion || 1;

  if (version === CURRENT_SCHEMA_VERSION && candidate.organizations && candidate.hospitalInventory) {
    // Current valid schema version
    return {
      migrated: false,
      state: candidate as RaktSetuLocalState,
      toVersion: CURRENT_SCHEMA_VERSION,
    };
  }

  console.info(`[MIGRATION] Migrating RaktSetu state from version ${version} to ${CURRENT_SCHEMA_VERSION}`);

  // Re-seed with preserved session if available
  const fresh = createInitialSeedState();
  if (candidate.session && candidate.session.role) {
    fresh.session = candidate.session;
  }

  return {
    migrated: true,
    state: fresh,
    fromVersion: version,
    toVersion: CURRENT_SCHEMA_VERSION,
  };
}
