import type { BloodRequestStatus, RequestPriority } from '../types/bloodRequest';

export interface RequestStatusMeta {
  status: BloodRequestStatus;
  label: string;
  badgeLabel: string;
  description: string;
  badgeVariant: 'neutral' | 'monitor' | 'info' | 'critical' | 'healthy' | 'indigo' | 'purple';
  allowedNextStates: BloodRequestStatus[];
  timelineStage: 'submitted' | 'review' | 'search' | 'reservation' | 'fulfillment' | 'terminated';
}

export const requestStatusConfig: Record<BloodRequestStatus, RequestStatusMeta> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    badgeLabel: 'Draft',
    description: 'Request details saved locally. Not yet submitted to the network.',
    badgeVariant: 'neutral',
    allowedNextStates: ['pending_approval', 'searching', 'cancelled'],
    timelineStage: 'submitted',
  },
  pending_approval: {
    status: 'pending_approval',
    label: 'Pending Approval',
    badgeLabel: 'Pending Approval',
    description: 'Submitted and awaiting clinical supervisor review before network search.',
    badgeVariant: 'monitor',
    allowedNextStates: ['approved', 'searching', 'rejected', 'cancelled'],
    timelineStage: 'review',
  },
  approved: {
    status: 'approved',
    label: 'Approved',
    badgeLabel: 'Approved',
    description: 'Clinical review completed. Queued for automated network search.',
    badgeVariant: 'info',
    allowedNextStates: ['searching', 'cancelled'],
    timelineStage: 'review',
  },
  searching: {
    status: 'searching',
    label: 'Searching Network',
    badgeLabel: 'Searching',
    description: 'Querying connected blood-bank repositories for compatible available stock.',
    badgeVariant: 'info',
    allowedNextStates: ['matched', 'cancelled'],
    timelineStage: 'search',
  },
  matched: {
    status: 'matched',
    label: 'Matched',
    badgeLabel: 'Matched',
    description: 'Compatible blood-bank inventory identified with verified shelf-life.',
    badgeVariant: 'indigo',
    allowedNextStates: ['reserved', 'searching', 'cancelled'],
    timelineStage: 'reservation',
  },
  reserved: {
    status: 'reserved',
    label: 'Reserved',
    badgeLabel: 'Reserved',
    description: 'Blood units securely locked and reserved for this hospital request.',
    badgeVariant: 'purple',
    allowedNextStates: ['in_transit', 'cancelled'],
    timelineStage: 'reservation',
  },
  in_transit: {
    status: 'in_transit',
    label: 'In Transit',
    badgeLabel: 'In Transit',
    description: 'Cold-chain dispatch en route to hospital emergency storage.',
    badgeVariant: 'indigo',
    allowedNextStates: ['completed', 'cancelled'],
    timelineStage: 'fulfillment',
  },
  completed: {
    status: 'completed',
    label: 'Completed',
    badgeLabel: 'Completed',
    description: 'Blood units received, cross-matched, and accepted by hospital.',
    badgeVariant: 'healthy',
    allowedNextStates: [],
    timelineStage: 'fulfillment',
  },
  rejected: {
    status: 'rejected',
    label: 'Rejected',
    badgeLabel: 'Rejected',
    description: 'Request was rejected during clinical or institutional review.',
    badgeVariant: 'critical',
    allowedNextStates: [],
    timelineStage: 'terminated',
  },
  cancelled: {
    status: 'cancelled',
    label: 'Cancelled',
    badgeLabel: 'Cancelled',
    description: 'Request was cancelled by the requesting hospital.',
    badgeVariant: 'neutral',
    allowedNextStates: [],
    timelineStage: 'terminated',
  },
};

export interface RequestPriorityMeta {
  priority: RequestPriority;
  label: string;
  tagline: string;
  description: string;
  clinicalContext: string;
  variant: 'routine' | 'urgent' | 'emergency';
}

export const requestPriorityConfig: Record<RequestPriority, RequestPriorityMeta> = {
  routine: {
    priority: 'routine',
    label: 'Routine',
    tagline: 'Planned requirement',
    description: 'Scheduled surgery or elective transfusion planned in advance.',
    clinicalContext: 'Standard dispatch queue, fulfillment within normal operational window.',
    variant: 'routine',
  },
  urgent: {
    priority: 'urgent',
    label: 'Urgent',
    tagline: 'Needed soon',
    description: 'Acute clinical condition requiring blood within 2 to 6 hours.',
    clinicalContext: 'Prioritized network query with expedited reservation alerts.',
    variant: 'urgent',
  },
  emergency: {
    priority: 'emergency',
    label: 'Emergency',
    tagline: 'Immediate requirement',
    description: 'Critical hemorrhage, trauma, or life-threatening hemorrhage.',
    clinicalContext: 'Maximum priority lock, immediate alert broadcast across connected banks.',
    variant: 'emergency',
  },
};

/**
 * Validates whether a status transition is permitted
 */
export function canTransitionRequestStatus(
  currentStatus: BloodRequestStatus,
  nextStatus: BloodRequestStatus
): boolean {
  if (currentStatus === nextStatus) return true;
  const config = requestStatusConfig[currentStatus];
  return config?.allowedNextStates.includes(nextStatus) ?? false;
}

/**
 * Checks if a request is considered "Active" (in flight)
 */
export function isRequestActive(status: BloodRequestStatus): boolean {
  return [
    'pending_approval',
    'approved',
    'searching',
    'matched',
    'reserved',
    'in_transit',
  ].includes(status);
}

/**
 * Checks if a request can be cancelled by the hospital
 */
export function isRequestCancellable(status: BloodRequestStatus): boolean {
  return [
    'draft',
    'pending_approval',
    'approved',
    'searching',
    'matched',
    'reserved',
  ].includes(status);
}

/**
 * Checks if a request can still be edited
 * Section 31: Editing allowed only before locked states (draft, pending_approval)
 */
export function isRequestEditable(status: BloodRequestStatus): boolean {
  return status === 'draft' || status === 'pending_approval';
}

/**
 * Maps status to 5-stage timeline index (1 to 5)
 * 1: Submitted
 * 2: Review
 * 3: Network Search
 * 4: Reservation
 * 5: Fulfillment
 */
export function getTimelineStageIndex(status: BloodRequestStatus): {
  activeStep: number;
  isTerminated: boolean;
} {
  switch (status) {
    case 'draft':
      return { activeStep: 1, isTerminated: false };
    case 'pending_approval':
      return { activeStep: 2, isTerminated: false };
    case 'approved':
      return { activeStep: 2, isTerminated: false };
    case 'searching':
      return { activeStep: 3, isTerminated: false };
    case 'matched':
    case 'reserved':
      return { activeStep: 4, isTerminated: false };
    case 'in_transit':
    case 'completed':
      return { activeStep: 5, isTerminated: false };
    case 'rejected':
    case 'cancelled':
      return { activeStep: 2, isTerminated: true };
    default:
      return { activeStep: 1, isTerminated: false };
  }
}
