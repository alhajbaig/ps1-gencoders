import React, { useState } from 'react';
import { NetworkMapDiagram } from '../components/network/NetworkMapDiagram';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import {
  DEMO_NETWORK_NODES,
  DEMO_PREDICTIVE_ALERTS,
  DEMO_ACTIVE_TRANSFERS,
} from '../data/mockData';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Search,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NetworkPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'transfers' | 'alerts'>('nodes');
  const [nodeFilter, setNodeFilter] = useState<'all' | 'hospital' | 'blood_bank'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = DEMO_NETWORK_NODES.filter((node) => {
    const matchesType = nodeFilter === 'all' || node.type === nodeFilter;
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Disclaimer / Demo Notice */}
      <div className="mb-8 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-mono font-bold text-xs uppercase tracking-wide">
            Simulated Network Telemetry
          </span>
          <span className="text-xs text-amber-800">
            — All facilities, patient demand logs, and inventory figures shown are synthetic demonstration data.
          </span>
        </div>
        <div className="text-[11px] font-mono text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded border border-amber-200">
          STATUS: DEMO CLUSTER ACTIVE
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-mono font-semibold tracking-widest text-[#C1272D] uppercase block mb-3">
          NETWORK TOPOLOGY &amp; TELEMETRY
        </span>
        <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-[#0F172A] tracking-tight leading-[1.1] mb-4">
          A Connected Blood Network
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
          How hospitals and regional blood repositories communicate in real time to route reserves and balance emergency demand.
        </p>
      </div>

      {/* Network Map Diagram Component */}
      <NetworkMapDiagram interactive={true} />

      {/* Telemetry Tabs Section */}
      <div className="mt-14 bg-white border border-[#E2E8F0] rounded-xl shadow-subtle overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 pt-4 gap-4 bg-slate-50/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`pb-4 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'nodes'
                  ? 'border-[#C1272D] text-[#C1272D] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Connected Nodes ({DEMO_NETWORK_NODES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              className={`pb-4 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'transfers'
                  ? 'border-[#1E4C8A] text-[#1E4C8A] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Active Transfers ({DEMO_ACTIVE_TRANSFERS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`pb-4 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'alerts'
                  ? 'border-[#E11D48] text-[#E11D48] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Predictive Alerts ({DEMO_PREDICTIVE_ALERTS.length})</span>
            </button>
          </div>

          <div className="pb-3 text-xs font-mono text-slate-400">
            SIMULATED REFRESH INTERVAL: 5s
          </div>
        </div>

        {/* Tab 1: Connected Nodes */}
        {activeTab === 'nodes' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter nodes by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E4C8A]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-mono">TYPE:</span>
                {(['all', 'hospital', 'blood_bank'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNodeFilter(type)}
                    className={`px-2.5 py-1 rounded text-xs font-mono uppercase transition-colors cursor-pointer ${
                      nodeFilter === type
                        ? 'bg-[#0F172A] text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'hospital' ? 'Hospitals' : 'Blood Banks'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 font-mono text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-3">Organization Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Stock Units</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Active Requests</th>
                    <th className="py-3 px-3">Last Ping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#0F172A]">
                        {node.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 capitalize">
                        {node.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{node.city}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0F172A]">
                        {node.bloodUnitsTotal} u
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          variant={
                            node.status === 'optimal'
                              ? 'success'
                              : node.status === 'critical'
                              ? 'critical'
                              : node.status === 'low_stock'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {node.status.replace('_', ' ')}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#1E4C8A]">
                        {node.activeRequestsCount}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {node.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Active Transfers */}
        {activeTab === 'transfers' && (
          <div className="p-6">
            <div className="space-y-3">
              {DEMO_ACTIVE_TRANSFERS.map((trf) => (
                <div
                  key={trf.id}
                  className="p-4 rounded-lg border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
                        trf.urgency === 'critical'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : trf.urgency === 'high'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F172A]">
                          {trf.id}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.2 bg-white border border-slate-200 rounded font-bold text-[#C1272D]">
                          {trf.units}x {trf.bloodGroup}
                        </span>
                        <StatusBadge
                          variant={
                            trf.status === 'in_transit'
                              ? 'warning'
                              : trf.status === 'completed'
                              ? 'success'
                              : 'info'
                          }
                          size="sm"
                        >
                          {trf.status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">{trf.fromNodeName}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-medium text-slate-800">{trf.toNodeName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TIME</span>
                      <span>{trf.timestamp}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">ETA</span>
                      <span className="font-bold text-[#0F172A]">
                        {trf.etaMinutes > 0 ? `${trf.etaMinutes} mins` : 'Delivered'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Predictive Alerts */}
        {activeTab === 'alerts' && (
          <div className="p-6">
            <div className="space-y-3">
              {DEMO_PREDICTIVE_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-rose-50/40 border-rose-200'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={
                          alert.severity === 'critical'
                            ? 'critical'
                            : alert.severity === 'warning'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {alert.type.replace(/_/g, ' ').toUpperCase()}
                      </StatusBadge>
                      <span className="font-mono text-xs font-bold text-[#0F172A]">
                        {alert.targetOrg}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.2 bg-white border border-slate-200 rounded font-bold text-red-600">
                        {alert.bloodGroup}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-semibold text-slate-600">
                      HORIZON: {alert.timeframe}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-inter">
                    {alert.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Final Register CTA */}
      <div className="mt-16 text-center max-w-xl mx-auto">
        <h3 className="font-poppins font-semibold text-2xl text-[#0F172A] mb-2">
          Want to connect your hospital node?
        </h3>
        <p className="text-sm text-[#64748B] mb-6">
          Phase 1 registration is currently open for certified medical centers and licensed regional blood repositories.
        </p>
        <Link to="/register">
          <Button variant="accent" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Register Your Facility
          </Button>
        </Link>
      </div>
    </div>
  );
};
