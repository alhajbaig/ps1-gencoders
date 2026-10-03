import React from 'react';
import type { BloodGroup } from '../../types';
import { AlertCircle, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface UsageReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  bloodGroup: BloodGroup;
  quantityLitres: number;
  currentAvailableStock: number;
  patientCaseId: string;
  department: string;
  reason: string;
}

export const UsageReviewDialog: React.FC<UsageReviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  bloodGroup,
  quantityLitres,
  currentAvailableStock,
  patientCaseId,
  department,
  reason,
}) => {
  if (!isOpen) return null;

  const remainingStock = Math.max(0, Math.round((currentAvailableStock - quantityLitres) * 10) / 10);
  const isStockCritical = remainingStock <= 2.0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-[#C1272D] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="review-dialog-title" className="font-poppins font-bold text-lg text-slate-900">
                Confirm Blood Issue
              </h3>
              <p className="text-xs text-slate-500">
                Immutable Transaction Verification • Section 11 Specification
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

        {/* Warning / Inventory Impact Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inventory Impact Summary
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="block text-[10px] uppercase font-medium text-slate-400">
                Current Stock
              </span>
              <span className="font-mono text-base font-bold text-slate-800">
                {currentAvailableStock.toFixed(1)} <span className="text-[10px] font-normal">units</span>
              </span>
            </div>

            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
              <span className="block text-[10px] uppercase font-semibold text-rose-600">
                Issuing Now
              </span>
              <span className="font-mono text-base font-bold text-rose-700">
                -{quantityLitres.toFixed(1)} <span className="text-[10px] font-normal">units</span>
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isStockCritical
                  ? 'bg-rose-100/60 border-rose-300 text-rose-950'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <span className="block text-[10px] uppercase font-medium text-slate-500">
                Remaining Stock
              </span>
              <span className="font-mono text-base font-bold">
                {remainingStock.toFixed(1)} <span className="text-[10px] font-normal">units</span>
              </span>
            </div>
          </div>

          {isStockCritical && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Warning:</strong> Remaining stock ({remainingStock} U) will enter critical stockout threshold.
              </span>
            </div>
          )}
        </div>

        {/* Clinical Audit Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Blood Group:</span>
            <span className="font-semibold text-slate-900 font-poppins">{bloodGroup}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Patient / Case ID:</span>
            <span className="font-mono font-semibold text-slate-900">{patientCaseId}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Department:</span>
            <span className="font-medium text-slate-800">{department}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Clinical Indication:</span>
            <span className="font-medium text-slate-800 text-right truncate max-w-[240px]">
              {reason}
            </span>
          </div>
        </div>

        {/* Verification Invariant Disclaimer */}
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          &bull; By confirming, an immutable ledger entry will be created. Physical inventory will immediately decrease and prediction models will dynamically update.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Recording Transaction...</span>
            ) : (
              <>
                <span>Confirm Blood Issue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
