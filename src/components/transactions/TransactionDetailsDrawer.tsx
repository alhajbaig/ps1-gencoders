import React from 'react';
import type { BloodInventoryTransaction } from '../../types/transaction';
import { X, Lock, Clock, User, Building, FileText, CheckCircle2 } from 'lucide-react';

interface TransactionDetailsDrawerProps {
  transaction: BloodInventoryTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsDrawer: React.FC<TransactionDetailsDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const isDeduction =
    transaction.transactionType === 'ISSUED' ||
    transaction.transactionType === 'TRANSFERRED_OUT' ||
    transaction.transactionType === 'EXPIRED';

  const getTypeBadge = () => {
    switch (transaction.transactionType) {
      case 'ISSUED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'RECEIVED':
      case 'TRANSFERRED_IN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRANSFERRED_OUT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADJUSTMENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'EXPIRED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="txn-drawer-title"
      >
        <div className="p-5 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                AUDIT LEDGER
              </span>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${getTypeBadge()}`}
              >
                {transaction.transactionType}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Core Value */}
          <div>
            <span className="font-mono text-xs text-slate-400 block mb-0.5">
              Reference ID
            </span>
            <h3 id="txn-drawer-title" className="font-mono text-xl font-bold text-slate-900">
              {transaction.transactionId}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-poppins text-lg font-bold text-slate-900">
                {transaction.bloodGroup}
              </span>
              <span
                className={`font-mono text-lg font-bold ${
                  isDeduction ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {isDeduction ? '-' : '+'}
                {transaction.quantityLitres.toFixed(1)} units
              </span>
            </div>
          </div>

          {/* Inventory Movement Box (Section 16: Before, Change, After) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Inventory State Audit Progression
            </span>
            <div className="flex items-center justify-between text-center pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Before</span>
                <span className="font-mono text-base font-bold text-slate-800">
                  {transaction.quantityBefore.toFixed(1)} U
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <span>&rarr;</span>
                <span className={isDeduction ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {isDeduction ? '-' : '+'}
                  {transaction.quantityLitres.toFixed(1)}
                </span>
                <span>&rarr;</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">After</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  {transaction.quantityAfter.toFixed(1)} U
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Context & Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Patient / Case ID</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {transaction.patientCaseId || transaction.referenceId || 'N/A'}
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </span>
              <span className="font-medium text-slate-800 text-right">
                {transaction.department || 'Central Storage'}
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Performed By</span>
              </span>
              <span className="font-medium text-slate-800">
                {transaction.performedBy}
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified By</span>
              </span>
              <span className="font-medium text-slate-800">
                {transaction.verifiedBy}
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Occurred At</span>
              </span>
              <span className="font-mono text-slate-800">
                {new Date(transaction.occurredAt).toLocaleString()}
              </span>
            </div>

            {transaction.reason && (
              <div className="py-2 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Clinical Indication</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {transaction.reason}
                </p>
              </div>
            )}

            {transaction.notes && (
              <div className="py-2">
                <span className="text-slate-500 block mb-1">Audit Notes</span>
                <p className="text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{transaction.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Immutable Guarantee Badge (Section 7) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 leading-relaxed font-mono">
              <strong>Immutable Ledger Record:</strong> Verified transactions cannot be edited or deleted. Corrections require an explicit counter-balancing adjustment transaction.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
