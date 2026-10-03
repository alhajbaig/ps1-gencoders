import type { BloodGroup } from './index';

export type TransferStatus = 'SCHEDULED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type TransferUrgency = 'ROUTINE' | 'ELEVATED' | 'CRITICAL';

export interface BloodTransfer {
  id: string; // e.g. 'TR-202610-1042'
  transferId: string;
  requestId: string;
  reservationId?: string;
  fromOrganizationId: string;
  fromOrganizationName: string;
  toOrganizationId: string;
  toOrganizationName: string;
  bloodGroup: BloodGroup;
  quantityUnits: number; // units/litres
  status: TransferStatus;
  urgency: TransferUrgency;
  dispatchedAt?: string;
  deliveredAt?: string;
  estimatedArrivalMinutes?: number;
  temperatureColdChainCelsius?: number;
  courierDetails?: {
    carrier: string;
    trackingRef: string;
    contactNumber: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
