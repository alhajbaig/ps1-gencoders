import type { BloodGroup } from './index';

export type TransactionType =
  | 'ISSUED'
  | 'RECEIVED'
  | 'TRANSFERRED_IN'
  | 'TRANSFERRED_OUT'
  | 'EXPIRED'
  | 'ADJUSTMENT';

export type TransactionStatus = 'VERIFIED' | 'DRAFT' | 'VOIDED';

export type ReferenceType =
  | 'PATIENT_TRANSFUSION'
  | 'NETWORK_REFILL'
  | 'EXPIRY'
  | 'RECONCILIATION_AUDIT'
  | 'TRANSFER';

export interface BloodInventoryTransaction {
  id: string; // uuid
  transactionId: string; // e.g. TXN-10241
  organizationId: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  transactionType: TransactionType;
  quantityLitres: number; // positive number; direction indicated by type
  quantityBefore: number;
  quantityAfter: number;
  referenceType?: ReferenceType;
  referenceId?: string; // e.g. REQ-2026-00421
  patientCaseId?: string; // e.g. P1024
  department?: string; // e.g. Emergency, Trauma ICU, General Surgery
  reason?: string;
  notes?: string;
  performedBy: string;
  verifiedBy: string;
  status: TransactionStatus;
  occurredAt: string; // ISO string
  createdAt: string; // ISO string
  metadata?: Record<string, unknown>;
}

export interface RecordUsageInput {
  bloodGroup: BloodGroup;
  quantityLitres: number;
  patientCaseId: string;
  department: string;
  reason: string;
  notes?: string;
  occurredAt?: string;
  performedBy?: string;
  verifiedBy?: string;
}

export interface ReconciliationRecord {
  bloodGroup: BloodGroup;
  openingStock: number;
  received: number;
  transfersIn: number;
  issued: number;
  transfersOut: number;
  expired: number;
  adjustments: number;
  calculatedSystemStock: number;
  verifiedPhysicalStock: number;
  discrepancy: number; // calculatedSystemStock - verifiedPhysicalStock
  status: 'balanced' | 'discrepancy';
  lastReconciledAt: string;
}

export interface ReconciliationAdjustmentInput {
  bloodGroup: BloodGroup;
  physicalCount: number;
  reason: string;
  notes?: string;
  performedBy: string;
  verifiedBy: string;
}
