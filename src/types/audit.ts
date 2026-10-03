import type { UserRole } from './index';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'ORGANIZATION_REGISTERED'
  | 'ORGANIZATION_VERIFIED'
  | 'ORGANIZATION_REJECTED'
  | 'ORGANIZATION_SUSPENDED'
  | 'ORGANIZATION_REACTIVATED'
  | 'INVENTORY_ADJUSTED'
  | 'TRANSACTION_CREATED'
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELLED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_RELEASED'
  | 'TRANSFER_DISPATCHED'
  | 'TRANSFER_RECEIVED'
  | 'TRANSFER_CANCELLED'
  | 'EXPIRY_RECORDED'
  | 'PREDICTION_GENERATED'
  | 'ALERT_CREATED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_RESOLVED'
  | 'DEMO_RESET';

export type AuditSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
  id: string; // e.g. 'AUD-202610-8841'
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  organizationId?: string;
  organizationName?: string;
  action: AuditAction;
  entityType: 'ORGANIZATION' | 'REQUEST' | 'RESERVATION' | 'TRANSFER' | 'INVENTORY' | 'TRANSACTION' | 'ALERT' | 'SYSTEM';
  entityId: string;
  severity: AuditSeverity;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}
