import type { BloodGroupFeatures, DemandPrediction } from '../types/prediction';

/**
 * Deterministic Baseline Demand Predictor (Section 13, 14)
 * Combines weighted recent consumption, historical daily averages,
 * 7-day velocity trend, and request pressure.
 */
export function predictDemand(
  features: BloodGroupFeatures,
  horizonHours: number = 24
): DemandPrediction {
  const generatedAt = new Date().toISOString();
  const modelVersion = 'RS-DEMAND-BASELINE-v1.2';

  // 1. If insufficient data or 0 usage
  if (features.readiness === 'insufficient_data') {
    return {
      bloodGroup: features.bloodGroup,
      horizonHours,
      predictedDemand: 0,
      lowerBound: 0,
      upperBound: 0,
      generatedAt,
      modelVersion,
    };
  }

  // 2. Base hourly consumption rate
  // Heavily weight recent consumption (70%) combined with historical hourly baseline (30%)
  const recentRate = features.recentConsumptionRate;
  const historicalRate = features.averageHourlyUsage;
  let baseHourlyRate = recentRate > 0
    ? (recentRate * 0.7 + historicalRate * 0.3)
    : historicalRate;

  // 3. Trend adjustment factor (Section 32)
  if (features.usageTrend === 'increasing') {
    const trendBoost = Math.min(0.25, Math.max(0.05, features.trendPercentage / 100));
    baseHourlyRate *= (1 + trendBoost);
  } else if (features.usageTrend === 'decreasing') {
    const trendDrop = Math.min(0.20, Math.max(0.05, Math.abs(features.trendPercentage) / 100));
    baseHourlyRate *= (1 - trendDrop);
  }

  // 4. Request demand pressure factor (Section 33)
  // Requests are demand signals, not actual usage; add subtle expected demand pull (10% of pending volume over 24h)
  const pendingBuffer = (features.pendingRequestsVolume * 0.15);
  const rawPredicted = (baseHourlyRate * horizonHours) + pendingBuffer;
  const predictedDemand = Math.round(rawPredicted * 10) / 10;

  // 5. Uncertainty bounds (Section 23)
  // 15% lower bound, 20% upper bound
  const lowerBound = Math.max(0, Math.round((predictedDemand * 0.82) * 10) / 10);
  const upperBound = Math.round((predictedDemand * 1.22) * 10) / 10;

  return {
    bloodGroup: features.bloodGroup,
    horizonHours,
    predictedDemand,
    lowerBound,
    upperBound,
    generatedAt,
    modelVersion,
  };
}
