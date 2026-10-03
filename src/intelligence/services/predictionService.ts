import type { BloodGroup } from '../../types';
import type { BloodRequest } from '../../types/bloodRequest';
import type { HospitalInventoryItem } from '../../data/hospitalInventory';
import type {
  StockoutPrediction,
  BloodUsageTransaction,
  BloodGroupFeatures,
  RefillRecommendationInput,
} from '../types/prediction';
import { extractBloodGroupFeatures } from '../features';
import { predictStockout } from '../prediction/stockoutPredictor';

export interface PredictionService {
  getAllStockoutPredictions(
    inventory: HospitalInventoryItem[],
    transactions: BloodUsageTransaction[],
    requests: BloodRequest[],
    referenceTime?: Date
  ): Promise<StockoutPrediction[]>;

  getStockoutPrediction(
    bloodGroup: BloodGroup,
    inventory: HospitalInventoryItem[],
    transactions: BloodUsageTransaction[],
    requests: BloodRequest[],
    referenceTime?: Date
  ): Promise<StockoutPrediction | null>;

  getRefillRecommendationInput(
    prediction: StockoutPrediction,
    features: BloodGroupFeatures
  ): RefillRecommendationInput;
}

class LocalBaselinePredictionService implements PredictionService {
  private async delay(ms: number = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAllStockoutPredictions(
    inventory: HospitalInventoryItem[],
    transactions: BloodUsageTransaction[],
    requests: BloodRequest[],
    referenceTime: Date = new Date('2026-10-03T13:30:00.000Z')
  ): Promise<StockoutPrediction[]> {
    await this.delay(180);

    const predictions: StockoutPrediction[] = inventory.map((item) => {
      const features = extractBloodGroupFeatures(item, transactions, requests, referenceTime);
      return predictStockout(features, referenceTime);
    });

    // Sort predictions by urgency: critical first, then high, then monitor, then low
    const riskPriority: Record<string, number> = {
      critical: 0,
      high: 1,
      monitor: 2,
      low: 3,
    };

    return predictions.sort((a, b) => {
      const pDiff = (riskPriority[a.riskLevel] ?? 9) - (riskPriority[b.riskLevel] ?? 9);
      if (pDiff !== 0) return pDiff;
      // If same risk, sort by shortest stockout hours
      const aHrs = a.estimatedStockoutHours ?? 999;
      const bHrs = b.estimatedStockoutHours ?? 999;
      return aHrs - bHrs;
    });
  }

  async getStockoutPrediction(
    bloodGroup: BloodGroup,
    inventory: HospitalInventoryItem[],
    transactions: BloodUsageTransaction[],
    requests: BloodRequest[],
    referenceTime: Date = new Date('2026-10-03T13:30:00.000Z')
  ): Promise<StockoutPrediction | null> {
    await this.delay(120);

    const item = inventory.find((i) => i.bloodGroup === bloodGroup);
    if (!item) return null;

    const features = extractBloodGroupFeatures(item, transactions, requests, referenceTime);
    return predictStockout(features, referenceTime);
  }

  /**
   * Section 69: Phase 5 Refill Recommendation Contract
   */
  getRefillRecommendationInput(
    prediction: StockoutPrediction,
    features: BloodGroupFeatures
  ): RefillRecommendationInput {
    return {
      bloodGroup: prediction.bloodGroup,
      currentStock: prediction.currentStock,
      estimatedStockoutHours: prediction.estimatedStockoutHours,
      riskLevel: prediction.riskLevel,
      predictedDemand24h: prediction.demand24h,
      recentConsumptionRate: features.recentConsumptionRate,
      pendingDemand: features.pendingRequestsVolume,
      confirmedIncoming: features.confirmedIncomingQuantity,
    };
  }
}

export const predictionService: PredictionService = new LocalBaselinePredictionService();
