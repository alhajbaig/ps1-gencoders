import React, { useState } from 'react';
import type { BloodGroup } from '../../types';
import type { ReconciliationRecord } from '../../types/transaction';
import { X, AlertTriangle } from 'lucide-react';

interface PhysicalCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ReconciliationRecord | null;
  onConfirmAdjustment: (bloodGroup: BloodGroup, physicalCount: number, reason: string, notes: string) => Promise<void>;
}

export const PhysicalCountModal: React.FC<PhysicalCountModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmAdjustment,
}) => {
  if (!isOpen || !record) return null;

  const [physicalCount, setPhysicalCount] = useState<number>(record.verifiedPhysicalStock);
  const [reason, setReason] = useState<string>('Routine bi-weekly cold storage physical reconciliation');
  const [notes, setNotes] = useState<string>('Physical inventory verified by charge technician in blood bank ward.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variance = Math.round((physicalCount - record.calculatedSystemStock) * 10) / 10;
  const hasVariance = Math.abs(variance) >= 0.05;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (physicalCount < 0) {
      setError('Physical count cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmAdjustment(record.bloodGroup, physicalCount, reason, notes);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record reconciliation adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reconcile-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              {record.bloodGroup}
            </div>
            <div>
              <h3 id="reconcile-modal-title" className="font-poppins font-bold text-lg text-slate-900">
                Verify Physical Inventory ({record.bloodGroup})
              </h3>
              <p className="text-xs text-slate-500">
                Step 10 Audit Verification • Section 19 Specification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                System Stock
              </span>
              <span className="font-mono text-lg font-bold text-slate-800">
                {record.calculatedSystemStock.toFixed(1)} U
              </span>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="block text-[10px] uppercase font-semibold text-indigo-700">
                Counted Stock
              </span>
              <span className="font-mono text-lg font-bold text-indigo-950">
                {physicalCount.toFixed(1)} U
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                hasVariance
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="block text-[10px] uppercase font-semibold">
                Variance
              </span>
              <span className="font-mono text-lg font-bold">
                {variance >= 0 ? `+${variance.toFixed(1)}` : variance.toFixed(1)} U
              </span>
            </div>
          </div>

          {/* Physical Count Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Verified Physical Count (Units / Litres) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
              required
            />
          </div>

          {hasVariance && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Inventory Discrepancy Detected</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Confirming will generate an immutable <code className="font-mono font-bold bg-amber-100 px-1 py-0.2 rounded">ADJUSTMENT ({variance >= 0 ? '+' : ''}{variance} U)</code> transaction to reconcile the variance without overwriting past transaction history.
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Reconciliation Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#C1272D]"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Audit Verification Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#C1272D]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Reconciling Ledger...</span>
              ) : (
                <>
                  <span>Commit Reconciliation &rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
