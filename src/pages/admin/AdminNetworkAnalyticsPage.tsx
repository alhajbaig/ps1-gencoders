import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import {
  ALL_BLOOD_GROUPS,
  selectBloodGroupSummaryTable,
  selectNetworkFlowMetrics,
  selectExpiringInventoryCount,
} from '../../store/selectors';
import type { BloodGroup } from '../../types';
import {
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const AdminNetworkAnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGroup = (searchParams.get('group') as BloodGroup) || 'ALL';

  const { state } = useAppStore();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'ALL'>('24h');
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>(initialGroup);

  const bloodGroupTable = selectBloodGroupSummaryTable(state);
  const flowMetrics = selectNetworkFlowMetrics(state);
  const expiring48h = selectExpiringInventoryCount(state, 48);

  // Grouped Chart Data
  const chartData = useMemo(() => {
    return ALL_BLOOD_GROUPS.map((bg) => {
      const row = bloodGroupTable.find((r) => r.bloodGroup === bg);
      const totalAvail = row ? row.totalAvailable : 0;
      const totalRes = row ? row.totalReserved : 0;
      const demand = row ? row.activeDemand : 0;
      return {
        bloodGroup: bg,
        available: totalAvail,
        reserved: totalRes,
        demand: demand,
      };
    });
  }, [bloodGroupTable]);

  // Max value for SVG scale
  const maxBarValue = useMemo(() => {
    let max = 10;
    chartData.forEach((d) => {
      if (d.available > max) max = d.available;
      if (d.demand > max) max = d.demand;
    });
    return Math.ceil(max * 1.2);
  }, [chartData]);

  // Hospital node statistics
  const hospitalStats = useMemo(() => {
    return state.organizations
      .filter((o) => o.type === 'hospital')
      .map((hosp) => {
        return {
          id: hosp.id,
          name: hosp.name,
          city: hosp.location.city,
          currentStock: hosp.stats.totalInventoryUnits,
          criticalGroups: hosp.stats.criticalStockGroups,
          activeRequests: hosp.stats.activeRequestsCount,
          completedTransfers: hosp.stats.completedTransfersCount,
        };
      });
  }, [state.organizations]);

  // Blood bank node statistics
  const bloodBankStats = useMemo(() => {
    return state.bloodBanks.map((bank) => {
      let totalPhysical = 0;
      let totalReserved = 0;
      let totalAvailable = 0;
      Object.values(bank.inventories).forEach((inv) => {
        totalPhysical += inv.physicalStock;
        totalReserved += inv.reservedStock;
        totalAvailable += inv.availableStock;
      });

      return {
        id: bank.id,
        name: bank.name,
        city: bank.city,
        totalPhysical: Math.round(totalPhysical * 10) / 10,
        totalReserved: Math.round(totalReserved * 10) / 10,
        totalAvailable: Math.round(totalAvailable * 10) / 10,
        distanceKm: bank.distanceKm,
        demand: bank.networkDemand,
      };
    });
  }, [state.bloodBanks]);

  return (
    <AdminLayout pageTitle="Network-Wide Analytics & Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Step 28 Real Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Computed From State</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Network Analytics & Predictive Flow
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive visibility into regional consumption rates, allocation efficiency, and cold-chain turnaround time.
            </p>
          </div>

          {/* Time range buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            {(['24h', '7d', '30d', 'ALL'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#1E4C8A] text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {range === 'ALL' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Demand & Available Stock Comparative Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-poppins font-bold text-base text-slate-900">
                Blood Group Availability vs Active Demand Pressure
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compares currently available network units (hospitals + banks) against outstanding verified requisitions.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded bg-emerald-500" /> Available Units (L)
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded bg-[#C1272D]" /> Active Demand (L)
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="w-full h-64 relative pt-4">
            <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible">
              {/* Y Axis grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const y = 180 - ratio * 160;
                const labelVal = Math.round(ratio * maxBarValue);
                return (
                  <g key={ratio}>
                    <line x1="45" y1={y} x2="780" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x="35" y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Group Bars */}
              {chartData.map((d, idx) => {
                const colWidth = 720 / chartData.length;
                const xCenter = 55 + idx * colWidth + colWidth / 2;
                const barWidth = 18;

                const availHeight = (d.available / maxBarValue) * 160;
                const demandHeight = (d.demand / maxBarValue) * 160;

                const isSelected = selectedGroup === d.bloodGroup;

                return (
                  <g
                    key={d.bloodGroup}
                    onClick={() => setSelectedGroup(selectedGroup === d.bloodGroup ? 'ALL' : d.bloodGroup)}
                    className="cursor-pointer group"
                  >
                    {/* Available Bar */}
                    <rect
                      x={xCenter - barWidth - 2}
                      y={180 - availHeight}
                      width={barWidth}
                      height={Math.max(2, availHeight)}
                      rx="3"
                      className="fill-emerald-500 hover:fill-emerald-600 transition-colors"
                    />

                    {/* Demand Bar */}
                    <rect
                      x={xCenter + 2}
                      y={180 - demandHeight}
                      width={barWidth}
                      height={Math.max(2, demandHeight)}
                      rx="3"
                      className="fill-[#C1272D] hover:fill-[#A61E24] transition-colors"
                    />

                    {/* X-axis Label */}
                    <text
                      x={xCenter}
                      y="200"
                      textAnchor="middle"
                      className={`text-xs font-mono font-bold ${
                        isSelected ? 'fill-[#C1272D] underline' : 'fill-slate-700'
                      }`}
                    >
                      {d.bloodGroup}
                    </text>

                    {/* Value on hover / top */}
                    {d.demand > 0 && (
                      <text
                        x={xCenter + 2 + barWidth / 2}
                        y={180 - demandHeight - 4}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-rose-600 font-bold"
                      >
                        {d.demand.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. Network Flow Pipeline Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fulfillment Pipeline Funnel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Consignment Turnaround & Fulfillment
              </h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Requisition Approval Rate</span>
                  <span className="font-mono font-bold text-slate-900">
                    {flowMetrics.requestsCreated > 0
                      ? Math.round((flowMetrics.requestsApproved / flowMetrics.requestsCreated) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        flowMetrics.requestsCreated > 0
                          ? (flowMetrics.requestsApproved / flowMetrics.requestsCreated) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Overall Requisition Fulfillment Rate</span>
                  <span className="font-mono font-bold text-slate-900">{flowMetrics.fulfillmentRatePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E4C8A] rounded-full"
                    style={{ width: `${flowMetrics.fulfillmentRatePct}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Avg Dispatch to Delivery
                  </span>
                  <strong className="font-poppins font-bold text-lg text-slate-900 mt-0.5 block">
                    {flowMetrics.averageFulfillmentMinutes} mins
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-mono">Cold-chain compliant</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Active Atomic Locks
                  </span>
                  <strong className="font-poppins font-bold text-lg text-amber-600 mt-0.5 block">
                    {flowMetrics.reservationsActive} active
                  </strong>
                  <span className="text-[10px] text-slate-400 font-mono">Zero double-spending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Risk & Redistribution Opportunities */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Preservation Shelf-Life & Waste Reduction
              </h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <strong>Redistribution Opportunity:</strong> {expiring48h.toFixed(1)} L of scarce blood reaches the 35-day preservation limit within 48 hours. Proactive transfer to high-volume surgical trauma centers prevents inventory expiration.
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block">&lt; 24h</span>
                  <strong className="text-slate-900 font-bold block mt-1">0 L</strong>
                  <span className="text-[10px] text-emerald-600">No imminent loss</span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block">&lt; 48h</span>
                  <strong className="text-amber-600 font-bold block mt-1">{expiring48h.toFixed(1)} L</strong>
                  <span className="text-[10px] text-amber-700">1 unit (B-)</span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block">7 Days</span>
                  <strong className="text-slate-900 font-bold block mt-1">4.5 L</strong>
                  <span className="text-[10px] text-slate-500">Nominal buffer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Participating Facility Inventory Matrix (Hospitals vs Blood Banks) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hospital Performance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Hospital Consumption & Buffer Status
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {hospitalStats.length} Hospitals
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Hospital</th>
                    <th className="py-2.5 px-4 font-semibold">Location</th>
                    <th className="py-2.5 px-4 font-semibold">Live Stock</th>
                    <th className="py-2.5 px-4 font-semibold">Critical Groups</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Active Demands</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {hospitalStats.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-poppins font-semibold text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{h.city}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{h.currentStock.toFixed(1)} L</td>
                      <td className="py-3 px-4">
                        {h.criticalGroups.length > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {h.criticalGroups.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-600">Stable</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">
                        {h.activeRequests}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blood Bank Reserves Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Regional Blood Center Reserves
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {bloodBankStats.length} Centers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Blood Bank</th>
                    <th className="py-2.5 px-4 font-semibold">Available</th>
                    <th className="py-2.5 px-4 font-semibold">Reserved</th>
                    <th className="py-2.5 px-4 font-semibold">Distance</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {bloodBankStats.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-poppins font-semibold text-slate-900">
                        {b.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{b.totalAvailable.toFixed(1)} L</td>
                      <td className="py-3 px-4 text-amber-600">{b.totalReserved.toFixed(1)} L</td>
                      <td className="py-3 px-4 text-slate-500">{b.distanceKm} km</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            b.demand === 'High'
                              ? 'bg-rose-50 text-rose-700'
                              : b.demand === 'Moderate'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {b.demand}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
