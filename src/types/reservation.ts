import type { BloodGroup } from './index';

export type ReservationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'FULFILLED'
  | 'RELEASED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface BloodReservation {
  id: string;
  reservationId: string; // e.g. RES-2026-0891
  requestId: string;
  bloodBankId: string;
  bloodBankName: string;
  hospitalId: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  quantityLitres: number;
  status: ReservationStatus;
  expiresAt: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string;
  transferDispatchedAt?: string;
  transferReceivedAt?: string;
  notes?: string;
}

export interface CreateReservationInput {
  requestId: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: BloodGroup;
  quantityLitres: number;
  durationHours?: number; // defaults to 4 hours
  createdBy?: string;
  notes?: string;
}
