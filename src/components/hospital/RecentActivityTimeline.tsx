import React from 'react';
import type { InventoryActivityItem } from '../../data/hospitalInventory';
import { Clock } from 'lucide-react';

interface RecentActivityTimelineProps {
  activities: InventoryActivityItem[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activities }) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-poppins font-semibold text-base text-[#0F172A]">
            Recent activity
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">AUDIT LOG</span>
      </div>

      <div className="space-y-4 relative pl-4 border-l border-slate-200 ml-2">
        {activities.slice(0, 5).map((act) => {
          const isCritical = act.statusType === 'critical';
          const isPositive = act.delta?.startsWith('+');
          const isNegative = act.delta?.startsWith('−');

          return (
            <div key={act.id} className="relative pl-3">
              {/* Dot on timeline */}
              <div
                className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                  isCritical
                    ? 'bg-[#E11D48]'
                    : isPositive
                    ? 'bg-[#10B981]'
                    : isNegative
                    ? 'bg-[#1E4C8A]'
                    : 'bg-slate-400'
                }`}
              />

              <div className="flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-[11px] text-slate-400 block mb-0.5">
                    {act.timeFormatted}
                  </span>
                  <span className="font-medium text-[#0F172A] text-sm">
                    {act.description}
                  </span>
                </div>

                {act.delta && (
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0 ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : isNegative
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {act.delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
