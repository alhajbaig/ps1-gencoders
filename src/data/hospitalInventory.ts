import type { BloodGroup } from '../types';

export type InventoryStatus = 'healthy' | 'monitor' | 'attention' | 'critical';
export type DemandLevel = 'Low' | 'Medium' | 'High';

export interface HospitalInventoryItem {
  id: string;
  organizationId: string;
  bloodGroup: BloodGroup;
  availableQuantity: number; // in Liters
  reservedQuantity: number;  // in Liters
  unit: 'L';
  expiryDate: string;        // YYYY-MM-DD
  demandLevel: DemandLevel;
  status: InventoryStatus;
  prediction?: {
    predictedDepletionHours: number;
    trend: 'rising' | 'stable' | 'depleting';
  };
  notes?: string;
  updatedAt: string;
}

export interface InventoryActivityItem {
  id: string;
  timestamp: string;
  timeFormatted: string; // e.g. '10:42 AM'
  bloodGroup: BloodGroup;
  action: 'updated' | 'reserved' | 'status_change';
  description: string;
  delta?: string;        // e.g. '+1.0 L'
  statusType?: InventoryStatus;
}

export interface InventorySummary {
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  atRiskCount: number;
  statusCounts: Record<InventoryStatus, number>;
}

export const INITIAL_HOSPITAL_INVENTORY: HospitalInventoryItem[] = [
  {
    id: 'inv-aplus',
    organizationId: 'HSP-00124',
    bloodGroup: 'A+',
    availableQuantity: 3.0,
    reservedQuantity: 0.5,
    unit: 'L',
    expiryDate: '2026-10-24',
    demandLevel: 'Medium',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 48,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T10:15:00Z',
  },
  {
    id: 'inv-aminus',
    organizationId: 'HSP-00124',
    bloodGroup: 'A-',
    availableQuantity: 1.0,
    reservedQuantity: 0.2,
    unit: 'L',
    expiryDate: '2026-10-18',
    demandLevel: 'Medium',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 24.5,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T09:30:00Z',
  },
  {
    id: 'inv-bplus',
    organizationId: 'HSP-00124',
    bloodGroup: 'B+',
    availableQuantity: 4.0,
    reservedQuantity: 0.5,
    unit: 'L',
    expiryDate: '2026-10-28',
    demandLevel: 'Low',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 64,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T09:48:00Z',
  },
  {
    id: 'inv-bminus',
    organizationId: 'HSP-00124',
    bloodGroup: 'B-',
    availableQuantity: 0.5,
    reservedQuantity: 0.1,
    unit: 'L',
    expiryDate: '2026-10-14',
    demandLevel: 'Low',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 36.0,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T08:50:00Z',
  },
  {
    id: 'inv-abplus',
    organizationId: 'HSP-00124',
    bloodGroup: 'AB+',
    availableQuantity: 2.0,
    reservedQuantity: 0.3,
    unit: 'L',
    expiryDate: '2026-10-30',
    demandLevel: 'Low',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 72,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T07:15:00Z',
  },
  {
    id: 'inv-abminus',
    organizationId: 'HSP-00124',
    bloodGroup: 'AB-',
    availableQuantity: 0.2,
    reservedQuantity: 0.0,
    unit: 'L',
    expiryDate: '2026-10-08',
    demandLevel: 'High',
    status: 'critical',
    prediction: {
      predictedDepletionHours: 3.2,
      trend: 'depleting',
    },
    updatedAt: '2026-10-03T10:15:00Z',
  },
  {
    id: 'inv-oplus',
    organizationId: 'HSP-00124',
    bloodGroup: 'O+',
    availableQuantity: 5.0,
    reservedQuantity: 0.5,
    unit: 'L',
    expiryDate: '2026-10-20',
    demandLevel: 'High',
    status: 'healthy',
    prediction: {
      predictedDepletionHours: 18.4,
      trend: 'stable',
    },
    updatedAt: '2026-10-03T10:42:00Z',
  },
  {
    id: 'inv-ominus',
    organizationId: 'HSP-00124',
    bloodGroup: 'O-',
    availableQuantity: 0.7,
    reservedQuantity: 0.2,
    unit: 'L',
    expiryDate: '2026-10-10',
    demandLevel: 'Medium',
    status: 'monitor',
    prediction: {
      predictedDepletionHours: 14.8,
      trend: 'depleting',
    },
    updatedAt: '2026-10-03T10:31:00Z',
  },
];

export const INITIAL_RECENT_ACTIVITY: InventoryActivityItem[] = [
  {
    id: 'act-1',
    timestamp: '2026-10-03T10:42:00Z',
    timeFormatted: '10:42 AM',
    bloodGroup: 'O+',
    action: 'updated',
    description: 'O+ inventory updated',
    delta: '+1.0 L',
  },
  {
    id: 'act-2',
    timestamp: '2026-10-03T10:31:00Z',
    timeFormatted: '10:31 AM',
    bloodGroup: 'O+',
    action: 'reserved',
    description: 'O+ reservation created',
    delta: '−1.0 L',
  },
  {
    id: 'act-3',
    timestamp: '2026-10-03T10:15:00Z',
    timeFormatted: '10:15 AM',
    bloodGroup: 'AB-',
    action: 'status_change',
    description: 'AB− entered critical status',
    statusType: 'critical',
  },
  {
    id: 'act-4',
    timestamp: '2026-10-03T09:48:00Z',
    timeFormatted: '09:48 AM',
    bloodGroup: 'B+',
    action: 'updated',
    description: 'B+ inventory updated',
    delta: '+1.0 L',
  },
];
