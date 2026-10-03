import type { BloodGroup, UserRole } from './index';
import type { Organization } from './organization';
import type { BloodRequest } from './bloodRequest';
import type { BloodReservation } from './reservation';
import type { BloodTransfer } from './transfer';
import type { BloodInventoryTransaction } from './transaction';
import type { HospitalInventoryItem } from '../data/hospitalInventory';
import type { BloodBank } from './matching';
import type { AuditLog } from './audit';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'MONITOR' | 'INFO';
export type AlertType =
  | 'CRITICAL_STOCKOUT'
  | 'EXPIRY_RISK'
  | 'UNFULFILLED_REQUEST'
  | 'RESERVATION_CONFLICT'
  | 'TRANSFER_DELAY'
  | 'ORGANIZATION_VERIFICATION'
  | 'ABNORMAL_ACTIVITY';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface CriticalAlert {
  id: string; // e.g. 'ALT-O-POS-STOCKOUT-01'
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  organizationId: string;
  organizationName: string;
  bloodGroup?: BloodGroup;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  reason: string;
  impactExplanation: string;
  recommendedAction: string;
  relatedEntityType: 'REQUEST' | 'INVENTORY' | 'TRANSFER' | 'ORGANIZATION';
  relatedEntityId: string;
  deduplicationKey: string;
}

export interface SystemEvent {
  id: string;
  type: string;
  timestamp: string;
  actorId: string;
  organizationId?: string;
  entityType: string;
  entityId: string;
  version: number;
  payload?: unknown;
}

export interface AppSettings {
  autoSync: boolean;
  lowStockThresholdLitres: number;
  criticalStockThresholdLitres: number;
  reservationExpiryHours: number;
  networkProtectionEnabled: boolean;
  demoMode: boolean;
  schemaVersion: number;
}

export interface AppSession {
  authenticated: boolean;
  userId: string | null;
  userName: string | null;
  email: string | null;
  organizationId: string | null;
  organizationName: string | null;
  role: UserRole | null;
}

/**
 * Root canonical local-first state for RaktSetu 2.0 (Phase 6)
 */
export interface RaktSetuLocalState {
  schemaVersion: number;
  stateVersion: number;

  session: AppSession;

  organizations: Organization[];
  bloodBanks: BloodBank[];
  hospitalInventory: HospitalInventoryItem[];
  transactions: BloodInventoryTransaction[];
  requests: BloodRequest[];
  reservations: BloodReservation[];
  transfers: BloodTransfer[];
  alerts: CriticalAlert[];
  auditLogs: AuditLog[];
  systemEvents: SystemEvent[];
  settings: AppSettings;

  meta: {
    initializedAt: string;
    lastUpdatedAt: string;
    lastEventId: string | null;
  };
}
