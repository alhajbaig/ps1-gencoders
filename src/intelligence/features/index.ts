import type { BloodRequest } from '../../types/bloodRequest';
import type { HospitalInventoryItem } from '../../data/hospitalInventory';
import type {
  BloodUsageTransaction,
  BloodGroupFeatures,
  DataReadinessState,
} from '../types/prediction';
import { extractUsageFeatures } from './usageFeatures';
import { extractDemandTrend } from './demandFeatures';
import { extractRequestPressure } from './requestFeatures';

export * from './usageFeatures';
export * from './demandFeatures';
export * from './requestFeatures';
export * from './timeFeatures';

/**
 * Assesses data readiness state based on historical coverage (Section 11)
 */
export function evaluateDataReadiness(dataCoverageDays: number): DataReadinessState {
  if (dataCoverageDays >= 14) {
    return 'ready';
  }
  if (dataCoverageDays >= 3) {
    return 'building_history';
  }
  return 'insufficient_data';
}

/**
 * Aggregates all verified data signals into a validated feature vector for a given blood group.
 */
export function extractBloodGroupFeatures(
  inventoryItem: HospitalInventoryItem,
  transactions: BloodUsageTransaction[],
  requests: BloodRequest[],
  referenceTime: Date = new Date('2026-10-03T13:30:00.000Z')
): BloodGroupFeatures {
  const bloodGroup = inventoryItem.bloodGroup;

  const usage = extractUsageFeatures(bloodGroup, transactions, referenceTime);
  const demand = extractDemandTrend(bloodGroup, transactions, referenceTime);
  const requestPressure = extractRequestPressure(bloodGroup, requests);
  const readiness = evaluateDataReadiness(usage.dataCoverageDays);

  return {
    bloodGroup,
    currentStock: inventoryItem.availableQuantity + inventoryItem.reservedQuantity,
    reservedQuantity: inventoryItem.reservedQuantity,
    availableQuantity: inventoryItem.availableQuantity,
    usageLast24Hours: usage.usageLast24Hours,
    usageLast7Days: usage.usageLast7Days,
    usageLast30Days: usage.usageLast30Days,
    averageDailyUsage: usage.averageDailyUsage,
    averageHourlyUsage: usage.averageHourlyUsage,
    recentConsumptionRate: usage.recentConsumptionRate,
    usageTrend: demand.trend,
    trendPercentage: demand.trendPercentage,
    recentRequestsCount: requestPressure.pendingRequestsCount,
    pendingRequestsVolume: requestPressure.pendingRequestsVolume,
    confirmedIncomingQuantity: 0, // In Phase 4, no confirmed incoming unless explicit
    dataCoverageDays: usage.dataCoverageDays,
    readiness,
    lastTransactionAt: usage.lastTransactionAt,
  };
}
