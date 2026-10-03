import React, { useState } from 'react';
import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { BloodGroupPredictionCard } from './BloodGroupPredictionCard';

interface BloodGroupRiskListProps {
  predictions: StockoutPrediction[];
  selectedGroup: string;
  onSelectGroup: (group: StockoutPrediction['bloodGroup']) => void;
}

export const BloodGroupRiskList: React.FC<BloodGroupRiskListProps> = ({
  predictions,
  selectedGroup,
  onSelectGroup,
}) => {
  const [filter, setFilter] = useState<'all' | 'attention' | 'safe'>('all');

  const filteredPredictions = predictions.filter((p) => {
    if (filter === 'attention') {
      return p.riskLevel === 'critical' || p.riskLevel === 'high';
    }
    if (filter === 'safe') {
      return p.riskLevel === 'monitor' || p.riskLevel === 'low';
    }
    return true;
  });

  const attentionCount = predictions.filter(
    (p) => p.riskLevel === 'critical' || p.riskLevel === 'high'
  ).length;

  return (
    <section aria-label="Blood Inventory Outlook" className="space-y-4">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-poppins font-bold text-lg text-slate-900 tracking-tight">
            Inventory Outlook by Blood Group
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a blood group to view full consumption forecast curves, uncertainty boundaries, and explanation factors.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            All (8)
          </button>
          <button
            type="button"
            onClick={() => setFilter('attention')}
            className={`px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1 ${
              filter === 'attention'
                ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Needs Attention</span>
            {attentionCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center font-bold">
                {attentionCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('safe')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'safe'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Stable / Monitor
          </button>
        </div>
      </div>

      {/* Grid of 8 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {filteredPredictions.map((pred) => (
          <BloodGroupPredictionCard
            key={pred.bloodGroup}
            prediction={pred}
            isSelected={pred.bloodGroup === selectedGroup}
            onSelect={() => onSelectGroup(pred.bloodGroup)}
          />
        ))}
      </div>
    </section>
  );
};
