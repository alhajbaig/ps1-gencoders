import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import type { Organization, OrganizationStatus, OrganizationType } from '../../types/organization';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  MapPin,
} from 'lucide-react';

export const AdminOrganizationsPage: React.FC = () => {
  const { state, verifyOrganization, rejectOrganization, suspendOrganization, reactivateOrganization } = useAppStore();

  const [activeTab, setActiveTab] = useState<OrganizationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrganizationType | 'ALL'>('ALL');

  // Modal States
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [modalType, setModalType] = useState<'VERIFY' | 'REJECT' | 'SUSPEND' | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Counts
  const counts = useMemo(() => {
    return {
      ALL: state.organizations.length,
      PENDING: state.organizations.filter((o) => o.status === 'PENDING').length,
      VERIFIED: state.organizations.filter((o) => o.status === 'VERIFIED').length,
      REJECTED: state.organizations.filter((o) => o.status === 'REJECTED').length,
      SUSPENDED: state.organizations.filter((o) => o.status === 'SUSPENDED').length,
    };
  }, [state.organizations]);

  // Filtered List
  const filteredOrgs = useMemo(() => {
    return state.organizations.filter((org) => {
      // Tab filter
      if (activeTab !== 'ALL' && org.status !== activeTab) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && org.type !== typeFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(query);
        const matchesCode = org.code.toLowerCase().includes(query);
        const matchesCity = org.location.city.toLowerCase().includes(query);
        const matchesLicense = org.licenseNumber.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesCity || matchesLicense;
      }
      return true;
    });
  }, [state.organizations, activeTab, typeFilter, searchQuery]);

  const handleOpenActionModal = (org: Organization, type: 'VERIFY' | 'REJECT' | 'SUSPEND') => {
    setSelectedOrg(org);
    setModalType(type);
    setReasonInput('');
    setErrorMsg('');
  };

  const handleConfirmAction = () => {
    if (!selectedOrg || !modalType) return;

    if ((modalType === 'REJECT' || modalType === 'SUSPEND') && !reasonInput.trim()) {
      setErrorMsg('A detailed reason is mandatory for compliance and audit logs.');
      return;
    }

    if (modalType === 'VERIFY') {
      verifyOrganization(selectedOrg.id);
    } else if (modalType === 'REJECT') {
      rejectOrganization(selectedOrg.id, reasonInput.trim());
    } else if (modalType === 'SUSPEND') {
      suspendOrganization(selectedOrg.id, reasonInput.trim());
    }

    setModalType(null);
    setSelectedOrg(null);
  };

  const getStatusBadge = (status: OrganizationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Suspended
          </span>
        );
      case 'REJECTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Rejected
          </span>
        );
    }
  };

  return (
    <AdminLayout pageTitle="Organization Verification & Compliance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Step 26 Onboarding & Audit
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Role-Based Governance</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Participating Healthcare Organizations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify institutional licenses, review compliance history, and govern network access rights.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Total Nodes: <strong className="text-slate-900">{state.organizations.length}</strong>
            </span>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {(['ALL', 'PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED'] as const).map((tab) => {
              const count = counts[tab];
              const isSelected = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                    isSelected
                      ? 'border-[#C1272D] text-[#C1272D] font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span>{tab === 'ALL' ? 'All Organizations' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 self-end sm:self-auto mb-2 sm:mb-0">
            <span className="text-xs text-slate-500 font-mono">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as OrganizationType | 'ALL')}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
            >
              <option value="ALL">All Types</option>
              <option value="hospital">Hospitals</option>
              <option value="blood_bank">Blood Banks</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by organization name, city, registration code, or license number..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">City / Location</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Live Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Active Requests</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No organizations matching your current search or tab filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => {
                    const isHospital = org.type === 'hospital';

                    return (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/admin/organizations/${org.id}`}
                            className="group flex items-start gap-2.5"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                                isHospital ? 'bg-[#C1272D]' : 'bg-[#0F2E5A]'
                              }`}
                            >
                              {org.code.slice(0, 3)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-[#1E4C8A] transition-colors">
                                {org.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Lic: {org.licenseNumber}
                              </p>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isHospital
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {isHospital ? 'Hospital' : 'Blood Bank'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{org.location.city}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(org.status)}</td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {org.stats.totalInventoryUnits.toFixed(1)} L
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {org.stats.activeRequestsCount > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {org.stats.activeRequestsCount} active
                            </span>
                          ) : (
                            '0'
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(org.registeredAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {org.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenActionModal(org, 'VERIFY')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenActionModal(org, 'REJECT')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {org.status === 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(org, 'SUSPEND')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 rounded transition-colors cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}

                            {org.status === 'SUSPENDED' && (
                              <button
                                type="button"
                                onClick={() => reactivateOrganization(org.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                              >
                                Reactivate
                              </button>
                            )}

                            <Link
                              to={`/admin/organizations/${org.id}`}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                              title="Deep Dive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification / Rejection / Suspension Modal */}
        {modalType && selectedOrg && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      modalType === 'VERIFY'
                        ? 'bg-emerald-600'
                        : modalType === 'SUSPEND'
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    {modalType === 'VERIFY' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-lg text-slate-900">
                      {modalType === 'VERIFY'
                        ? 'Verify Healthcare Organization'
                        : modalType === 'SUSPEND'
                        ? 'Suspend Organization Access'
                        : 'Reject Organization Application'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedOrg.name} ({selectedOrg.code})
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization details card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory License:</span>
                  <strong className="text-slate-800">{selectedOrg.licenseNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="uppercase font-semibold text-slate-800">{selectedOrg.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{selectedOrg.location.address}, {selectedOrg.location.city}</span>
                </div>
              </div>

              {/* Reason input for rejection or suspension */}
              {modalType !== 'VERIFY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Compliance & Regulatory Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="Provide specific justification (e.g. invalid license certificate, pending state inspection, cold chain breach)..."
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                  {errorMsg && <p className="text-xs text-rose-600 mt-1">{errorMsg}</p>}
                </div>
              )}

              {modalType === 'VERIFY' && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  By clicking <strong>Verify Organization</strong>, this facility will be authorized to submit emergency requisitions, receive cold-chain consignments, and participate in network-wide predictive blood load balancing.
                </p>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                    modalType === 'VERIFY'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : modalType === 'SUSPEND'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {modalType === 'VERIFY'
                    ? 'Confirm Verification'
                    : modalType === 'SUSPEND'
                    ? 'Confirm Suspension'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
