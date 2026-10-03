import React from 'react';
import { RefreshCw, Clock, AlertTriangle } from 'lucide-react';

interface PredictionOverviewProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  criticalCount: number;
  highCount: number;
}

export const PredictionOverview: React.FC<PredictionOverviewProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  criticalCount,
  highCount,
}) => {
  const totalAttention = criticalCount + highCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Live Trajectory Monitor
          </span>
          {totalAttention > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>{totalAttention} blood groups require attention</span>
            </span>
          )}
        </div>
        <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
          Predictive Intelligence
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          See where your blood inventory is heading before shortages happen.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono text-slate-500 self-start sm:self-auto flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last updated {lastUpdated}</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Recalculate predictions from latest inventory and transactions"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Updating outlook...' : 'Refresh Predictions'}</span>
        </button>
      </div>
    </div>
  );
};
