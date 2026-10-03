import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { RiskBadge } from './RiskBadge';

interface AttentionBannerProps {
  predictions: StockoutPrediction[];
  onSelectGroup: (bloodGroup: StockoutPrediction['bloodGroup']) => void;
  selectedGroup: string;
}

export const AttentionBanner: React.FC<AttentionBannerProps> = ({
  predictions,
  onSelectGroup,
  selectedGroup,
}) => {
  const attentionItems = predictions.filter(
    (p) => p.riskLevel === 'critical' || p.riskLevel === 'high'
  );

  if (attentionItems.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-950 font-poppins">
              Inventory Stable Across All Blood Groups
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Current consumption velocity indicates adequate stock coverage (&gt;24 hours) for all 8 groups under observed demand patterns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalItems = attentionItems.filter((i) => i.riskLevel === 'critical');
  const primaryItem = criticalItems[0] || attentionItems[0];

  return (
    <div className="space-y-3">
      {/* Top Calm Alert Banner (Section 53 & Section 54) */}
      <div
        className={`border rounded-xl p-4 sm:p-5 transition-all ${
          criticalItems.length > 0
            ? 'bg-rose-50/80 border-rose-200/90 text-rose-950'
            : 'bg-amber-50/80 border-amber-200/90 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                criticalItems.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {criticalItems.length > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                  {attentionItems.length === 1 ? '1 Blood Group' : `${attentionItems.length} Blood Groups`}{' '}
                  Requires Attention
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  • 24-Hour Predictive Horizon
                </span>
              </div>

              <p className="text-sm font-medium mt-1 leading-snug">
                <strong className="font-semibold text-rose-950">{primaryItem.bloodGroup}</strong> may become unavailable in{' '}
                <span className="font-semibold underline decoration-rose-400">
                  {primaryItem.estimatedStockoutHours
                    ? `approximately ${primaryItem.estimatedStockoutHours.toFixed(1)} hours`
                    : 'short order'}
                </span>
                . Current verified stock is {primaryItem.currentStock} units with consumption at{' '}
                {primaryItem.features.recentConsumptionRate.toFixed(1)} units/hr.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectGroup(primaryItem.bloodGroup)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <span>Inspect {primaryItem.bloodGroup} Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Needs Attention Compact Cards Strip (Section 27) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Needs Attention Prioritization
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
              {attentionItems.length} active
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Ranked by stockout urgency
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {attentionItems.map((item) => {
            const isSelected = item.bloodGroup === selectedGroup;
            return (
              <div
                key={item.bloodGroup}
                onClick={() => onSelectGroup(item.bloodGroup)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#C1272D] ring-2 ring-rose-100 bg-rose-50/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-poppins font-bold text-base text-slate-900">
                      {item.bloodGroup}
                    </span>
                    <RiskBadge level={item.riskLevel} size="sm" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500">
                    Stock: {item.currentStock} units
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Estimated stockout:</span>
                  <span className="font-semibold text-rose-700 font-mono">
                    {item.estimatedStockoutHours !== undefined
                      ? `~${item.estimatedStockoutHours.toFixed(1)} hrs`
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>Consumption:</span>
                  <span>{item.features.recentConsumptionRate.toFixed(1)} U/hr</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
