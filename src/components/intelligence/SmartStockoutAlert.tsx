import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { RefillRequestDialog } from '../refill/RefillRequestDialog';
import { AlertCircle, AlertTriangle, ArrowRight, Droplets, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react';

interface SmartStockoutAlertProps {
  prediction: StockoutPrediction | null;
  onRefresh?: () => void;
  className?: string;
}

export const SmartStockoutAlert: React.FC<SmartStockoutAlertProps> = ({
  prediction,
  onRefresh: _onRefresh,
  className = '',
}) => {
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!prediction) return null;

  const isUrgent = prediction.riskLevel === 'critical' || prediction.riskLevel === 'high';
  if (!isUrgent) return null;

  const isCritical = prediction.riskLevel === 'critical';
  const hoursFormatted = prediction.estimatedStockoutHours
    ? `approximately ${prediction.estimatedStockoutHours.toFixed(1)} hours`
    : '2–3 hours';

  return (
    <>
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
          isCritical
            ? 'bg-rose-50/90 border-rose-300 text-rose-950'
            : 'bg-amber-50/90 border-amber-300 text-amber-950'
        } ${className}`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Headline */}
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {isCritical ? 'CRITICAL PREDICTIVE ALERT' : 'HIGH STOCKOUT RISK'}
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">&bull; 24h Depletion Horizon</span>
              </div>

              <h4 className="font-poppins font-bold text-base text-slate-900 leading-snug">
                {prediction.bloodGroup} inventory is expected to become unavailable within {hoursFormatted}.
              </h4>

              {/* 3 Metric Pills */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-700 pt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current: <strong>{prediction.currentStock} units</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Consumption: <strong>{prediction.features.recentConsumptionRate.toFixed(1)} U/hr</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Coverage: <strong>{prediction.stockoutRangeFormatted || '~2 hrs'}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Why?</span>
              {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <Link
              to="/hospital/predictions"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Manage Manually
            </Link>

            <button
              type="button"
              onClick={() => setIsRefillDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <span>Request Refill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Explainability Panel (Section 30: Why?) */}
        {showExplanation && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 bg-white/80 rounded-xl p-3.5 text-xs text-slate-800 space-y-2 animate-in fade-in duration-150">
            <span className="font-semibold text-slate-900 block font-poppins">
              Why this predictive alert?
            </span>
            <ul className="space-y-1 list-disc list-inside text-slate-700">
              <li>
                Your {prediction.bloodGroup} physical on-hand stock is currently <strong>{prediction.currentStock} units</strong>.
              </li>
              <li>
                Recent verified consumption has reached <strong>{prediction.features.recentConsumptionRate.toFixed(1)} units/hour</strong> (7-day trend is {prediction.features.usageTrend}).
              </li>
              <li>
                There are <strong>{prediction.features.recentRequestsCount} active requisitions</strong> ({prediction.features.reservedQuantity} units reserved).
              </li>
              <li>
                Zero confirmed incoming replenishment is currently recorded in the network queue.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Refill Modal */}
      <RefillRequestDialog
        isOpen={isRefillDialogOpen}
        onClose={() => setIsRefillDialogOpen(false)}
        bloodGroup={prediction.bloodGroup}
      />
    </>
  );
};
