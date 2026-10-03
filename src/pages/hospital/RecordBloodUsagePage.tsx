import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { transactionService } from '../../services/transactionService';
import { UsageReviewDialog } from '../../components/usage/UsageReviewDialog';
import type { BloodGroup } from '../../types';
import type { BloodInventoryTransaction } from '../../types/transaction';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  FileText,
  LineChart,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const DEPARTMENTS = [
  'Trauma ICU & Resuscitation',
  'Emergency Room (ER)',
  'Cardiothoracic Surgery OR',
  'General Surgery Ward',
  'Obstetrics & Labor Ward',
  'Pediatric Intensive Care',
  'Medical Oncology Ward',
];

export const RecordBloodUsagePage: React.FC = () => {
  const { inventory, refreshInventory } = useHospitalInventory();

  // Form State
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [quantityLitres, setQuantityLitres] = useState<number>(2.0);
  const [patientCaseId, setPatientCaseId] = useState<string>('P1024');
  const [department, setDepartment] = useState<string>('Emergency Room (ER)');
  const [reason, setReason] = useState<string>('Acute trauma resuscitation and blood volume stabilization');
  const [notes, setNotes] = useState<string>('Patient admitted via emergency trauma triage. Immediate transfusion protocol.');
  const [issuedAt, setIssuedAt] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });

  // UI state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTxn, setCreatedTxn] = useState<BloodInventoryTransaction | null>(null);

  // Selected blood group's stock
  const currentItem = inventory.find((i) => i.bloodGroup === bloodGroup);
  const availableStock = currentItem ? currentItem.availableQuantity : 0;
  const isInsufficient = quantityLitres > availableStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientCaseId.trim()) {
      setError('Please provide a Patient or Case ID.');
      return;
    }
    if (quantityLitres <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (isInsufficient) {
      setError(
        `Insufficient inventory: ${quantityLitres} units requested, but only ${availableStock} units of ${bloodGroup} are available.`
      );
      return;
    }

    setIsReviewOpen(true);
  };

  const handleConfirmIssue = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const txn = await transactionService.recordIssue({
        bloodGroup,
        quantityLitres,
        patientCaseId: patientCaseId.trim(),
        department,
        reason: reason.trim(),
        notes: notes.trim(),
        occurredAt: new Date(issuedAt).toISOString(),
        performedBy: 'Dr. Sarah Verma (Staff)',
        verifiedBy: 'Dr. Sarah Verma',
      });

      await refreshInventory();
      setCreatedTxn(txn);
      setIsReviewOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record blood issue transaction.';
      setError(msg);
      setIsReviewOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setCreatedTxn(null);
    setQuantityLitres(1.0);
    setPatientCaseId(`P-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <HospitalLayout pageTitle="Record Blood Usage">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#C1272D] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Step 8 Operational Flow
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Immutable Ledger</span>
            </div>
            <h2 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight mt-1">
              Record Blood Usage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record verified clinical blood consumption. Inventory updates atomically and logs an immutable ledger entry.
            </p>
          </div>

          <Link
            to="/hospital/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Ledger</span>
          </Link>
        </div>

        {/* Success Receipt State (Section 13) */}
        {createdTxn ? (
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Transaction Verified &amp; Ledger Recorded
                </span>
                <h3 className="font-poppins font-bold text-xl text-emerald-950 mt-0.5">
                  Blood issue recorded successfully.
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Actual physical inventory has decreased atomically. Predictive demand and stockout models have dynamically recalibrated.
                </p>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {createdTxn.transactionId}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center py-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Issued Group
                  </span>
                  <span className="font-poppins font-bold text-base text-slate-900">
                    {createdTxn.bloodGroup}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Quantity Deducted
                  </span>
                  <span className="font-mono font-bold text-base text-rose-700">
                    -{createdTxn.quantityLitres.toFixed(1)} L
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Inventory Transition
                  </span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {createdTxn.quantityBefore} &rarr; {createdTxn.quantityAfter} L
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Patient / Case ID: <strong className="font-mono text-slate-800">{createdTxn.patientCaseId}</strong></span>
                <span>Department: <strong className="text-slate-800">{createdTxn.department}</strong></span>
              </div>
            </div>

            {/* Quick Next Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Record Another Issue</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/hospital/transactions"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View in Ledger</span>
                </Link>

                <Link
                  to="/hospital/predictions"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>View Prediction Impact</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Issue Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6"
          >
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Blood Group Selector (8 groups) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Blood Group *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const itm = inventory.find((i) => i.bloodGroup === bg);
                  const isSelected = bloodGroup === bg;
                  return (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-50 border-[#C1272D] text-[#C1272D] font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="block font-poppins text-base font-bold">{bg}</span>
                      <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                        {itm ? `${itm.availableQuantity}U` : '0U'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Input + Real-time Inventory Feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Quantity (Units / Litres) *
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    Available: <strong className="text-slate-800">{availableStock.toFixed(1)} U</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={availableStock > 0 ? availableStock : 10}
                    value={quantityLitres}
                    onChange={(e) => setQuantityLitres(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-base font-semibold focus:outline-none focus:ring-2 ${
                      isInsufficient
                        ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-200'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-red-100 focus:border-[#C1272D]'
                    }`}
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-mono">
                    Units
                  </span>
                </div>
                {isInsufficient && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    Requested quantity exceeds available on-hand stock ({availableStock} U).
                  </p>
                )}
              </div>

              {/* Patient / Case ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Patient / Case ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. P1024 or ER-2026-99"
                  value={patientCaseId}
                  onChange={(e) => setPatientCaseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
                  required
                />
              </div>
            </div>

            {/* Department & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Department / Ward *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Issued At Timestamp *
                </label>
                <input
                  type="datetime-local"
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                Clinical Reason &amp; Indication *
              </label>
              <input
                type="text"
                placeholder="e.g. Active surgical hemorrhage, massive transfusion protocol"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                Clinical Notes / Physician Verification
              </label>
              <textarea
                rows={2}
                placeholder="Optional audit notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/hospital/inventory"
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                &larr; Cancel and return to inventory
              </Link>

              <button
                type="submit"
                disabled={isInsufficient || quantityLitres <= 0}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Confirm Blood Issue &rarr;</span>
              </button>
            </div>
          </form>
        )}

        {/* Confirmation Modal */}
        <UsageReviewDialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmIssue}
          isSubmitting={isSubmitting}
          bloodGroup={bloodGroup}
          quantityLitres={quantityLitres}
          currentAvailableStock={availableStock}
          patientCaseId={patientCaseId}
          department={department}
          reason={reason}
        />
      </div>
    </HospitalLayout>
  );
};
