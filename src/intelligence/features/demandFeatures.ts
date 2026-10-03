import type { BloodGroup } from '../../types';
import type { BloodUsageTransaction } from '../types/prediction';

export interface DemandTrendOutput {
  usageLast7Days: number;
  usagePrevious7Days: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;
}

/**
 * Evaluates the 7-day velocity trend compared with the previous 7 days (Section 32).
 */
export function extractDemandTrend(
  bloodGroup: BloodGroup,
  transactions: BloodUsageTransaction[],
  referenceTime: Date = new Date('2026-10-03T13:30:00.000Z')
): DemandTrendOutput {
  const refMs = referenceTime.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;
  const fourteenDays = 14 * oneDay;

  let current7DaysSum = 0;
  let previous7DaysSum = 0;

  for (const tx of transactions) {
    if (tx.bloodGroup !== bloodGroup || tx.type !== 'issued') continue;
    const txMs = new Date(tx.timestamp).getTime();
    const ageMs = refMs - txMs;

    if (ageMs >= 0 && ageMs <= sevenDays) {
      current7DaysSum += tx.quantityLitres;
    } else if (ageMs > sevenDays && ageMs <= fourteenDays) {
      previous7DaysSum += tx.quantityLitres;
    }
  }

  current7DaysSum = Math.round(current7DaysSum * 10) / 10;
  previous7DaysSum = Math.round(previous7DaysSum * 10) / 10;

  let trendPercentage = 0;
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

  if (previous7DaysSum > 0) {
    const diff = current7DaysSum - previous7DaysSum;
    trendPercentage = Math.round((diff / previous7DaysSum) * 1000) / 10; // 1 decimal place

    if (trendPercentage > 12.0) {
      trend = 'increasing';
    } else if (trendPercentage < -12.0) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }
  } else if (current7DaysSum > 0) {
    trend = 'increasing';
    trendPercentage = 100;
  }

  return {
    usageLast7Days: current7DaysSum,
    usagePrevious7Days: previous7DaysSum,
    trend,
    trendPercentage,
  };
}
