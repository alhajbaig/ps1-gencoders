import type { BloodGroup } from './index';

export type BloodRequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'searching'
  | 'matched'
  | 'reserved'
  | 'in_transit'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type RequestPriority = 'routine' | 'urgent' | 'emergency';

export interface BloodRequestActivity {
  id: string;
  requestId: string;
  type:
    | 'created'
    | 'status_change'
    | 'approval'
    | 'match_found'
    | 'reserved'
    | 'dispatch'
    | 'cancelled'
    | 'note';
  title: string;
  description?: string;
  timestamp: string;
  timeFormatted?: string;
  actor?: string;
}

export interface BloodRequest {
  id: string;
  displayId: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  deliveryLocation: string;
  department?: string;
  contactPhone?: string;

  bloodGroup: BloodGroup;
  quantityLitres: number;
  priority: RequestPriority;
  status: BloodRequestStatus;
  requiredBy: string;
  reason?: string;

  createdAt: string;
  updatedAt: string;
  submittedBy: string;

  // Future load balancer / matching extension fields (Phase 3 contract)
  matchedBloodBankId?: string;
  matchedBloodBankName?: string;
  matchedQuantity?: number;
  matchScore?: number;
  reservationId?: string;
  distanceKm?: number;
  estimatedFulfillmentTime?: string;
  matchingReason?: string;

  activities: BloodRequestActivity[];
}

export interface CreateBloodRequestInput {
  bloodGroup: BloodGroup;
  quantityLitres: number;
  priority: RequestPriority;
  requiredBy: string;
  reason?: string;
  deliveryLocation?: string;
  department?: string;
  contactPhone?: string;
  status?: BloodRequestStatus;
}

export interface BloodRequestFilters {
  status: 'all' | BloodRequestStatus;
  priority: 'all' | RequestPriority;
  bloodGroup: 'all' | BloodGroup;
  dateRange: 'all' | 'today' | '7days' | '30days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  searchQuery: string;
}

export interface RequestValidationResult {
  isValid: boolean;
  errors: {
    bloodGroup?: string;
    quantityLitres?: string;
    priority?: string;
    requiredBy?: string;
    reason?: string;
  };
}
