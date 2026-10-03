import type { BloodGroup } from '../types';
import type { RefillRecommendation } from '../types/refill';
import type { BloodRequest } from '../types/bloodRequest';
import { inventoryService } from './inventoryService';
import { transactionService } from './transactionService';
import { bloodRequestRepository } from './bloodRequestRepository';

export class RefillService {
  /**
   * Step 15: Transparent Refill Recommendation Calculation (Section 34 & 35)
   */
  async calculateRefillRecommendation(bloodGroup: BloodGroup): Promise<RefillRecommendation> {
    const inventory = inventoryService.getInventory();
    const item = inventory.find((i) => i.bloodGroup === bloodGroup);
    const analytics = await transactionService.getUsageAnalytics(bloodGroup);

    const currentStock = item ? item.availableQuantity : 0;

    // Expected demand over 24h
    // Baseline consumption rate * 24 or 7-day average daily usage
    const expectedDemand = Math.round(
      Math.max(
        analytics.averageDailyUsage,
        analytics.recentConsumptionRate * 24,
        bloodGroup === 'O+' ? 18.0 : 6.0
      ) * 10
    ) / 10;

    // Safety buffer: 20% of expected daily demand, minimum 1.5 units
    const safetyBuffer = Math.round(Math.max(1.5, expectedDemand * 0.2) * 10) / 10;

    // Confirmed incoming
    const confirmedIncoming = 0.0;

    // Calculation: Expected demand + Safety buffer - current available - incoming
    const rawRecommended = expectedDemand + safetyBuffer - currentStock - confirmedIncoming;
    const recommendedQuantity = Math.max(0, Math.ceil(rawRecommended));

    // Stockout hours
    const estimatedStockoutHours =
      analytics.recentConsumptionRate > 0
        ? Math.round((currentStock / analytics.recentConsumptionRate) * 10) / 10
        : undefined;

    const urgency =
      currentStock <= 2.0 || (estimatedStockoutHours !== undefined && estimatedStockoutHours <= 4)
        ? 'emergency'
        : currentStock <= 5.0 || (estimatedStockoutHours !== undefined && estimatedStockoutHours <= 12)
        ? 'urgent'
        : 'routine';

    return {
      bloodGroup,
      currentStock,
      estimatedStockoutHours,
      riskLevel: urgency === 'emergency' ? 'critical' : urgency === 'urgent' ? 'high' : 'monitor',
      predictedDemand24h: expectedDemand,
      safetyBuffer,
      confirmedIncoming,
      recommendedQuantity,
      calculationBreakdown: {
        expectedDemand,
        safetyBuffer,
        currentStock,
        confirmedIncoming,
        netRecommended: recommendedQuantity,
      },
      reason: `Anticipated stockout within ${estimatedStockoutHours ? `~${estimatedStockoutHours.toFixed(1)}h` : 'near term'} under active clinical consumption (${analytics.recentConsumptionRate.toFixed(1)} U/hr).`,
      urgency,
      recommendedAt: new Date().toISOString(),
    };
  }

  /**
   * Step 17: Submit Refill Request for Admin Approval (Section 36 & 40)
   */
  async submitRefillRequest(
    recommendation: RefillRecommendation,
    requestedQuantity: number,
    hospitalContext?: {
      hospitalId?: string;
      hospitalName?: string;
      hospitalCity?: string;
      submittedBy?: string;
    }
  ): Promise<BloodRequest> {
    const requiredByDate = new Date(Date.now() + 6 * 3600 * 1000).toISOString();

    const request = await bloodRequestRepository.createRequest(
      {
        bloodGroup: recommendation.bloodGroup,
        quantityLitres: requestedQuantity,
        priority: recommendation.urgency,
        requiredBy: requiredByDate,
        reason: `Predictive Replenishment Requisition: ${recommendation.reason}`,
        department: 'Emergency & Surgical Transfusion Bank',
        status: 'pending_approval',
      },
      hospitalContext
    );

    return request;
  }
}

export const refillService = new RefillService();
