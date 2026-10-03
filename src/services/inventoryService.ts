import type {
  HospitalInventoryItem,
  InventoryActivityItem,
  InventorySummary,
  InventoryStatus,
} from '../data/hospitalInventory';
import {
  INITIAL_HOSPITAL_INVENTORY,
  INITIAL_RECENT_ACTIVITY,
} from '../data/hospitalInventory';

const INVENTORY_STORAGE_KEY = 'raktsetu_hospital_inventory_v2';
const ACTIVITY_STORAGE_KEY = 'raktsetu_hospital_activity_v2';

export const inventoryService = {
  getInventory(): HospitalInventoryItem[] {
    try {
      const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading hospital inventory from storage', e);
    }
    return [...INITIAL_HOSPITAL_INVENTORY];
  },

  saveInventory(items: HospitalInventoryItem[]): void {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving hospital inventory to storage', e);
    }
  },

  getActivity(): InventoryActivityItem[] {
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading activity log from storage', e);
    }
    return [...INITIAL_RECENT_ACTIVITY];
  },

  saveActivity(activity: InventoryActivityItem[]): void {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
    } catch (e) {
      console.error('Error saving activity log to storage', e);
    }
  },

  calculateStatus(available: number, demand: 'Low' | 'Medium' | 'High'): InventoryStatus {
    if (available <= 0.3) return 'critical';
    if (available <= 1.0) {
      return demand === 'High' ? 'attention' : 'monitor';
    }
    if (available <= 2.0 && demand === 'High') return 'attention';
    if (available <= 1.5) return 'monitor';
    return 'healthy';
  },

  calculateSummary(items: HospitalInventoryItem[]): InventorySummary {
    let totalQuantity = 0;
    let availableQuantity = 0;
    let reservedQuantity = 0;
    let atRiskCount = 0;

    const statusCounts: Record<InventoryStatus, number> = {
      healthy: 0,
      monitor: 0,
      attention: 0,
      critical: 0,
    };

    items.forEach((item) => {
      const avail = item.availableQuantity;
      const res = item.reservedQuantity;
      availableQuantity += avail;
      reservedQuantity += res;
      totalQuantity += avail + res;

      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

      if (item.status === 'critical' || item.status === 'attention') {
        atRiskCount++;
      }
    });

    return {
      totalQuantity: Math.round(totalQuantity * 10) / 10,
      availableQuantity: Math.round(availableQuantity * 10) / 10,
      reservedQuantity: Math.round(reservedQuantity * 10) / 10,
      atRiskCount,
      statusCounts,
    };
  },
};
