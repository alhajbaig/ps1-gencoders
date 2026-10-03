import React, { useState, useEffect, useCallback } from 'react';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { supabaseService } from '../../lib/supabase';
import type { HospitalStaff, CreateStaffInput } from '../../types/staff';
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Mail,
  AlertTriangle,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export const HospitalStaffPage: React.FC = () => {
  const { user } = useAuth();
  const { state, mutate } = useAppStore();

  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateStaffInput>({
    fullName: '',
    email: '',
    staffTitle: 'Transfusion Officer',
    department: 'Blood Bank & Transfusion Medicine',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const currentHospitalId = user?.orgId || 'ORG-HOSP-01';
  const currentHospitalName = user?.orgName || 'Metropolitan Trauma & General Hospital';
  const currentOrg = state.organizations.find((o) => o.id === currentHospitalId) || state.organizations.find(o => o.type === 'hospital');
  const currentJoinCode = currentOrg?.joinCode || 'METRO-7842';

  const handleCopyJoinCode = () => {
    navigator.clipboard.writeText(currentJoinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleRegenerateCode = () => {
    const prefix = currentOrg?.code ? currentOrg.code.split('-')[0] : 'HOSP';
    const newCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    mutate((draft) => {
      const org = draft.organizations.find((o) => o.id === currentHospitalId) || draft.organizations.find(o => o.type === 'hospital');
      if (org) {
        org.joinCode = newCode;
      }
      draft.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorId: user?.email || 'hospital-admin',
        actorName: user?.userName || 'Hospital Administrator',
        actorRole: 'hospital',
        organizationId: currentHospitalId,
        organizationName: currentHospitalName,
        action: 'ORGANIZATION_UPDATED',
        entityType: 'ORGANIZATION',
        entityId: currentHospitalId,
        severity: 'NOTICE',
        reason: `Hospital staff join access code regenerated: ${newCode}`,
      });
    }, 'ORGANIZATION_UPDATED');

    setInviteSuccessMsg(`New Hospital Join Code generated: ${newCode}`);
    setTimeout(() => setInviteSuccessMsg(''), 4000);
  };

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getHospitalStaff(currentHospitalId);
      setStaffList(data);
    } catch (e) {
      console.error('Failed to load staff list', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentHospitalId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setFormError('Please enter full name and official email address.');
      return;
    }
    setFormError('');
    setActionInProgress('creating');

    try {
      const created = await supabaseService.createHospitalStaff(currentHospitalId, formData);
      setStaffList((prev) => [created, ...prev]);

      // Record in canonical audit log
      mutate((draft) => {
        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: user?.email || 'hospital-admin',
          actorName: user?.userName || 'Hospital Administrator',
          actorRole: 'hospital',
          organizationId: currentHospitalId,
          organizationName: currentHospitalName,
          action: 'STAFF_CREATED',
          entityType: 'HOSPITAL_STAFF',
          entityId: created.id,
          severity: 'NOTICE',
          reason: `Authorized new clinical staff: ${created.fullName} (${created.staffTitle})`,
          newState: created,
        });
      }, 'AUDIT_CREATED');

      setShowInviteModal(false);
      setFormData({
        fullName: '',
        email: '',
        staffTitle: 'Transfusion Officer',
        department: 'Blood Bank & Transfusion Medicine',
        password: '',
      });
      setInviteSuccessMsg(`Staff account for ${created.fullName} created successfully.`);
      setTimeout(() => setInviteSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to authorize staff account';
      setFormError(msg);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleStatus = async (staff: HospitalStaff) => {
    const isDeactivating = staff.status === 'ACTIVE';
    setActionInProgress(staff.id);

    try {
      if (isDeactivating) {
        await supabaseService.deactivateStaff(staff.id);
      } else {
        await supabaseService.reactivateStaff(staff.id);
      }

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staff.id
            ? { ...s, status: isDeactivating ? 'DEACTIVATED' : 'ACTIVE' }
            : s
        )
      );

      // Audit log
      mutate((draft) => {
        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: user?.email || 'hospital-admin',
          actorName: user?.userName || 'Hospital Administrator',
          actorRole: 'hospital',
          organizationId: currentHospitalId,
          organizationName: currentHospitalName,
          action: isDeactivating ? 'STAFF_DEACTIVATED' : 'STAFF_REACTIVATED',
          entityType: 'HOSPITAL_STAFF',
          entityId: staff.id,
          severity: isDeactivating ? 'WARNING' : 'NOTICE',
          reason: isDeactivating
            ? `Hospital staff member ${staff.fullName} deactivated. Operational issuance access disabled.`
            : `Hospital staff member ${staff.fullName} reactivated.`,
        });
      }, 'AUDIT_CREATED');
    } catch (err) {
      console.error('Failed to change staff status', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.staffTitle.toLowerCase().includes(q)
    );
  });

  return (
    <HospitalLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-inter">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#C1272D] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Hospital Governance & Access
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                &bull; Role-Based Authorization
              </span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Authorized Hospital Staff
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage authorized clinical staff members permitted to record patient blood transfusions and log verified ledger movements for{' '}
              <strong className="text-slate-800">{currentHospitalName}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E4C8A] hover:bg-[#0F2E5A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Authorize New Staff</span>
          </button>
        </div>

        {inviteSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{inviteSuccessMsg}</span>
          </div>
        )}

        {/* Hospital Unique Access & Join Code Card */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0F2E5A] to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400">
                Hospital Staff Authorization Code
              </span>
            </div>
            <h2 className="font-poppins font-bold text-xl text-white">
              Instant Staff Linkage Code
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clinical transfusion officers, bedside nurses, and technicians can enter this code in their <strong>Transfusion Staff Dashboard</strong> to link their account to <strong>{currentHospitalName}</strong>, view real-time blood stock, and record patient transfusions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-mono text-slate-300 uppercase block tracking-wider">
                Active Hospital Join Code
              </span>
              <span className="font-mono text-2xl font-extrabold tracking-widest text-amber-300">
                {currentJoinCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJoinCode}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerateCode}
                title="Regenerate new join code"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, or role title..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Active Roster: <strong className="text-slate-900">{staffList.filter((s) => s.status === 'ACTIVE').length}</strong>
          </span>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Staff Member</th>
                  <th className="py-3.5 px-4 font-semibold">Role Title</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Authorized Date</th>
                  <th className="py-3.5 px-4 font-semibold">Last Active</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      Loading authorized hospital staff roster...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No staff accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isActive = staff.status === 'ACTIVE';

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {staff.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{staff.fullName}</p>
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {staff.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-sans text-slate-700">
                          <span className="font-medium">{staff.staffTitle}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            HOSPITAL_STAFF
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {staff.lastActiveAt
                            ? new Date(staff.lastActiveAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Never'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff)}
                            disabled={actionInProgress === staff.id}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              isActive
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {actionInProgress === staff.id
                              ? 'Updating...'
                              : isActive
                              ? 'Deactivate'
                              : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Authorize New Staff */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#1E4C8A] text-white flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Authorize Hospital Clinical Staff
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enrolled exclusively for {currentHospitalName}
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Dr. Rahul Sharma or Priya Nair"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Official Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul.sharma@hospital.org"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Staff Clinical Title
                  </label>
                  <select
                    value={formData.staffTitle}
                    onChange={(e) => setFormData({ ...formData, staffTitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  >
                    <option value="Senior Transfusion Officer">Senior Transfusion Officer</option>
                    <option value="Blood Bank Technologist">Blood Bank Technologist</option>
                    <option value="Ward Duty Officer">Ward Duty Officer</option>
                    <option value="ICU Clinical Lead">ICU Clinical Lead</option>
                    <option value="Emergency Transfusion Staff">Emergency Transfusion Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Initial Security Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank for auto-generated temporary key"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                  <strong>Hospital Isolation:</strong> Staff credentials are cryptographically bounded to{' '}
                  <strong>{currentHospitalName}</strong>. Staff cannot query other network hospital reserves or modify administrative settings.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionInProgress === 'creating'}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4C8A] hover:bg-[#0F2E5A] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionInProgress === 'creating' ? 'Authorizing...' : 'Authorize Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </HospitalLayout>
  );
};
