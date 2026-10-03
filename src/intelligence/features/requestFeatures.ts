import type { BloodGroup } from '../../types';
import type { BloodRequest } from '../../types/bloodRequest';

export interface RequestPressureOutput {
  pendingRequestsCount: number;
  pendingRequestsVolume: number;
  hasEmergencyRequest: boolean;
  highestPriority: 'routine' | 'urgent' | 'emergency' | 'none';
  demandSignal: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Extracts demand pressure from open network requisitions (Section 33).
 * Explicitly treats requests as demand signals, NOT actual consumption.
 */
export function extractRequestPressure(
  bloodGroup: BloodGroup,
  requests: BloodRequest[]
): RequestPressureOutput {
  // Pending statuses representing in-flight network demand
  const activeStatuses = ['pending_approval', 'approved', 'searching', 'matched'];

  const groupRequests = requests.filter(
    (r) => r.bloodGroup === bloodGroup && activeStatuses.includes(r.status)
  );

  const pendingRequestsCount = groupRequests.length;
  let pendingRequestsVolume = 0;
  let hasEmergencyRequest = false;
  let highestPriority: RequestPressureOutput['highestPriority'] = 'none';

  for (const r of groupRequests) {
    pendingRequestsVolume += r.quantityLitres;
    if (r.priority === 'emergency') {
      hasEmergencyRequest = true;
      highestPriority = 'emergency';
    } else if (r.priority === 'urgent' && highestPriority !== 'emergency') {
      highestPriority = 'urgent';
    } else if (r.priority === 'routine' && highestPriority === 'none') {
      highestPriority = 'routine';
    }
  }

  pendingRequestsVolume = Math.round(pendingRequestsVolume * 10) / 10;

  let demandSignal: RequestPressureOutput['demandSignal'] = 'low';
  if (hasEmergencyRequest || pendingRequestsVolume >= 3.0) {
    demandSignal = 'critical';
  } else if (pendingRequestsCount >= 2 || pendingRequestsVolume >= 1.5) {
    demandSignal = 'high';
  } else if (pendingRequestsCount >= 1) {
    demandSignal = 'moderate';
  }

  return {
    pendingRequestsCount,
    pendingRequestsVolume,
    hasEmergencyRequest,
    highestPriority,
    demandSignal,
  };
}
