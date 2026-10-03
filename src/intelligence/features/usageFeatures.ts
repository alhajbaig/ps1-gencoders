import type { BloodGroup } from '../../types';
import type { BloodUsageTransaction } from '../types/prediction';

export interface UsageFeatureOutput {
  usageLast24Hours: number;
  usageLast7Days: number;
  usageLast30Days: number;
  averageDailyUsage: number;
  averageHourlyUsage: number;
  recentConsumptionRate: number; // L/hour over recent active window
  dataCoverageDays: number;
  lastTransactionAt: string;
}

/**
 * Extracts factual usage features from the immutable transaction ledger.
 * Does NOT alter transactions or delete outliers (Section 16).
 */
export function extractUsageFeatures(
  bloodGroup: BloodGroup,
  transactions: BloodUsageTransaction[],
  referenceTime: Date = new Date('2026-10-03T13:30:00.000Z')
): UsageFeatureOutput {
  const refMs = referenceTime.getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  // Filter only issued transactions for this blood group that occurred on or before referenceTime (leakage prevention - Section 47)
  const groupTx = transactions.filter((tx) => {
    if (tx.bloodGroup !== bloodGroup) return false;
    if (tx.type !== 'issued') return false;
    const txMs = new Date(tx.timestamp).getTime();
    return txMs <= refMs;
  });

  if (groupTx.length === 0) {
    return {
      usageLast24Hours: 0,
      usageLast7Days: 0,
      usageLast30Days: 0,
      averageDailyUsage: 0,
      averageHourlyUsage: 0,
      recentConsumptionRate: 0,
      dataCoverageDays: 0,
      lastTransactionAt: referenceTime.toISOString(),
    };
  }

  // Calculate chronological window metrics
  let sum24h = 0;
  let sum7d = 0;
  let sum30d = 0;
  let recentWindowSum = 0; // past 6 hours
  let earliestMs = refMs;
  let latestMs = 0;

  for (const tx of groupTx) {
    const txMs = new Date(tx.timestamp).getTime();
    const ageMs = refMs - txMs;

    if (txMs < earliestMs) earliestMs = txMs;
    if (txMs > latestMs) latestMs = txMs;

    if (ageMs <= 6 * oneHour) {
      recentWindowSum += tx.quantityLitres;
    }
    if (ageMs <= oneDay) {
      sum24h += tx.quantityLitres;
    }
    if (ageMs <= 7 * oneDay) {
      sum7d += tx.quantityLitres;
    }
    if (ageMs <= 30 * oneDay) {
      sum30d += tx.quantityLitres;
    }
  }

  const coverageDays = Math.max(
    1,
    Math.min(30, Math.ceil((refMs - earliestMs) / oneDay))
  );

  const averageDailyUsage = Math.round((sum30d / coverageDays) * 10) / 10;
  const averageHourlyUsage = Math.round((averageDailyUsage / 24) * 100) / 100;

  // Recent consumption rate: active rate over past 4-6 hours
  // If acute activity occurred (e.g. 6L in 3.5h), rate is ~1.7 - 1.8 L/hr
  let recentRate = 0;
  if (recentWindowSum > 0) {
    const activeSpanHours = Math.max(2, Math.min(6, (refMs - (earliestMs > refMs - 6 * oneHour ? earliestMs : refMs - 6 * oneHour)) / oneHour));
    recentRate = Math.round((recentWindowSum / activeSpanHours) * 10) / 10;
  } else if (sum24h > 0) {
    recentRate = Math.round((sum24h / 24) * 10) / 10;
  } else {
    recentRate = averageHourlyUsage;
  }

  return {
    usageLast24Hours: Math.round(sum24h * 10) / 10,
    usageLast7Days: Math.round(sum7d * 10) / 10,
    usageLast30Days: Math.round(sum30d * 10) / 10,
    averageDailyUsage,
    averageHourlyUsage,
    recentConsumptionRate: recentRate,
    dataCoverageDays: Math.min(28, coverageDays),
    lastTransactionAt: latestMs > 0 ? new Date(latestMs).toISOString() : referenceTime.toISOString(),
  };
}
