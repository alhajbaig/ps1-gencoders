import React from 'react';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { usePredictions } from '../../hooks/usePredictions';
import { PredictionOverview } from '../../components/intelligence/PredictionOverview';
import { AttentionBanner } from '../../components/intelligence/AttentionBanner';
import { BloodGroupRiskList } from '../../components/intelligence/BloodGroupRiskList';
import { StockoutRiskCard } from '../../components/intelligence/StockoutRiskCard';
import { ForecastChart } from '../../components/intelligence/ForecastChart';
import { PredictionExplanation } from '../../components/intelligence/PredictionExplanation';
import { PredictionMetadataCard } from '../../components/intelligence/PredictionMetadataCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const PredictiveIntelligencePage: React.FC = () => {
  const {
    predictions,
    selectedPrediction,
    selectedGroup,
    setSelectedGroup,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refreshPredictions,
    criticalPredictions,
    attentionPredictions,
  } = usePredictions();

  return (
    <HospitalLayout pageTitle="Predictive Intelligence">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* 1. Header Overview (Section 26 & 68) */}
        <PredictionOverview
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={refreshPredictions}
          criticalCount={criticalPredictions.length}
          highCount={attentionPredictions.length - criticalPredictions.length}
        />

        {/* 2. Error Fallback (Section 49 & 67) */}
        {error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-poppins font-bold text-base text-rose-950">
              Prediction temporarily unavailable
            </h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error} Your actual inventory and usage data remain completely safe and unchanged.
            </p>
            <button
              type="button"
              onClick={refreshPredictions}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Prediction Engine</span>
            </button>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div className="space-y-6 animate-pulse">
            <div className="h-28 bg-slate-200 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-xl" />
              ))}
            </div>
            <div className="h-44 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        ) : (
          <>
            {/* 3. NEEDS ATTENTION SECTION (Section 27, 53, 54, 65) */}
            <AttentionBanner
              predictions={predictions}
              selectedGroup={selectedGroup}
              onSelectGroup={(grp) => setSelectedGroup(grp)}
            />

            {/* 4. INVENTORY OUTLOOK: 8 BLOOD GROUPS GRID (Section 28, 65) */}
            <BloodGroupRiskList
              predictions={predictions}
              selectedGroup={selectedGroup}
              onSelectGroup={(grp) => setSelectedGroup(grp)}
            />

            {/* 5. SELECTED BLOOD GROUP DEEP-DIVE (Section 29, 30, 31, 65) */}
            {selectedPrediction && (
              <section aria-label={`${selectedGroup} Detailed Forecast`} className="space-y-6 pt-2">
                {/* 5A. Detail Outlook Metric Header (Section 29) */}
                <StockoutRiskCard prediction={selectedPrediction} />

                {/* 5B. Forecast Depletion Chart (Section 30 & 31) */}
                <ForecastChart prediction={selectedPrediction} />

                {/* 5C. Explainable Factors + Judge Test Verification (Section 24, 25, 71) */}
                <PredictionExplanation prediction={selectedPrediction} />

                {/* 5D. Model Governance + Phase 5 Contract Payload (Section 37, 38, 69) */}
                <PredictionMetadataCard prediction={selectedPrediction} />
              </section>
            )}
          </>
        )}
      </div>
    </HospitalLayout>
  );
};
