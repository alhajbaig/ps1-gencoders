import type { RiskLevel, DataReadinessState } from '../types/prediction';

export interface RiskMeta {
  level: RiskLevel;
  label: string;
  badgeClass: string;
  dotColor: string;
  borderClass: string;
  description: string;
  urgencyExplanation: string;
}

export const RISK_CONFIGS: Record<RiskLevel, RiskMeta> = {
  critical: {
    level: 'critical',
    label: 'Critical Risk',
    badgeClass: 'bg-rose-50 text-[#C1272D] border-red-300',
    dotColor: 'bg-[#C1272D]',
    borderClass: 'border-red-200 bg-rose-50/30',
    description: 'Projected stockout within less than 4 hours under current consumption velocity.',
    urgencyExplanation: 'Immediate supervisory attention recommended.',
  },
  high: {
    level: 'high',
    label: 'High Risk',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-300',
    dotColor: 'bg-orange-500',
    borderClass: 'border-orange-200 bg-orange-50/20',
    description: 'Projected stockout within 4 to 12 hours based on observed demand trajectory.',
    urgencyExplanation: 'Expedited network coordination recommended.',
  },
  monitor: {
    level: 'monitor',
    label: 'Monitor',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
    borderClass: 'border-amber-200 bg-amber-50/20',
    description: 'Inventory sufficient for 12 to 24 hours. Monitor active ward consumption.',
    urgencyExplanation: 'Standard operational surveillance.',
  },
  low: {
    level: 'low',
    label: 'Healthy',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
    borderClass: 'border-slate-200 bg-white',
    description: 'Inventory reserve exceeds 24 hours of projected clinical requirements.',
    urgencyExplanation: 'Stable supply buffer.',
  },
};

export function getRiskConfig(level: RiskLevel): RiskMeta {
  return RISK_CONFIGS[level] || RISK_CONFIGS.low;
}

/**
 * Classifies stockout risk level based on centralized clinical thresholds (Section 21, 22).
 */
export function classifyStockoutRisk(
  estimatedStockoutHours: number | undefined,
  availableStock: number,
  readiness: DataReadinessState
): RiskLevel {
  if (readiness === 'insufficient_data') {
    return 'low';
  }

  // If available stock is zero or critically depleted under any demand
  if (availableStock <= 0.3) {
    return 'critical';
  }

  if (estimatedStockoutHours === undefined || !Number.isFinite(estimatedStockoutHours)) {
    return 'low';
  }

  if (estimatedStockoutHours < 4.0) {
    return 'critical';
  }
  if (estimatedStockoutHours < 12.0) {
    return 'high';
  }
  if (estimatedStockoutHours <= 24.0) {
    return 'monitor';
  }
  return 'low';
}
