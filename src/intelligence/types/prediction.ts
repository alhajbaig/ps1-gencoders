import type { BloodGroup } from '../../types';

export type DataReadinessState = 'insufficient_data' | 'building_history' | 'ready';
export type DataReadiness = DataReadinessState;

export type RiskLevel = 'low' | 'monitor' | 'high' | 'critical';

export type UsageTransactionType =
  | 'issued'
  | 'received'
  | 'transferred'
  | 'expired'
  | 'adjustment';

export interface BloodUsageTransaction {
  id: string;
  timestamp: string;
  timeFormatted: string;
  bloodGroup: BloodGroup;
  quantityLitres: number;
  type: UsageTransactionType;
  department: string;
  reason?: string;
  referenceRequestId?: string;
  verifiedBy: string;
}

export interface BloodGroupFeatures {
  bloodGroup: BloodGroup;
  currentStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  usageLast24Hours: number;
  usageLast7Days: number;
  usageLast30Days: number;
  averageDailyUsage: number;
  averageHourlyUsage: number;
  recentConsumptionRate: number; // L/hour over recent active window
  usageTrend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;
  recentRequestsCount: number;
  pendingRequestsVolume: number;
  confirmedIncomingQuantity: number;
  dataCoverageDays: number;
  readiness: DataReadinessState;
  lastTransactionAt: string;
}

export interface DemandPrediction {
  bloodGroup: BloodGroup;
  horizonHours: number;
  predictedDemand: number;
  lowerBound?: number;
  upperBound?: number;
  generatedAt: string;
  modelVersion: string;
}

export interface ForecastDataPoint {
  hourOffset: number; // e.g. -6 to +24
  timestamp: string;
  timeFormatted: string;
  actualStock?: number;
  forecastStock?: number;
  lowerBound?: number;
  upperBound?: number;
  isForecast: boolean;
}

export interface ExplanationFactor {
  label: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail?: string;
}

export interface PredictionExplanation {
  summary: string;
  factors: ExplanationFactor[];
  recommendedAttention: boolean;
  clinicalContext: string;
}

export interface PredictionMetadata {
  modelVersion: string;
  modelType: string;
  generatedAt: string;
  dataThrough: string;
  dataCoverageDays: number;
  isFallback: boolean;
  isStale: boolean;
  staleReason?: string;
}

export interface StockoutPrediction {
  bloodGroup: BloodGroup;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  estimatedStockoutHours?: number;
  estimatedStockoutAt?: string;
  stockoutRangeFormatted?: string;
  riskLevel: RiskLevel;
  probability?: number;
  lowerBoundHours?: number;
  upperBoundHours?: number;
  demand24h: number;
  recentConsumptionRate: number;
  forecastCurve: ForecastDataPoint[];
  explanation: PredictionExplanation;
  metadata: PredictionMetadata;
  readiness: DataReadinessState;
  features: BloodGroupFeatures;
}

/**
 * Phase 5 Refill Recommendation Contract (Section 69)
 * Prepares predictive inputs for automated replenishment recommendations
 */
export interface RefillRecommendationInput {
  bloodGroup: BloodGroup;
  currentStock: number;
  estimatedStockoutHours?: number;
  riskLevel: RiskLevel;
  predictedDemand24h: number;
  recentConsumptionRate: number;
  pendingDemand: number;
  confirmedIncoming: number;
}
