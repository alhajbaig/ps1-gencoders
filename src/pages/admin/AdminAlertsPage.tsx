import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import type { AlertSeverity, AlertStatus } from '../../types/admin';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const AdminAlertsPage: React.FC = () => {
  const { state, acknowledgeAlert, resolveAlert } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return state.alerts.filter((alert) => {
      if (statusFilter !== 'ALL' && alert.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          alert.title.toLowerCase().includes(q) ||
          alert.message.toLowerCase().includes(q) ||
          alert.organizationName.toLowerCase().includes(q) ||
          (alert.bloodGroup || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.alerts, statusFilter, severityFilter, searchQuery]);

  return (
    <AdminLayout pageTitle="Critical Alert & Anomaly Center">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Network Threat & Stockout Alerts
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Explainable Detection</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Critical Alert Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-factor alerts explaining the precise operational conditions behind stockout forecasts, shelf-life expiry, and verification delays.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Active Alerts: <strong className="text-rose-600">{state.alerts.filter((a) => a.status === 'ACTIVE').length}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by title, facility name, blood group, or impact..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'ALL')}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="MONITOR">Monitor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              No critical alerts matching your filter selection.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';
              const isResolved = alert.status === 'RESOLVED';
              const isAcknowledged = alert.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={alert.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-4 ${
                    isResolved
                      ? 'border-slate-200 opacity-60'
                      : isCritical
                      ? 'border-rose-200 bg-rose-50/20'
                      : isWarning
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          isResolved
                            ? 'bg-slate-400'
                            : isCritical
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCritical ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-poppins font-bold text-base text-slate-900">
                            {alert.title}
                          </h3>
                          <span
                            className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-xs text-slate-500 font-mono font-medium">
                            Status: <strong className="text-slate-800">{alert.status}</strong>
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-3xl">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {!isResolved && !isAcknowledged && (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Factor Structured Explanation Box (Requirement #22) */}
                  <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 text-xs space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                      Root Cause & Forensic Breakdown (Why?)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Underlying Cause:</span>
                        <p className="text-slate-800 font-medium mt-0.5">{alert.reason}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Clinical & Operational Impact:</span>
                        <p className="text-slate-800 font-medium mt-0.5">{alert.impactExplanation}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Recommended Administrative Action:</span>
                        <p className="text-[#1E4C8A] font-semibold mt-0.5">{alert.recommendedAction}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Affected Facility: <strong className="text-slate-700">{alert.organizationName}</strong></span>
                      <span>Target: <strong className="text-slate-700">{alert.relatedEntityType} #{alert.relatedEntityId}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
