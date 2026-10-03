import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { transactionService, type UsageAnalyticsSummary } from '../../services/transactionService';
import { DataReadinessBadge } from '../../components/intelligence/DataReadinessBadge';
import type { BloodGroup } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  LineChart,
  Plus,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export const UsageAnalyticsPage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [analytics, setAnalytics] = useState<UsageAnalyticsSummary | null>(null);
  const [allSummaries, setAllSummaries] = useState<UsageAnalyticsSummary[]>([]);

  const loadAnalytics = useCallback(async () => {
    try {
      const summaries = await Promise.all(
        BLOOD_GROUPS.map((bg) => transactionService.getUsageAnalytics(bg))
      );
      setAllSummaries(summaries);
      const active = summaries.find((s) => s.bloodGroup === selectedGroup) || summaries[0];
      setAnalytics(active);
    } catch (e) {
      console.error('Error loading usage analytics', e);
    }
  }, [selectedGroup]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-3.5 h-3.5 text-rose-500" />;
      case 'decreasing':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
      case 'stable':
      default:
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <HospitalLayout pageTitle="Blood Usage Analytics">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Step 11 Verified Analytics
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Real Inpatient Consumption</span>
            </div>
            <h2 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight mt-1">
              Blood Usage Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated consumption metrics computed strictly from verified issue transactions. No fabricated trends.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/hospital/predictions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-colors"
            >
              <LineChart className="w-3.5 h-3.5 text-[#C1272D]" />
              <span>Predictive Intelligence</span>
            </Link>

            <Link
              to="/hospital/usage/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Blood Issue</span>
            </Link>
          </div>
        </div>

        {/* Blood Group Selector Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedGroup === bg;
            const summary = allSummaries.find((s) => s.bloodGroup === bg);
            return (
              <button
                key={bg}
                type="button"
                onClick={() => setSelectedGroup(bg)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <span className="block font-poppins text-base font-bold">{bg}</span>
                <span className={`block text-[11px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {summary ? `${summary.todayUsage.toFixed(1)} U today` : '0 U'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Group Deep Dive Metrics */}
        {analytics && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#C1272D] text-white flex items-center justify-center font-poppins font-bold text-xl">
                  {analytics.bloodGroup}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-poppins font-bold text-xl text-slate-900">
                      {analytics.bloodGroup} Consumption Profile
                    </h3>
                    <DataReadinessBadge status={analytics.readiness} dataCoverageDays={analytics.dataCoverageDays} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grounded in {analytics.totalVerifiedTransactions} verified patient transfusions across {analytics.dataCoverageDays} days.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span>Recent Rate:</span>
                <strong className="text-slate-900">{analytics.recentConsumptionRate.toFixed(1)} units/hr</strong>
              </div>
            </div>

            {/* 4 Primary Velocity Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Issued Today
                </span>
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {analytics.todayUsage.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Current calendar day</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Last 24 Hours
                </span>
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {analytics.last24hUsage.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Rolling 24h window</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  7-Day Velocity
                </span>
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {analytics.last7dUsage.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold">
                  {getTrendIcon(analytics.trend)}
                  <span className={analytics.trend === 'increasing' ? 'text-rose-700' : 'text-slate-600'}>
                    {analytics.trend === 'increasing'
                      ? `+${analytics.trendPercentage}% vs prev 7d`
                      : 'Stable consumption'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Daily Mean Average
                </span>
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {analytics.averageDailyUsage.toFixed(1)} <span className="text-xs font-normal text-slate-500">U/day</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Hourly avg: ~{analytics.averageHourlyUsage.toFixed(1)} U/hr
                </span>
              </div>
            </div>

            {/* Invariant Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span>Section 21 Invariant: Unverified records (drafts/voids) are strictly excluded from consumption metrics.</span>
              <Link to="/hospital/predictions" className="font-semibold text-[#C1272D] hover:underline">
                View 24h Depletion Forecast &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </HospitalLayout>
  );
};
