export type SyncEventType =
  | 'STATE_UPDATED'
  | 'ORGANIZATION_UPDATED'
  | 'INVENTORY_UPDATED'
  | 'TRANSACTION_CREATED'
  | 'REQUEST_CREATED'
  | 'REQUEST_UPDATED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_UPDATED'
  | 'TRANSFER_UPDATED'
  | 'ALERT_UPDATED'
  | 'AUDIT_CREATED'
  | 'DEMO_RESET';

export interface SyncMessage {
  id: string;
  type: SyncEventType;
  timestamp: string;
  senderTabId: string;
  stateVersion: number;
  entityType?: string;
  entityId?: string;
  payload?: unknown;
}
