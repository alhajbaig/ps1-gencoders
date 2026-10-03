import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import {
  Building2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  History,
  Truck,
} from 'lucide-react';

export const AdminOrganizationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppStore();

  const org = state.organizations.find((o) => o.id === id);

  if (!org) {
    return (
      <AdminLayout pageTitle="Organization Not Found">
        <div className="py-16 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Organization Node Not Found</h2>
          <p className="text-xs text-slate-500">The requested facility ID could not be located in the local network state.</p>
          <Link
            to="/admin/organizations"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E4C8A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Organizations List</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isHospital = org.type === 'hospital';
  const relatedTransfers = state.transfers.filter(
    (t) => t.fromOrganizationId === org.id || t.toOrganizationId === org.id
  );
  const relatedAuditLogs = state.auditLogs.filter(
    (a) => a.organizationId === org.id || a.entityId === org.id
  );

  return (
    <AdminLayout pageTitle={`${org.name} — Node Profile`}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/admin/organizations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Organizations</span>
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-poppins font-bold text-xl shrink-0 ${
                isHospital ? 'bg-[#C1272D]' : 'bg-[#0F2E5A]'
              }`}
            >
              {org.code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900">
                  {org.name}
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isHospital
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}
                >
                  {org.type.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {org.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Node ID: <strong className="text-slate-800">{org.id}</strong> &bull; License: <strong className="text-slate-800">{org.licenseNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-400">Total Live Stock:</span>
              <strong className="text-slate-900 text-base">{org.stats.totalInventoryUnits.toFixed(1)} L</strong>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="block text-[10px] text-slate-400">Active Demands:</span>
              <strong className="text-slate-900 text-base">{org.stats.activeRequestsCount}</strong>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Contact & Location */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-poppins font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Facility Address & Contacts
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">{org.location.address}</p>
                  <p className="text-slate-500">{org.location.city}, {org.location.state} — {org.location.pincode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800">{org.contact.primaryPhone}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800">{org.contact.email}</span>
              </div>

              {org.notes && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  "{org.notes}"
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Recent Network Consignments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Cold-Chain Transfers ({relatedTransfers.length})
              </h3>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5">
              {relatedTransfers.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No recent transfers recorded for this facility.</p>
              ) : (
                relatedTransfers.map((tr) => (
                  <div key={tr.id} className="p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{tr.transferId}</span>
                      <span className="font-bold text-blue-600">{tr.status}</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {tr.bloodGroup} × {tr.quantityUnits} L
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {tr.fromOrganizationName} → {tr.toOrganizationName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Audit Trail */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Governance Audit Log
              </h3>
              <History className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {relatedAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No audit events for this organization.</p>
              ) : (
                relatedAuditLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-0.5">{log.reason || 'Routine compliance event'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">By: {log.actorName}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
