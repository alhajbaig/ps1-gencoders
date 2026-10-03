import React from 'react';
import { ArrowRight, AlertOctagon, CheckCircle2 } from 'lucide-react';
import type { HospitalInventoryItem } from '../../data/hospitalInventory';

interface AttentionBannerProps {
  criticalItems: HospitalInventoryItem[];
  onReview: (item: HospitalInventoryItem) => void;
}

export const AttentionBanner: React.FC<AttentionBannerProps> = ({
  criticalItems,
  onReview,
}) => {
  const hasCritical = criticalItems.length > 0;
  const primaryCritical = criticalItems[0];

  if (!hasCritical) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-4 sm:p-5 mb-8 flex items-center justify-between gap-4 shadow-subtle transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-semibold text-sm sm:text-base text-emerald-950">
                Inventory is stable
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">
                OPTIMAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800/90 mt-0.5">
              All blood groups are currently within healthy availability levels.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-700 hidden sm:block">
          Grid synchronized
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle transition-all relative overflow-hidden">
      {/* Subtle decorative left edge accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E11D48]" />

      <div className="flex items-start sm:items-center gap-3.5 pl-1">
        <div className="w-9 h-9 rounded-lg bg-rose-100 text-[#E11D48] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base sm:text-lg text-rose-950">
              {primaryCritical.bloodGroup} requires attention
            </span>
            <span className="text-[10px] font-mono uppercase bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded font-bold">
              CRITICAL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-rose-900/90 mt-0.5">
            Only <strong className="font-semibold text-rose-950 font-mono">{primaryCritical.availableQuantity.toFixed(1)} L</strong> available. Recent demand is high.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onReview(primaryCritical)}
        className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>Review inventory</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
