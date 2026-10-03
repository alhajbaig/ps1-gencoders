import React, { useState, useEffect } from 'react';
import type { BloodRequest } from '../../types/bloodRequest';
import { Button } from '../common/Button';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface RequestCancelDialogProps {
  isOpen: boolean;
  request: BloodRequest | null;
  onClose: () => void;
  onConfirmCancel: (requestId: string, reason?: string) => Promise<void>;
}

export const RequestCancelDialog: React.FC<RequestCancelDialogProps> = ({
  isOpen,
  request,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState('Patient stabilized / transfusion not required');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !request) return null;

  const isEmergency = request.priority === 'emergency';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
      await onConfirmCancel(request.id, finalReason);
      setIsSubmitting(false);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-premium-lg border border-slate-200 animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-[#C1272D] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="cancel-dialog-title" className="font-poppins font-semibold text-lg text-[#0F172A]">
              Cancel this blood request?
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              This will stop the current request workflow and notify connected nodes.
            </p>
          </div>
        </div>

        {/* Request Parameter Pill Strip */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 mb-4 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>REQUEST ID</span>
            <span className="font-bold text-[#0F172A]">{request.displayId}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>PARAMETER</span>
            <span className="font-semibold text-slate-900">
              {request.bloodGroup} &bull; {request.quantityLitres.toFixed(1)} L &bull; {request.priority.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Emergency Warning Pill per Section 30 */}
        {isEmergency && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-red-200 text-xs text-rose-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#C1272D] shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong>Emergency Requisition:</strong> Cancel only if the patient has stabilized or this requirement is no longer clinically active.
            </p>
          </div>
        )}

        {/* Reason Selector */}
        <div className="mb-5 space-y-2">
          <label htmlFor="cancel-reason-select" className="block text-xs font-medium text-slate-700">
            Reason for cancellation
          </label>
          <select
            id="cancel-reason-select"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isSubmitting}
            className="w-full text-xs font-inter py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
          >
            <option value="Patient stabilized / transfusion not required">
              Patient stabilized / transfusion not required
            </option>
            <option value="Alternative in-hospital stock secured">
              Alternative in-hospital stock secured
            </option>
            <option value="Surgical procedure postponed / cancelled">
              Surgical procedure postponed / cancelled
            </option>
            <option value="Duplicate or test entry">
              Duplicate or test entry
            </option>
            <option value="Other">
              Other clinical reason
            </option>
          </select>

          {selectedReason === 'Other' && (
            <input
              type="text"
              placeholder="Briefly state reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              maxLength={150}
              className="w-full text-xs font-inter py-2 px-3 mt-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Request
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isSubmitting}
            onClick={handleConfirm}
          >
            Cancel Request
          </Button>
        </div>
      </div>
    </div>
  );
};
