/**
 * Namespaced localStorage keys for RaktSetu 2.0 (Phase 6)
 */
export const STORAGE_KEYS = {
  CANONICAL_STATE: 'raktsetu:v6:state',
  SESSION: 'raktsetu:v6:session',
  SETTINGS: 'raktsetu:v6:settings',
  METADATA: 'raktsetu:v6:meta',
  SYNC_CHANNEL: 'raktsetu_network_sync_v6',
  LOCAL_EVENT_NAME: 'raktsetu_state_changed_v6',
  RESET_EVENT_NAME: 'raktsetu_demo_reset_v6',
} as const;

export const CURRENT_SCHEMA_VERSION = 6;
