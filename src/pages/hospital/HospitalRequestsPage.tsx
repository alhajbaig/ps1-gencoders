import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHospitalRequests } from '../../hooks/useHospitalRequests';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { HospitalKpiCard } from '../../components/hospital/HospitalKpiCard';
import { RequestFilters } from '../../components/requests/RequestFilters';
import { RequestTable } from '../../components/requests/RequestTable';
import { HospitalDashboardSkeleton } from '../../components/hospital/HospitalSkeletons';
import type { BloodRequestFilters } from '../../types/bloodRequest';
import {
  GitPullRequest,
  Clock,
  Activity,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const HospitalRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    requests,
    isLoading,
    error,
    activeRequestsCount,
    awaitingApprovalCount,
    inProgressCount,
    completedCount,
    refreshRequests,
  } = useHospitalRequests();

  // Filter state
  const [filters, setFilters] = useState<BloodRequestFilters>({
    status: 'all',
    priority: 'all',
    bloodGroup: 'all',
    dateRange: 'all',
    searchQuery: '',
  });

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      bloodGroup: 'all',
      dateRange: 'all',
      searchQuery: '',
    });
  };

  // Filtered requests computation
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Status filter
      if (filters.status !== 'all' && req.status !== filters.status) {
        return false;
      }

      // 2. Priority filter
      if (filters.priority !== 'all' && req.priority !== filters.priority) {
        return false;
      }

      // 3. Blood group filter
      if (filters.bloodGroup !== 'all' && req.bloodGroup !== filters.bloodGroup) {
        return false;
      }

      // 4. Date filter
      if (filters.dateRange !== 'all') {
        const reqTime = new Date(req.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (filters.dateRange === 'today') {
          const reqDate = new Date(req.createdAt).toDateString();
          const todayDate = new Date().toDateString();
          if (reqDate !== todayDate) return false;
        } else if (filters.dateRange === '7days') {
          if (now - reqTime > 7 * oneDay) return false;
        } else if (filters.dateRange === '30days') {
          if (now - reqTime > 30 * oneDay) return false;
        }
      }

      // 5. Search query (matches displayId, bloodGroup, status, priority, reason)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchId = req.displayId.toLowerCase().includes(q);
        const matchGroup = req.bloodGroup.toLowerCase().includes(q);
        const matchStatus = req.status.toLowerCase().replace('_', ' ').includes(q);
        const matchPriority = req.priority.toLowerCase().includes(q);
        const matchReason = req.reason ? req.reason.toLowerCase().includes(q) : false;
        if (!matchId && !matchGroup && !matchStatus && !matchPriority && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filters]);

  const hasFiltersApplied =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.bloodGroup !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.searchQuery.trim().length > 0;

  if (error) {
    return (
      <HospitalLayout pageTitle="Blood Requests">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center max-w-lg mx-auto my-12 shadow-card">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C1272D] flex items-center justify-center mx-auto mb-3">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
            We couldn't load your requests
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 mb-5">
            {error}
          </p>
          <button
            type="button"
            onClick={refreshRequests}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout pageTitle="Blood Requests">
      {isLoading ? (
        <HospitalDashboardSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* 1. PAGE HEADER (Section 6) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                Blood Requests
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Create, monitor and manage blood requests across the network.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={refreshRequests}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              <Link
                to="/hospital/requests/new"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] active:bg-[#8D181D] px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Blood Request</span>
              </Link>
            </div>
          </div>

          {/* 2. REQUEST KPI STRIP (Section 7) */}
          <section aria-label="Requests Key Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <HospitalKpiCard
              label="Active Requests"
              value={activeRequestsCount}
              explanation="In network workflow"
              indicatorColor={activeRequestsCount > 0 ? 'healthy' : 'neutral'}
              tooltipText="Requests currently undergoing approval, network search, or dispatch coordination."
              icon={<GitPullRequest className="w-4 h-4 text-[#1E4C8A]" />}
            />

            <HospitalKpiCard
              label="Awaiting Approval"
              value={awaitingApprovalCount}
              explanation="Pending clinical review"
              indicatorColor={awaitingApprovalCount > 0 ? 'critical' : 'neutral'}
              tooltipText="Requests waiting for hospital medical director authorization."
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />

            <HospitalKpiCard
              label="In Progress"
              value={inProgressCount}
              explanation="Searching & reservation"
              indicatorColor="healthy"
              tooltipText="Network search, inventory matching, or cold-chain transit active."
              icon={<Activity className="w-4 h-4 text-sky-500" />}
            />

            <HospitalKpiCard
              label="Completed"
              value={completedCount}
              explanation="Fulfilled & received"
              indicatorColor="neutral"
              tooltipText="Historical requests successfully received and cleared into storage."
              icon={<CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
            />
          </section>

          {/* 3. REQUEST FILTER BAR (Section 8) */}
          <RequestFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            totalCount={requests.length}
            filteredCount={filteredRequests.length}
          />

          {/* 4. REQUEST TABLE (Section 9) */}
          <RequestTable
            requests={filteredRequests}
            hasFiltersApplied={hasFiltersApplied}
            onResetFilters={handleResetFilters}
            onCreateNew={() => navigate('/hospital/requests/new')}
          />
        </div>
      )}
    </HospitalLayout>
  );
};
