import React from 'react';
import type { HospitalInventoryItem, InventorySummary } from '../../data/hospitalInventory';
import { ArrowRight, AlertOctagon, AlertTriangle, AlertCircle } from 'lucide-react';

interface InventoryHealthPanelProps {
  summary: InventorySummary;
  attentionItems: HospitalInventoryItem[];
  onSelectGroup: (item: HospitalInventoryItem) => void;
}

export const InventoryHealthPanel: React.FC<InventoryHealthPanelProps> = ({
  summary,
  attentionItems,
  onSelectGroup,
}) => {
  // Calculate percentages for the simple distribution bars
  const total = summary.totalQuantity > 0 ? summary.totalQuantity : 1;
  const availPct = Math.round((summary.availableQuantity / total) * 100);
  const reservedPct = Math.round((summary.reservedQuantity / total) * 100);

  // Calculate total volume at risk (critical + attention)
  const atRiskVolume = attentionItems
    .filter((i) => i.status === 'critical' || i.status === 'attention')
    .reduce((sum, item) => sum + item.availableQuantity, 0);
  const atRiskPct = Math.min(100, Math.round((atRiskVolume / total) * 100));

  // Only display categories that actually exist (> 0)
  const statusCounts = summary.statusCounts;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-6">
      {/* 1. Inventory Health Visualization */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-poppins font-semibold text-base text-[#0F172A]">
            Inventory health
          </h3>
          <span className="font-mono text-xs text-slate-400">STATUS RATIO</span>
        </div>

        {/* Large Total Number */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tabular-nums">
            {summary.totalQuantity.toFixed(1)} L
          </span>
          <span className="text-xs text-slate-500 font-mono">Total inventory</span>
        </div>

        {/* Ultra-Clear Visual Proportion Bars (Section 19) */}
        <div className="space-y-3">
          {/* Available Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Available</span>
              <span className="font-mono font-bold text-slate-900">
                {summary.availableQuantity.toFixed(1)} L
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                style={{ width: `${availPct}%` }}
              />
            </div>
          </div>

          {/* Reserved Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Reserved</span>
              <span className="font-mono font-bold text-slate-900">
                {summary.reservedQuantity.toFixed(1)} L
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E4C8A] rounded-full transition-all duration-300"
                style={{ width: `${reservedPct}%` }}
              />
            </div>
          </div>

          {/* At Risk Bar */}
          {summary.atRiskCount > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-700 font-medium">At risk</span>
                <span className="font-mono font-bold text-rose-700">
                  {atRiskVolume.toFixed(1)} L
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E11D48] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(6, atRiskPct)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Health Summary counts (Section 20: Only show existing categories) */}
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100 text-xs font-mono">
          {statusCounts.healthy > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <strong>{statusCounts.healthy}</strong> healthy
            </span>
          )}
          {statusCounts.monitor > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <strong>{statusCounts.monitor}</strong> monitor
            </span>
          )}
          {statusCounts.attention > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-900 border border-orange-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
              <strong>{statusCounts.attention}</strong> attention
            </span>
          )}
          {statusCounts.critical > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-900 border border-rose-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
              <strong>{statusCounts.critical}</strong> critical
            </span>
          )}
        </div>
      </div>

      {/* 2. Needs Attention Action List (Section 21) */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-poppins font-semibold text-sm text-[#0F172A] mb-3 flex items-center justify-between">
          <span>Needs attention</span>
          <span className="text-xs font-mono font-normal text-slate-400">
            {attentionItems.length} items
          </span>
        </h4>

        {attentionItems.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-center text-xs text-emerald-800">
            No blood groups currently requiring attention.
          </div>
        ) : (
          <div className="space-y-2.5">
            {attentionItems.map((item) => {
              const isCritical = item.status === 'critical';
              const isAttention = item.status === 'attention';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectGroup(item)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCritical
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : isAttention
                      ? 'bg-orange-50/40 border-orange-200 hover:border-orange-300'
                      : 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCritical ? (
                      <AlertOctagon className="w-4 h-4 text-[#E11D48] shrink-0" />
                    ) : isAttention ? (
                      <AlertTriangle className="w-4 h-4 text-[#F97316] shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-[#0F172A]">
                          {item.bloodGroup}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.availableQuantity.toFixed(1)} L avail
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {item.demandLevel} demand
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGroup(item);
                    }}
                    className={`text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      isCritical
                        ? 'text-[#E11D48] hover:text-[#BE123C]'
                        : isAttention
                        ? 'text-[#F97316] hover:text-orange-950'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    <span>{isCritical ? 'Review' : 'Monitor'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
