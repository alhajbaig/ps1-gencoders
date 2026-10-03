import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import type { AuditLog, AuditSeverity } from '../../types/audit';
import {
  History,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  User,
  X,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { state } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return state.auditLogs.filter((log) => {
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
        return false;
      }
      if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesActor = log.actorName.toLowerCase().includes(q);
        const matchesEntity = log.entityId.toLowerCase().includes(q);
        const matchesOrg = (log.organizationName || '').toLowerCase().includes(q);
        const matchesReason = (log.reason || '').toLowerCase().includes(q);
        return matchesAction || matchesActor || matchesEntity || matchesOrg || matchesReason;
      }
      return true;
    });
  }, [state.auditLogs, severityFilter, roleFilter, searchQuery]);

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARNING
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            NOTICE
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
            <Info className="w-3 h-3 text-slate-500" />
            INFO
          </span>
        );
    }
  };

  return (
    <AdminLayout pageTitle="Governance & Security Audit Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Step 27 Immutable Audit Trail
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Append-Only Log</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Regulatory Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only tamper-evident verification ledger tracking all administrative approvals, verifications, inventory adjustments, and dispatches.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Logged Events: <strong className="text-slate-900">{state.auditLogs.length}</strong>
          </div>
        </div>

        {/* Filters & Search Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, actor name, entity ID (e.g. REQ-1042), or keyword..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="NOTICE">Notice</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hospital">Hospital</option>
                <option value="blood_bank">Blood Bank</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Entity Type / ID</th>
                  <th className="py-3 px-4 font-semibold">Actor / Role</th>
                  <th className="py-3 px-4 font-semibold">Organization</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Reason / Summary</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No audit records matching your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        <span className="text-[10px] uppercase text-slate-400 block">{log.entityType}</span>
                        <span className="font-semibold text-slate-800">{log.entityId}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-800">{log.actorName}</p>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {log.actorRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {log.organizationName || 'RaktSetu Network'}
                      </td>

                      <td className="py-3 px-4">{getSeverityBadge(log.severity)}</td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {log.reason || 'Routine verified transaction'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="text-[#1E4C8A] font-semibold text-[11px] hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Details Modal / Drawer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-lg text-slate-900">
                      Audit Record: {selectedLog.id}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Timestamp: {new Date(selectedLog.timestamp).toISOString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Forensic Details Grid */}
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Action</span>
                    <strong className="text-slate-900">{selectedLog.action}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Severity</span>
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Actor</span>
                    <span className="text-slate-800 font-semibold">{selectedLog.actorName} ({selectedLog.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Organization</span>
                    <span className="text-slate-800">{selectedLog.organizationName || 'RaktSetu Network'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Entity Target</span>
                    <span className="text-slate-800">{selectedLog.entityType}: {selectedLog.entityId}</span>
                  </div>
                </div>

                {/* Justification / Reason */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-1">
                    Recorded Reason & Justification
                  </span>
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 leading-relaxed font-sans text-xs">
                    {selectedLog.reason || 'Routine compliance operation recorded by system engine.'}
                  </div>
                </div>

                {/* State Diff (Before vs After) */}
                {Boolean(selectedLog.previousState || selectedLog.newState) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">Before State</span>
                      <pre className="text-[11px] text-slate-700 whitespace-pre-wrap overflow-x-auto">
                        {selectedLog.previousState
                          ? JSON.stringify(selectedLog.previousState, null, 2)
                          : 'null'}
                      </pre>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">New State</span>
                      <pre className="text-[11px] text-emerald-800 whitespace-pre-wrap overflow-x-auto">
                        {selectedLog.newState
                          ? JSON.stringify(selectedLog.newState, null, 2)
                          : 'null'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
