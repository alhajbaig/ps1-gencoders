import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BloodGroup } from '../../types';
import type { RefillRecommendation } from '../../types/refill';
import type { RequestPriority } from '../../types/bloodRequest';
import { refillService } from '../../services/refillService';
import {
  X,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface RefillRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bloodGroup: BloodGroup;
  onSuccess?: (requestId: string) => void;
}

export const RefillRequestDialog: React.FC<RefillRequestDialogProps> = ({
  isOpen,
  onClose,
  bloodGroup,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RefillRecommendation | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState<number>(8);
  const [priority, setPriority] = useState<RequestPriority>('urgent');
  const [reason, setReason] = useState<string>('Predictive stockout anticipated under active clinical consumption');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    refillService
      .calculateRefillRecommendation(bloodGroup)
      .then((rec) => {
        if (!mounted) return;
        setRecommendation(rec);
        setRequestedQuantity(rec.recommendedQuantity || 8);
        setPriority(rec.urgency);
        setReason(rec.reason);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to compute replenishment recommendation.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, bloodGroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendation) return;

    if (requestedQuantity <= 0) {
      setError('Requested quantity must be at least 1 unit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdRequest = await refillService.submitRefillRequest(
        recommendation,
        requestedQuantity,
        {
          hospitalId: 'HSP-00124',
          hospitalName: 'XYZ Hospital',
          hospitalCity: 'Nagpur',
          submittedBy: 'Dr. Sarah Verma (Trauma Lead)',
        }
      );

      if (onSuccess) {
        onSuccess(createdRequest.id);
      }
      onClose();
      navigate(`/hospital/requests/${createdRequest.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit refill request.');
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
        aria-labelledby="refill-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#C1272D] flex items-center justify-center font-poppins font-bold text-lg">
              {bloodGroup}
            </div>
            <div>
              <h3 id="refill-dialog-title" className="font-poppins font-bold text-lg text-slate-900">
                Request Predictive Refill ({bloodGroup})
              </h3>
              <p className="text-xs text-slate-500">
                Step 15 &amp; 17 Replenishment Workflow &bull; Admin Approval Required
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

        {isLoading || !recommendation ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Calculating optimal replenishment buffer...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recommendation Breakdown Card (Section 35 & 70) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Transparent Refill Formula</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Recommended: {recommendation.recommendedQuantity} Units
                </span>
              </div>

              {/* Math Table (Section 35) */}
              <div className="font-mono text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Expected 24h Clinical Demand:</span>
                  <span className="font-semibold">+{recommendation.calculationBreakdown.expectedDemand} U</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Safety Buffer Reserve (20%):</span>
                  <span className="font-semibold">+{recommendation.calculationBreakdown.safetyBuffer} U</span>
                </div>
                <div className="flex justify-between py-1 text-rose-700">
                  <span>Current Available Stock:</span>
                  <span className="font-semibold">-{recommendation.calculationBreakdown.currentStock} U</span>
                </div>
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Confirmed Inbound Stock:</span>
                  <span>-{recommendation.calculationBreakdown.confirmedIncoming} U</span>
                </div>
                <div className="flex justify-between py-1.5 pt-2 font-bold text-slate-900 bg-slate-50/70 -mx-3 px-3 rounded-b-lg border-t border-slate-200">
                  <span>Recommended Refill:</span>
                  <span className="text-[#C1272D] text-sm">
                    {recommendation.calculationBreakdown.netRecommended} Units
                  </span>
                </div>
              </div>
            </div>

            {/* Requested Quantity & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Requested Quantity (Units) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="40"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1272D]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Clinical Urgency *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequestPriority)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#C1272D]"
                >
                  <option value="routine">Routine (Replenishment)</option>
                  <option value="urgent">Urgent (Anticipated Shortage)</option>
                  <option value="emergency">Emergency (Imminent Stockout &lt;4h)</option>
                </select>
              </div>
            </div>

            {/* Clinical Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                Requisition Justification
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#C1272D]"
                required
              />
            </div>

            {/* Notice */}
            <p className="text-[11px] text-slate-500 font-mono">
              &bull; Section 36 Rule: Submitting creates a pending request. Stock transfers occur only after Administrative Approval and Blood Bank Matching.
            </p>

            {/* Footer */}
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
                disabled={isSubmitting || requestedQuantity <= 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <span>Submit Refill Request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
