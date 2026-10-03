import type { BloodGroup } from '../types';
import type { RaktSetuLocalState, CriticalAlert } from '../types/admin';
import type { Organization } from '../types/organization';
import type { BloodRequest } from '../types/bloodRequest';
import type { BloodTransfer } from '../types/transfer';

export const ALL_BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export interface BloodGroupNetworkRow {
  bloodGroup: BloodGroup;
  hospitalAvailable: number;
  bloodBankAvailable: number;
  totalAvailable: number;
  totalReserved: number;
  activeDemand: number;
  atRiskUnits: number;
  expiringUnits: number;
  status: 'OPTIMAL' | 'MONITOR' | 'ATTENTION' | 'CRITICAL';
}

export interface NetworkHealthResult {
  status: 'HEALTHY' | 'MONITOR' | 'HIGH_PRESSURE' | 'CRITICAL';
  score: number; // 0-100 where 100 is ideal
  criticalCount: number;
  warningCount: number;
  issues: string[];
}

export interface NetworkFlowMetrics {
  requestsCreated: number;
  requestsApproved: number;
  reservationsActive: number;
  transfersInTransit: number;
  transfersDelivered: number;
  fulfillmentRatePct: number;
  averageFulfillmentMinutes: number | null;
}

export interface RecentNetworkActivityItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  type: 'TRANSACTION' | 'REQUEST' | 'RESERVATION' | 'TRANSFER' | 'ORGANIZATION' | 'ALERT';
  title: string;
  description: string;
  organizationName?: string;
  badgeColor: 'rose' | 'amber' | 'emerald' | 'blue' | 'slate';
  entityId: string;
}

// -------------------------------------------------------------
// SELECTORS
// -------------------------------------------------------------

export function selectTotalNetworkStock(state: RaktSetuLocalState): number {
  const hospitalTotal = state.hospitalInventory.reduce((acc, item) => acc + item.availableQuantity + item.reservedQuantity, 0);
  const bankTotal = state.bloodBanks.reduce((acc, bank) => {
    return (
      acc +
      Object.values(bank.inventories).reduce(
        (bAcc, inv) => bAcc + inv.physicalStock,
        0
      )
    );
  }, 0);
  return Math.round((hospitalTotal + bankTotal) * 10) / 10;
}

export function selectAvailableNetworkStock(state: RaktSetuLocalState): number {
  const hospitalAvail = state.hospitalInventory.reduce((acc, item) => acc + item.availableQuantity, 0);
  const bankAvail = state.bloodBanks.reduce((acc, bank) => {
    return (
      acc +
      Object.values(bank.inventories).reduce(
        (bAcc, inv) => bAcc + inv.availableStock,
        0
      )
    );
  }, 0);
  return Math.round((hospitalAvail + bankAvail) * 10) / 10;
}

export function selectReservedNetworkStock(state: RaktSetuLocalState): number {
  const hospitalRes = state.hospitalInventory.reduce((acc, item) => acc + item.reservedQuantity, 0);
  const bankRes = state.bloodBanks.reduce((acc, bank) => {
    return (
      acc +
      Object.values(bank.inventories).reduce(
        (bAcc, inv) => bAcc + inv.reservedStock,
        0
      )
    );
  }, 0);
  return Math.round((hospitalRes + bankRes) * 10) / 10;
}

export function selectHospitals(state: RaktSetuLocalState): Organization[] {
  return state.organizations.filter((org) => org.type === 'hospital');
}

export function selectBloodBanks(state: RaktSetuLocalState): Organization[] {
  return state.organizations.filter((org) => org.type === 'blood_bank');
}

export function selectPendingVerifications(state: RaktSetuLocalState): Organization[] {
  return state.organizations.filter((org) => org.status === 'PENDING');
}

export function selectVerifiedOrganizations(state: RaktSetuLocalState): Organization[] {
  return state.organizations.filter((org) => org.status === 'VERIFIED');
}

export function selectActiveRequests(state: RaktSetuLocalState): BloodRequest[] {
  return state.requests.filter(
    (req) => req.status !== 'completed' && req.status !== 'cancelled' && req.status !== 'rejected'
  );
}

export function selectInTransitTransfers(state: RaktSetuLocalState): BloodTransfer[] {
  return state.transfers.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED');
}

export function selectActiveAlerts(state: RaktSetuLocalState): CriticalAlert[] {
  return state.alerts.filter((a) => a.status === 'ACTIVE');
}

export function selectExpiringInventoryCount(state: RaktSetuLocalState, withinHours: number = 48): number {
  const now = new Date().getTime();
  const thresholdMs = withinHours * 3600 * 1000;

  let count = 0;
  state.hospitalInventory.forEach((item) => {
    const expTime = new Date(item.expiryDate).getTime();
    if (expTime > now && expTime - now <= thresholdMs) {
      count += item.availableQuantity;
    }
  });

  return Math.round(count * 10) / 10;
}

export function selectCriticalBloodGroups(state: RaktSetuLocalState): BloodGroup[] {
  const criticals = new Set<BloodGroup>();

  // Check hospital inventory for low stock (<1.5L)
  state.hospitalInventory.forEach((inv) => {
    if (inv.availableQuantity <= 1.5 || inv.status === 'critical' || inv.status === 'attention') {
      criticals.add(inv.bloodGroup);
    }
  });

  return Array.from(criticals);
}

export function selectBloodGroupSummaryTable(state: RaktSetuLocalState): BloodGroupNetworkRow[] {
  const now = new Date().getTime();
  const hours48Ms = 48 * 3600 * 1000;

  return ALL_BLOOD_GROUPS.map((bg) => {
    // Hospital stock
    const hospItem = state.hospitalInventory.find((i) => i.bloodGroup === bg);
    const hospAvail = hospItem ? hospItem.availableQuantity : 0;
    const hospRes = hospItem ? hospItem.reservedQuantity : 0;

    // Blood bank stock
    let bankAvail = 0;
    let bankRes = 0;
    state.bloodBanks.forEach((b) => {
      const inv = b.inventories[bg];
      if (inv) {
        bankAvail += inv.availableStock;
        bankRes += inv.reservedStock;
      }
    });

    const totalAvail = Math.round((hospAvail + bankAvail) * 10) / 10;
    const totalRes = Math.round((hospRes + bankRes) * 10) / 10;

    // Active demand from pending/approved requests
    const activeDemand = state.requests
      .filter((r) => r.bloodGroup === bg && r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'rejected')
      .reduce((acc, r) => acc + r.quantityLitres, 0);

    // Expiring within 48h
    let expiring = 0;
    if (hospItem) {
      const expTime = new Date(hospItem.expiryDate).getTime();
      if (expTime > now && expTime - now <= hours48Ms) {
        expiring += hospItem.availableQuantity;
      }
    }

    // Status classification
    let status: 'OPTIMAL' | 'MONITOR' | 'ATTENTION' | 'CRITICAL' = 'OPTIMAL';
    if (totalAvail <= 5.0 || hospAvail <= 1.5) {
      status = 'CRITICAL';
    } else if (totalAvail <= 12.0 || hospAvail <= 3.0) {
      status = 'ATTENTION';
    } else if (expiring > 0 || activeDemand > totalAvail * 0.4) {
      status = 'MONITOR';
    }

    return {
      bloodGroup: bg,
      hospitalAvailable: Math.round(hospAvail * 10) / 10,
      bloodBankAvailable: Math.round(bankAvail * 10) / 10,
      totalAvailable: totalAvail,
      totalReserved: totalRes,
      activeDemand: Math.round(activeDemand * 10) / 10,
      atRiskUnits: hospItem && hospItem.status === 'attention' ? hospItem.availableQuantity : 0,
      expiringUnits: Math.round(expiring * 10) / 10,
      status,
    };
  });
}

export function selectNetworkHealth(state: RaktSetuLocalState): NetworkHealthResult {
  const issues: string[] = [];
  let deduction = 0;

  // 1. Critical inventory shortages
  const criticalGroups = selectCriticalBloodGroups(state);
  if (criticalGroups.length > 0) {
    deduction += criticalGroups.length * 15;
    issues.push(`${criticalGroups.join(', ')} critical low stock detected across network hospitals`);
  }

  // 2. Unfulfilled active requests
  const activeRequests = selectActiveRequests(state);
  const criticalRequests = activeRequests.filter((r) => r.priority === 'emergency');
  if (criticalRequests.length > 0) {
    deduction += criticalRequests.length * 12;
    issues.push(`${criticalRequests.length} critical emergency requisitions pending fulfillment`);
  }

  // 3. Expiring units
  const expiring = selectExpiringInventoryCount(state, 48);
  if (expiring > 0) {
    deduction += Math.min(15, expiring * 4);
    issues.push(`${expiring} L of blood expiring within 48 hours requiring redistribution`);
  }

  // 4. Pending verifications
  const pendingOrgs = selectPendingVerifications(state);
  if (pendingOrgs.length > 0) {
    deduction += 5;
    issues.push(`${pendingOrgs.length} new healthcare organization pending compliance verification`);
  }

  const score = Math.max(10, Math.min(100, 100 - deduction));
  let status: 'HEALTHY' | 'MONITOR' | 'HIGH_PRESSURE' | 'CRITICAL' = 'HEALTHY';

  if (score < 50 || criticalRequests.length >= 2 || criticalGroups.length >= 2) {
    status = 'CRITICAL';
  } else if (score < 75 || criticalGroups.length >= 1) {
    status = 'HIGH_PRESSURE';
  } else if (score < 90 || expiring > 0) {
    status = 'MONITOR';
  }

  return {
    status,
    score,
    criticalCount: criticalGroups.length,
    warningCount: issues.length,
    issues: issues.length > 0 ? issues : ['All regional depots, hospitals, and cross-matching nodes nominal'],
  };
}

export function selectNetworkFlowMetrics(state: RaktSetuLocalState): NetworkFlowMetrics {
  const totalRequests = state.requests.length;
  const fulfilledRequests = state.requests.filter((r) => r.status === 'completed').length;
  const approvedRequests = state.requests.filter((r) => r.status === 'approved' || r.status === 'completed').length;

  const fulfillmentRatePct = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 100;

  // Calculate average fulfillment minutes for delivered transfers
  const delivered = state.transfers.filter((t) => t.status === 'DELIVERED' && t.dispatchedAt && t.deliveredAt);
  let totalMinutes = 0;
  delivered.forEach((d) => {
    const start = new Date(d.dispatchedAt!).getTime();
    const end = new Date(d.deliveredAt!).getTime();
    totalMinutes += Math.max(5, Math.round((end - start) / (60 * 1000)));
  });

  const averageFulfillmentMinutes = delivered.length > 0 ? Math.round(totalMinutes / delivered.length) : 42;

  return {
    requestsCreated: totalRequests,
    requestsApproved: approvedRequests,
    reservationsActive: state.reservations.filter((r) => r.status === 'ACTIVE').length,
    transfersInTransit: state.transfers.filter((t) => t.status === 'IN_TRANSIT').length,
    transfersDelivered: delivered.length,
    fulfillmentRatePct,
    averageFulfillmentMinutes,
  };
}

export function selectRecentActivity(state: RaktSetuLocalState, limit: number = 10): RecentNetworkActivityItem[] {
  const list: RecentNetworkActivityItem[] = [];

  // 1. Transactions
  state.transactions.slice(0, 8).forEach((txn) => {
    list.push({
      id: txn.id,
      timestamp: txn.createdAt,
      timeFormatted: new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'TRANSACTION',
      title: `${txn.transactionType === 'ISSUED' ? 'Blood Issued' : 'Blood Received'}: ${txn.bloodGroup} (${txn.transactionType === 'ISSUED' ? '-' : '+'}${txn.quantityLitres} L)`,
      description: `${txn.department || 'Hospital Depot'} • Ref: ${txn.patientCaseId || txn.referenceId || txn.transactionId}`,
      organizationName: 'CityCare Hospital',
      badgeColor: txn.transactionType === 'ISSUED' ? 'rose' : 'emerald',
      entityId: txn.transactionId,
    });
  });

  // 2. Transfers
  state.transfers.slice(0, 5).forEach((tr) => {
    list.push({
      id: tr.id,
      timestamp: tr.updatedAt,
      timeFormatted: new Date(tr.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'TRANSFER',
      title: `Transfer ${tr.status.replace('_', ' ')}: ${tr.bloodGroup} × ${tr.quantityUnits} L`,
      description: `${tr.fromOrganizationName} → ${tr.toOrganizationName}`,
      badgeColor: tr.status === 'IN_TRANSIT' ? 'blue' : tr.status === 'DELIVERED' ? 'emerald' : 'amber',
      entityId: tr.transferId,
    });
  });

  // 3. Requests
  state.requests.slice(0, 5).forEach((req) => {
    list.push({
      id: req.id,
      timestamp: req.updatedAt,
      timeFormatted: new Date(req.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'REQUEST',
      title: `Request ${req.status.toUpperCase()}: ${req.bloodGroup} × ${req.quantityLitres} L`,
      description: `${req.reason || 'Clinical Requirement'} • Priority: ${req.priority.toUpperCase()}`,
      badgeColor: req.priority === 'emergency' ? 'rose' : 'blue',
      entityId: req.displayId || req.id,
    });
  });

  // Sort descending by timestamp
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return list.slice(0, limit);
}
