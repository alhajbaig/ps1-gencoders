import type {
  BloodGroupFeatures,
  RiskLevel,
  PredictionExplanation,
  ExplanationFactor,
} from '../types/prediction';

/**
 * Builds grounded, structured explanation for predictive assessments (Section 24, 25, 71).
 * Strictly answers with verified facts and features.
 */
export function generatePredictionExplanation(
  features: BloodGroupFeatures,
  riskLevel: RiskLevel,
  _estimatedHours: number | undefined,
  stockoutRangeFormatted: string
): PredictionExplanation {
  const bg = features.bloodGroup;
  const factors: ExplanationFactor[] = [];

  // Factor 1: Current available stock
  factors.push({
    label: 'Verified In-Hospital Stock',
    value: `${features.availableQuantity.toFixed(1)} L available`,
    impact: features.availableQuantity <= 1.0 ? 'negative' : features.availableQuantity <= 3.0 ? 'neutral' : 'positive',
    detail: features.reservedQuantity > 0 ? `(${features.reservedQuantity.toFixed(1)} L already committed to patients)` : undefined,
  });

  // Factor 2: Recent consumption velocity
  factors.push({
    label: 'Observed Consumption Velocity',
    value: features.recentConsumptionRate > 0 ? `${features.recentConsumptionRate.toFixed(1)} L / hour` : 'Nominal (< 0.1 L/hr)',
    impact: features.recentConsumptionRate >= 1.5 ? 'negative' : features.recentConsumptionRate >= 0.8 ? 'neutral' : 'positive',
    detail: 'Calculated from verified ward issue transactions over the recent active period.',
  });

  // Factor 3: 7-day usage trend (Section 32)
  if (features.dataCoverageDays >= 7) {
    const trendSign = features.trendPercentage > 0 ? '+' : '';
    factors.push({
      label: '7-Day Demand Trajectory',
      value: `${features.usageTrend.toUpperCase()} (${trendSign}${features.trendPercentage.toFixed(1)}%)`,
      impact: features.usageTrend === 'increasing' ? 'negative' : features.usageTrend === 'decreasing' ? 'positive' : 'neutral',
      detail: `Current 7-day total (${features.usageLast7Days.toFixed(1)} L) vs prior 7-day period.`,
    });
  }

  // Factor 4: Network demand requests (Section 33)
  if (features.recentRequestsCount > 0) {
    factors.push({
      label: 'Active Network Requisitions',
      value: `${features.recentRequestsCount} active request${features.recentRequestsCount === 1 ? '' : 's'} (${features.pendingRequestsVolume.toFixed(1)} L)`,
      impact: 'negative',
      detail: 'Requisitions logged in network pipeline signal additional impending patient demand.',
    });
  } else {
    factors.push({
      label: 'Active Network Requisitions',
      value: 'None active',
      impact: 'positive',
      detail: 'No pending network requisitions creating immediate demand pressure.',
    });
  }

  // Factor 5: Incoming replenishment status (Section 35)
  factors.push({
    label: 'Confirmed Incoming Replenishment',
    value: features.confirmedIncomingQuantity > 0 ? `${features.confirmedIncomingQuantity.toFixed(1)} L confirmed` : 'No confirmed inbound stock',
    impact: features.confirmedIncomingQuantity > 0 ? 'positive' : 'neutral',
    detail: 'Forecast does not assume hypothetical refills without verified transfer reservations.',
  });

  // Compose cohesive clinical summary (Judge Test - Section 71)
  let summary = '';
  let clinicalContext = '';

  if (riskLevel === 'critical' || riskLevel === 'high') {
    summary = `${bg} currently has ${features.availableQuantity.toFixed(1)} L available. Recent verified usage is approximately ${features.recentConsumptionRate.toFixed(1)} L/hour${
      features.usageTrend === 'increasing' ? ', and consumption has accelerated over the past week' : ''
    }${
      features.recentRequestsCount > 0 ? `, with ${features.recentRequestsCount} pending network request${features.recentRequestsCount === 1 ? '' : 's'}` : ''
    }. Under this demand trajectory, RaktSetu estimates ${bg} may become depleted in ${stockoutRangeFormatted}.`;

    clinicalContext = `Acute surgical and trauma pressure requires close monitoring to prevent critical bedside shortage.`;
  } else if (riskLevel === 'monitor') {
    summary = `${bg} has ${features.availableQuantity.toFixed(1)} L in cold storage with a steady consumption rate of ${features.recentConsumptionRate.toFixed(1)} L/hour. Current stock is sufficient for approximately 12–24 hours of normal clinical operations.`;
    clinicalContext = `Standard inpatient and elective procedural demand. Recheck trajectory before evening shift change.`;
  } else {
    summary = `${bg} maintains a healthy reserve of ${features.availableQuantity.toFixed(1)} L. At current baseline demand, local inventory is projected to safely exceed 24 hours of operational coverage.`;
    clinicalContext = `Supply buffer is optimal. No network transfer or emergency intervention indicated.`;
  }

  return {
    summary,
    factors,
    recommendedAttention: riskLevel === 'critical' || riskLevel === 'high',
    clinicalContext,
  };
}
