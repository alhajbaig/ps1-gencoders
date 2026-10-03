import React, { useState } from 'react';
import type { StockoutPrediction } from '../../intelligence/types/prediction';
import { predictionService } from '../../intelligence/services/predictionService';
import { ShieldCheck, ChevronDown, ChevronUp, Layers, CheckCircle } from 'lucide-react';

interface PredictionMetadataCardProps {
  prediction: StockoutPrediction;
}

export const PredictionMetadataCard: React.FC<PredictionMetadataCardProps> = ({ prediction }) => {
  const [showPayload, setShowPayload] = useState(false);
  const { metadata, bloodGroup } = prediction;

  // Generate clean Phase 5 contract input (Section 69)
  const refillContractInput = predictionService.getRefillRecommendationInput(
    prediction,
    prediction.features
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h5 className="font-poppins font-semibold text-xs uppercase tracking-wider text-slate-700">
            Model Governance &amp; Phase 5 Readiness
          </h5>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Deterministic Baseline Engine
        </span>
      </div>

      {/* Metadata Badges Grid (Section 37 & 38) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Model Version
          </span>
          <span className="font-mono font-semibold text-slate-800">
            {metadata.modelVersion}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Model Family
          </span>
          <span className="font-mono font-semibold text-slate-800">
            {metadata.modelType}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Data Ledger Window
          </span>
          <span className="font-mono font-semibold text-slate-800">
            {metadata.dataCoverageDays} Days Verified
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Data Freshness
          </span>
          <span className="font-mono font-semibold text-slate-800">
            Through {metadata.dataThrough}
          </span>
        </div>
      </div>

      {/* Phase 5 Contract Toggle (Section 69) */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowPayload(!showPayload)}
          className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer font-medium"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Phase 5 Refill Recommendation Contract ({bloodGroup})</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            {showPayload ? (
              <>
                Hide Contract <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Inspect Contract <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </span>
        </button>

        {showPayload && (
          <div className="mt-2.5 p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                RefillRecommendationInput Payload Ready
              </span>
              <span>Section 69 Specification</span>
            </div>
            <pre>{JSON.stringify(refillContractInput, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
