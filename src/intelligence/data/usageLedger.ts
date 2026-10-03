import type { BloodUsageTransaction } from '../types/prediction';

const STORAGE_KEY = 'raktsetu_verified_transactions_v2';

/**
 * Seed historical transactions covering 28 days of verified hospital consumption.
 * Built strictly according to the Section 61 test scenario:
 * O+ was 10.0 L, recent acute trauma issues:
 *   10:00 -> -2.0 L
 *   11:00 -> -1.0 L
 *   12:00 -> -2.0 L
 *   13:00 -> -1.0 L
 * Bringing actual stock to 4.0 L with recent consumption ~1.8 L/hr.
 */
export const SEED_USAGE_TRANSACTIONS: BloodUsageTransaction[] = [
  // --- Today's Acute O+ Depletion Series (Section 61 Demo Scenario) ---
  {
    id: 'tx-20261003-04',
    timestamp: '2026-10-03T11:00:00.000Z',
    timeFormatted: '01:00 PM',
    bloodGroup: 'O+',
    quantityLitres: 1.0,
    type: 'issued',
    department: 'Trauma ICU & Resuscitation',
    reason: 'Active hemorrhage secondary to vehicular crush trauma',
    referenceRequestId: 'REQ-2026-00421',
    verifiedBy: 'Dr. Sarah Verma (Trauma Lead)',
  },
  {
    id: 'tx-20261003-03',
    timestamp: '2026-10-03T10:00:00.000Z',
    timeFormatted: '12:00 PM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Emergency OR 2',
    reason: 'Emergency laparotomy and splenic repair',
    referenceRequestId: 'REQ-2026-00421',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20261003-02',
    timestamp: '2026-10-03T09:00:00.000Z',
    timeFormatted: '11:00 AM',
    bloodGroup: 'O+',
    quantityLitres: 1.0,
    type: 'issued',
    department: 'Emergency OR 2',
    reason: 'Massive transfusion protocol unit 2',
    referenceRequestId: 'REQ-2026-00421',
    verifiedBy: 'Hospital Blood Bank Tech',
  },
  {
    id: 'tx-20261003-01',
    timestamp: '2026-10-03T08:00:00.000Z',
    timeFormatted: '10:00 AM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Trauma Resuscitation Bay 1',
    reason: 'Massive transfusion protocol activation upon ER arrival',
    referenceRequestId: 'REQ-2026-00421',
    verifiedBy: 'Dr. Sarah Verma',
  },

  // --- Today's Other Inpatient Issues ---
  {
    id: 'tx-20261003-05',
    timestamp: '2026-10-03T08:30:00.000Z',
    timeFormatted: '10:30 AM',
    bloodGroup: 'A+',
    quantityLitres: 1.0,
    type: 'issued',
    department: 'Gastroenterology ICU',
    reason: 'Upper GI variceal bleeding stabilization',
    referenceRequestId: 'REQ-2026-00418',
    verifiedBy: 'Dr. Rajesh Deshmukh',
  },
  {
    id: 'tx-20261003-06',
    timestamp: '2026-10-03T07:15:00.000Z',
    timeFormatted: '09:15 AM',
    bloodGroup: 'B+',
    quantityLitres: 0.5,
    type: 'issued',
    department: 'General Surgery Ward',
    reason: 'Pre-operative correction of hematocrit',
    verifiedBy: 'Dr. Amit Trivedi',
  },

  // --- Yesterday's Transactions (2026-10-02) ---
  {
    id: 'tx-20261002-01',
    timestamp: '2026-10-02T17:30:00.000Z',
    timeFormatted: '05:30 PM',
    bloodGroup: 'O+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Cardiothoracic Surgery',
    reason: 'Emergency aortic repair post-bypass',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20261002-02',
    timestamp: '2026-10-02T14:15:00.000Z',
    timeFormatted: '02:15 PM',
    bloodGroup: 'B+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Orthopedics',
    reason: 'Bilateral knee replacement intra-operative requirement',
    referenceRequestId: 'REQ-2026-00403',
    verifiedBy: 'Dr. Amit Trivedi',
  },
  {
    id: 'tx-20261002-03',
    timestamp: '2026-10-02T11:00:00.000Z',
    timeFormatted: '11:00 AM',
    bloodGroup: 'O-',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Emergency & Trauma Bay',
    reason: 'Unmatched universal donor emergency release',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20261002-04',
    timestamp: '2026-10-02T08:00:00.000Z',
    timeFormatted: '08:00 AM',
    bloodGroup: 'A+',
    quantityLitres: 1.0,
    type: 'issued',
    department: 'Oncology Day Care',
    reason: 'Chemotherapy-induced severe anemia',
    verifiedBy: 'Dr. Meera Sen',
  },

  // --- 2 Days Ago (2026-10-01) ---
  {
    id: 'tx-20261001-01',
    timestamp: '2026-10-01T15:00:00.000Z',
    timeFormatted: '03:00 PM',
    bloodGroup: 'A-',
    quantityLitres: 1.0,
    type: 'issued',
    department: 'Pediatrics',
    reason: 'Thalassemia scheduled exchange',
    verifiedBy: 'Dr. Meera Sen',
  },
  {
    id: 'tx-20261001-02',
    timestamp: '2026-10-01T12:00:00.000Z',
    timeFormatted: '12:00 PM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Surgery OT 1',
    reason: 'Open cholecystectomy complication',
    verifiedBy: 'Dr. Rajesh Deshmukh',
  },
  {
    id: 'tx-20261001-03',
    timestamp: '2026-10-01T09:30:00.000Z',
    timeFormatted: '09:30 AM',
    bloodGroup: 'AB-',
    quantityLitres: 0.5,
    type: 'issued',
    department: 'Obstetrics OT',
    reason: 'Placental abruption resuscitation',
    verifiedBy: 'Dr. Anita Joshi',
  },

  // --- Past 7 Days Aggregate Seed Events (2026-09-26 to 2026-09-30) ---
  {
    id: 'tx-20260930-01',
    timestamp: '2026-09-30T14:00:00.000Z',
    timeFormatted: '02:00 PM',
    bloodGroup: 'O+',
    quantityLitres: 2.5,
    type: 'issued',
    department: 'Critical Care ICU',
    reason: 'Sepsis with disseminated intravascular coagulation',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20260929-01',
    timestamp: '2026-09-29T11:00:00.000Z',
    timeFormatted: '11:00 AM',
    bloodGroup: 'AB+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Cardiac Surgery',
    reason: 'Coronary artery bypass transfusion',
    verifiedBy: 'Dr. Amit Trivedi',
  },
  {
    id: 'tx-20260928-01',
    timestamp: '2026-09-28T16:00:00.000Z',
    timeFormatted: '04:00 PM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Trauma OT',
    reason: 'Industrial machinery crush accident',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20260927-01',
    timestamp: '2026-09-27T10:00:00.000Z',
    timeFormatted: '10:00 AM',
    bloodGroup: 'A+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Oncology',
    reason: 'Transfusion support round 3',
    verifiedBy: 'Dr. Meera Sen',
  },
  {
    id: 'tx-20260926-01',
    timestamp: '2026-09-26T13:30:00.000Z',
    timeFormatted: '01:30 PM',
    bloodGroup: 'B+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Nephrology',
    reason: 'Renal failure symptomatic anemia',
    verifiedBy: 'Dr. Rajesh Deshmukh',
  },

  // --- Prior 7 Days Reference Block (2026-09-19 to 2026-09-25) ---
  // Provides baseline for 7-day usage comparisons (+28% increase trend)
  {
    id: 'tx-20260925-01',
    timestamp: '2026-09-25T11:00:00.000Z',
    timeFormatted: '11:00 AM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Trauma OT',
    reason: 'Polytrauma stabilization',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20260923-01',
    timestamp: '2026-09-23T08:00:00.000Z',
    timeFormatted: '08:00 AM',
    bloodGroup: 'O+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Surgery OT 1',
    reason: 'Emergency laparotomy',
    verifiedBy: 'Dr. Sarah Verma',
  },
  {
    id: 'tx-20260921-01',
    timestamp: '2026-09-21T14:00:00.000Z',
    timeFormatted: '02:00 PM',
    bloodGroup: 'A+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'Cardiothoracic',
    reason: 'Valve replacement surgery',
    verifiedBy: 'Dr. Amit Trivedi',
  },
  {
    id: 'tx-20260919-01',
    timestamp: '2026-09-19T12:00:00.000Z',
    timeFormatted: '12:00 PM',
    bloodGroup: 'B+',
    quantityLitres: 1.5,
    type: 'issued',
    department: 'Surgical ICU',
    reason: 'Liver resection postoperative support',
    verifiedBy: 'Dr. Rajesh Deshmukh',
  },

  // --- Historical Baseline Anchor (28 days ago: 2026-09-05) ---
  {
    id: 'tx-20260905-01',
    timestamp: '2026-09-05T09:00:00.000Z',
    timeFormatted: '09:00 AM',
    bloodGroup: 'O+',
    quantityLitres: 2.0,
    type: 'issued',
    department: 'General Surgery',
    reason: 'Gastrectomy surgical coverage',
    verifiedBy: 'Dr. Amit Trivedi',
  },
];

export function getVerifiedTransactions(): BloodUsageTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load verified transactions from localStorage', e);
  }
  // Initialize storage with seed data
  saveVerifiedTransactions(SEED_USAGE_TRANSACTIONS);
  return SEED_USAGE_TRANSACTIONS;
}

export function saveVerifiedTransactions(transactions: BloodUsageTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save verified transactions to localStorage', e);
  }
}

export function recordUsageTransaction(
  tx: Omit<BloodUsageTransaction, 'id' | 'timestamp' | 'timeFormatted'>
): BloodUsageTransaction {
  const all = getVerifiedTransactions();
  const now = new Date();
  const newTx: BloodUsageTransaction = {
    ...tx,
    id: `tx-${Date.now()}`,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  const updated = [newTx, ...all];
  saveVerifiedTransactions(updated);
  return newTx;
}
