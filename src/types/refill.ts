import type { BloodGroup } from './index';
import type { RiskLevel } from '../intelligence/types/prediction';
import type { RequestPriority } from './bloodRequest';

export interface RefillRecommendation {
  bloodGroup: BloodGroup;
  currentStock: number;
  estimatedStockoutHours?: number;
  riskLevel: RiskLevel;
  predictedDemand24h: number;
  safetyBuffer: number;
  confirmedIncoming: number;
  recommendedQuantity: number;
  calculationBreakdown: {
    expectedDemand: number;
    safetyBuffer: number;
    currentStock: number;
    confirmedIncoming: number;
    netRecommended: number;
  };
  reason: string;
  urgency: RequestPriority;
  recommendedAt: string;
}
