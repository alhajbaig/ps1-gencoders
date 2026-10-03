import React from 'react';
import type { HospitalInventoryItem } from '../../data/hospitalInventory';
import { HospitalStatusBadge } from './HospitalStatusBadge';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BloodInventoryTableProps {
  items: HospitalInventoryItem[];
  onSelectGroup: (item: HospitalInventoryItem) => void;
  showPrediction?: boolean;
}

export const BloodInventoryTable: React.FC<BloodInventoryTableProps> = ({
  items,
  onSelectGroup,
  showPrediction = true,
}) => {
  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-4 font-semibold">Blood Group</th>
              <th className="py-3 px-4 font-semibold">Available</th>
              <th className="py-3 px-4 font-semibold">Reserved</th>
              <th className="py-3 px-4 font-semibold">Demand</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const isCritical = item.status === 'critical';
              const isAttention = item.status === 'attention';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectGroup(item)}
                  className={`group transition-colors cursor-pointer ${
                    isCritical
                      ? 'bg-rose-50/30 hover:bg-rose-50/60'
                      : isAttention
                      ? 'bg-orange-50/20 hover:bg-orange-50/40'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Blood Group */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#0F172A] bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60">
                        {item.bloodGroup}
                      </span>
                      {showPrediction && item.prediction && item.prediction.predictedDepletionHours < 12 && (
                        <span className="text-[10px] font-mono text-slate-400 hidden lg:inline-flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          <span>~{item.prediction.predictedDepletionHours}h depletion (demo)</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Available */}
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#0F172A] tabular-nums">
                    {item.availableQuantity.toFixed(1)} L
                  </td>

                  {/* Reserved */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums">
                    {item.reservedQuantity.toFixed(1)} L
                  </td>

                  {/* Demand */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-medium ${
                        item.demandLevel === 'High'
                          ? 'text-orange-950 font-semibold'
                          : item.demandLevel === 'Medium'
                          ? 'text-slate-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.demandLevel} demand
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <HospitalStatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGroup(item);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-[#0F172A] group-hover:text-[#1E4C8A] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards (Per Section 40) */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const isCritical = item.status === 'critical';
          const isAttention = item.status === 'attention';

          return (
            <div
              key={item.id}
              onClick={() => onSelectGroup(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isCritical
                  ? 'bg-rose-50/40 border-rose-200'
                  : isAttention
                  ? 'bg-orange-50/30 border-orange-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#0F172A] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {item.bloodGroup}
                  </span>
                  <HospitalStatusBadge status={item.status} size="sm" />
                </div>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">AVAILABLE</span>
                  <span className="font-bold text-[#0F172A] text-sm">
                    {item.availableQuantity.toFixed(1)} L
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">RESERVED</span>
                  <span className="text-slate-600">
                    {item.reservedQuantity.toFixed(1)} L
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{item.demandLevel} demand</span>
                {item.prediction && (
                  <span className="text-[10px] text-slate-400">
                    ~{item.prediction.predictedDepletionHours}h depletion
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
