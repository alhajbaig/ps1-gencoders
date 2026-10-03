import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { RiskBadge } from './RiskBadge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BloodGroupPredictionCardProps {
  prediction: StockoutPrediction;
  isSelected: boolean;
  onSelect: () => void;
}

export const BloodGroupPredictionCard: React.FC<BloodGroupPredictionCardProps> = ({
  prediction,
  isSelected,
  onSelect,
}) => {
  const { bloodGroup, currentStock, features, estimatedStockoutHours, riskLevel } = prediction;

  const getTrendIcon = () => {
    switch (features.usageTrend) {
      case 'increasing':
        return <TrendingUp className="w-3 h-3 text-rose-500" />;
      case 'decreasing':
        return <TrendingDown className="w-3 h-3 text-emerald-500" />;
      case 'stable':
      default:
        return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D] ${
        isSelected
          ? 'bg-white border-[#C1272D] shadow-sm ring-1 ring-[#C1272D]/20'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
      aria-pressed={isSelected}
      aria-label={`View predictions for ${bloodGroup}`}
    >
      {/* Active selection accent line */}
      {isSelected && (
        <span className="absolute top-0 left-3 right-3 h-0.5 bg-[#C1272D] rounded-full" />
      )}

      {/* Header: Blood Group + Risk Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-poppins font-bold text-lg text-slate-900 leading-none">
            {bloodGroup}
          </span>
          <span title={`Usage trend: ${features.usageTrend}`}>
            {getTrendIcon()}
          </span>
        </div>
        <RiskBadge level={riskLevel} size="sm" />
      </div>

      {/* Grid of Key Stats (Current, Usage, Stockout) */}
      <div className="grid grid-cols-3 gap-2 text-left pt-2 border-t border-slate-100">
        <div>
          <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">
            Current
          </span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            {currentStock} <span className="text-[10px] font-normal text-slate-500">units</span>
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">
            Usage
          </span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            {features.recentConsumptionRate.toFixed(1)}{' '}
            <span className="text-[10px] font-normal text-slate-500">U/h</span>
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-medium text-slate-400 tracking-wider">
            Stockout
          </span>
          <span
            className={`font-mono text-sm font-bold ${
              riskLevel === 'critical'
                ? 'text-rose-700'
                : riskLevel === 'high'
                ? 'text-amber-700'
                : 'text-slate-700'
            }`}
          >
            {estimatedStockoutHours !== undefined
              ? estimatedStockoutHours > 24
                ? '>24 hrs'
                : `~${estimatedStockoutHours.toFixed(1)} hrs`
              : 'Safe'}
          </span>
        </div>
      </div>

      {/* Bottom Sub-info: pending requests signal if present */}
      {features.recentRequestsCount > 0 && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pending requests:</span>
          <span className="font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
            {features.recentRequestsCount} req ({features.reservedQuantity}U)
          </span>
        </div>
      )}
    </button>
  );
};
