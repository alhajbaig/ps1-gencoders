import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { transactionService } from '../../services/transactionService';
import { localEventBus } from '../../sync/localEventBus';
import type { BloodGroup } from '../../types';
import {
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  HeartPulse,
  Building2,
  KeyRound,
  CheckCircle2,
  X,
  ArrowRightLeft,
} from 'lucide-react';

export const HospitalStaffDashboardPage: React.FC = () => {
  const { user, updateUserHospital } = useAuth();
  const { state, mutate } = useAppStore();
  const { refreshInventory } = useHospitalInventory();

  const hospitalId = user?.orgId || 'ORG-HOSP-01';
  const hospitalName = user?.orgName || 'Metropolitan Trauma & General Hospital';
  const staffName = user?.userName || 'Dr. Rahul Sharma';
  const staffTitle = user?.staffTitle || 'Senior Transfusion Officer';

  // Matched organization in network
  const currentOrg =
    state.organizations.find((o) => o.id === hospitalId) ||
    state.organizations.find((o) => o.type === 'hospital');
  const activeJoinCode = currentOrg?.joinCode || 'METRO-7842';

  // Join hospital state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // Quick Issue state
  const [quickIssueModalOpen, setQuickIssueModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [patientCaseId, setPatientCaseId] = useState('');
  const [department, setDepartment] = useState('Emergency OR / Trauma');
  const [issueQuantity, setIssueQuantity] = useState<number>(1.0);
  const [issueReason, setIssueReason] = useState('Acute Hemorrhage Resuscitation');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [issueSuccessMsg, setIssueSuccessMsg] = useState('');

  // Live hospital inventory items
  const inventoryItems = state.hospitalInventory;

  // Transactions performed by this staff or hospital
  const staffTxns = state.transactions
    .filter(
      (t) =>
        t.hospitalId === hospitalId &&
        (t.performedBy.toLowerCase().includes(staffName.toLowerCase()) ||
          t.performedBy.toLowerCase().includes('rahul') ||
          t.transactionType === 'ISSUED')
    )
    .slice(0, 10);

  const totalAvailable = inventoryItems.reduce((acc, i) => acc + i.availableQuantity, 0);
  const criticalItems = inventoryItems.filter((i) => i.availableQuantity <= 1.5 || i.status === 'critical');

  // Currently selected item for quick issue calculation
  const targetInventoryItem = inventoryItems.find((i) => i.bloodGroup === selectedGroup);
  const availableInStock = targetInventoryItem ? targetInventoryItem.availableQuantity : 0;
  const remainingInStock = Math.max(0, Math.round((availableInStock - issueQuantity) * 10) / 10);
  const isInsufficient = issueQuantity > availableInStock;

  // Handle Join Hospital via Unique Code
  const handleJoinHospital = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setJoinError('Please enter a valid hospital join code.');
      return;
    }

    // Match code against hospitals
    const matchedHospital = state.organizations.find(
      (org) =>
        org.type === 'hospital' &&
        (org.joinCode?.toUpperCase() === clean ||
          org.code.toUpperCase() === clean ||
          org.id.toUpperCase() === clean)
    );

    if (!matchedHospital) {
      setJoinError(
        `Invalid Hospital Access Code "${inputCode}". Please request the current authorization code from your hospital transfusion director.`
      );
      return;
    }

    // Update user's hospital in AuthContext & LocalStorage
    updateUserHospital(matchedHospital.id, matchedHospital.name);

    // Audit log
    mutate((draft) => {
      draft.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorId: user?.email || 'staff-user',
        actorName: staffName,
        actorRole: 'hospital_staff',
        organizationId: matchedHospital.id,
        organizationName: matchedHospital.name,
        action: 'STAFF_JOINED',
        entityType: 'HOSPITAL_STAFF',
        entityId: user?.email || 'staff-id',
        severity: 'NOTICE',
        reason: `Clinical staff member ${staffName} linked to ${matchedHospital.name} using access code ${clean}`,
      });
    }, 'AUDIT_CREATED');

    setJoinSuccess(
      `🎉 Successfully connected to ${matchedHospital.name}! You are now authorized to view and issue blood from this facility's live inventory.`
    );
    setInputCode('');
    setShowJoinModal(false);
    setTimeout(() => setJoinSuccess(''), 6000);
  };

  // Open Quick Issue Modal for specific group
  const handleOpenQuickIssue = (group: BloodGroup) => {
    setSelectedGroup(group);
    setIssueQuantity(1.0);
    setIssueError('');
    setQuickIssueModalOpen(true);
  };

  // Submit Quick Bedside Blood Issue
  const handleConfirmQuickIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCaseId.trim()) {
      setIssueError('Patient Case / Transfusion ID is mandatory.');
      return;
    }
    if (issueQuantity <= 0) {
      setIssueError('Issued volume must be greater than zero.');
      return;
    }
    if (isInsufficient) {
      setIssueError(`Insufficient stock. Only ${availableInStock} L of ${selectedGroup} available.`);
      return;
    }

    setIsSubmittingIssue(true);
    setIssueError('');

    try {
      // 1. Immutable record in Transaction Service & local inventory
      const txn = await transactionService.recordIssue({
        bloodGroup: selectedGroup,
        quantityLitres: issueQuantity,
        patientCaseId: patientCaseId.trim(),
        department,
        reason: issueReason.trim(),
        performedBy: `${staffName} (${staffTitle})`,
        verifiedBy: staffName,
        occurredAt: new Date().toISOString(),
      });

      // 2. Atomically mutate AppStore canonical inventory & transaction ledger
      mutate((draft) => {
        const item = draft.hospitalInventory.find((i) => i.bloodGroup === selectedGroup);
        if (item) {
          item.availableQuantity = Math.max(
            0,
            Math.round((item.availableQuantity - issueQuantity) * 10) / 10
          );
          item.status =
            item.availableQuantity <= 1.5
              ? 'critical'
              : item.availableQuantity <= 3.0
              ? 'attention'
              : 'healthy';
        }

        draft.transactions.unshift(txn);

        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: user?.email || 'staff-transfusion',
          actorName: staffName,
          actorRole: 'hospital_staff',
          organizationId: hospitalId,
          organizationName: hospitalName,
          action: 'BLOOD_ISSUED',
          entityType: 'TRANSACTION',
          entityId: txn.transactionId,
          severity: remainingInStock <= 1.5 ? 'WARNING' : 'NOTICE',
          reason: `Bedside blood issue to Case ${patientCaseId.trim()}: ${issueQuantity} L of ${selectedGroup}`,
          newState: txn,
        });
      }, 'TRANSACTION_CREATED');

      // 3. Notify Hospital Context & Local Event Bus
      await refreshInventory();
      localEventBus.emit('INVENTORY_UPDATED');

      setIssueSuccessMsg(
        `Issued ${issueQuantity} L of ${selectedGroup} to Case ${patientCaseId.trim()}. Hospital inventory updated immediately.`
      );
      setQuickIssueModalOpen(false);
      setPatientCaseId('');
      setTimeout(() => setIssueSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setIssueError(err instanceof Error ? err.message : 'Failed to record blood issue.');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  return (
    <HospitalLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-inter">
        {/* Success Banner */}
        {joinSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{joinSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setJoinSuccess('')}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {issueSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{issueSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setIssueSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Welcome Staff Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C1272D] flex items-center justify-center text-white shrink-0 shadow-sm">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900">
                  Welcome, {staffName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldCheck className="w-3 h-3 text-rose-600" />
                  {staffTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Clinical Transfusion Node &bull; Currently Stationed at</span>
                <strong className="text-slate-800 font-semibold">{hospitalName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Join / Switch Hospital Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenQuickIssue('O+')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Bedside Issue</span>
            </button>
          </div>
        </div>

        {/* Hospital Affiliation Card */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0F2E5A] to-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Affiliated Healthcare Facility
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.2 rounded border border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <h2 className="font-poppins font-bold text-base text-white mt-0.5">
                {hospitalName}
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Access Code: <strong className="text-amber-300 font-bold">{activeJoinCode}</strong> &bull; Node: {hospitalId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Enter Access Code to Join Different Hospital</span>
          </button>
        </div>

        {/* Critical Shortage Warning Banner */}
        {criticalItems.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                <strong>Bedside Shortage Alert:</strong> Critical inventory levels detected for{' '}
                <strong>{criticalItems.map((c) => c.bloodGroup).join(', ')}</strong> ({criticalItems.reduce((acc, c) => acc + c.availableQuantity, 0).toFixed(1)} L available). Handle bedside issue with care.
              </span>
            </div>
            <Link
              to="/hospital/inventory"
              className="text-xs font-semibold text-rose-700 hover:underline shrink-0"
            >
              Inspect Reserves &rarr;
            </Link>
          </div>
        )}

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Total Live Hospital Stock
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-slate-900">
                {totalAvailable.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">Litres</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Critical Groups
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-rose-600">
                {criticalItems.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">Groups at risk</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              My Clinical Issues Today
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-emerald-600">
                {staffTxns.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">Transfusion logs</span>
            </div>
          </div>
        </div>

        {/* Live Hospital Stock Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-poppins font-bold text-base text-slate-900">
                Current Bedside Blood Availability
              </h2>
              <p className="text-xs text-slate-500">
                Live verified balance for {hospitalName}. Inventory automatically deducts in hospital dashboard upon issue.
              </p>
            </div>
            <Link
              to="/hospital/inventory"
              className="text-xs font-semibold text-[#1E4C8A] hover:underline flex items-center gap-1"
            >
              <span>Full Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {inventoryItems.map((item) => {
              const isCrit = item.availableQuantity <= 1.5;
              const isAttn = item.availableQuantity <= 3.0 && !isCrit;

              return (
                <div
                  key={item.bloodGroup}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between ${
                    isCrit
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : isAttn
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div>
                    <span className="font-poppins font-bold text-lg block">{item.bloodGroup}</span>
                    <strong className="font-mono text-base font-bold block mt-1">
                      {item.availableQuantity.toFixed(1)} <span className="text-[10px] font-normal">L</span>
                    </strong>
                    <span
                      className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded mt-1 ${
                        isCrit
                          ? 'bg-rose-200 text-rose-800'
                          : isAttn
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isCrit ? 'CRITICAL' : isAttn ? 'ATTENTION' : 'OPTIMAL'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQuickIssue(item.bloodGroup)}
                    className="mt-3 w-full py-1 text-[10px] font-semibold bg-white border border-slate-300 hover:border-[#C1272D] hover:text-[#C1272D] rounded shadow-2xs transition-colors cursor-pointer"
                  >
                    Quick Issue
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Blood Issue History by Staff */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h2 className="font-poppins font-bold text-base text-slate-900">
                Clinical Blood Issue Log (Ledger)
              </h2>
              <p className="text-xs text-slate-500">
                Immutable records of blood administered to patient cases by clinical staff at {hospitalName}.
              </p>
            </div>
            <Link
              to="/hospital/transactions"
              className="text-xs font-semibold text-[#1E4C8A] hover:underline flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Case / Patient ID</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Department / Reason</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {staffTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No blood issues logged yet. Click "Quick Issue" on any blood group tile above to record a bedside transfusion.
                    </td>
                  </tr>
                ) : (
                  staffTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{txn.transactionId}</td>
                      <td className="py-3 px-4 text-slate-700 font-sans font-medium">
                        {txn.patientCaseId || 'Emergency'}
                      </td>
                      <td className="py-3 px-4 font-poppins font-bold text-slate-900">
                        {txn.bloodGroup}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        -{txn.quantityLitres.toFixed(1)} L
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {txn.department || 'Ward'} &bull; {txn.reason || 'Transfusion'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">{txn.performedBy}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(txn.occurredAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: JOIN HOSPITAL VIA UNIQUE ACCESS CODE */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Join Hospital Network
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Enter unique hospital authorization code
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the unique <strong>Hospital Access Code</strong> provided by your hospital's transfusion administration (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">METRO-7842</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">CITY-2491</code>). Your clinical staff account will immediately link to that facility's live inventory pool.
            </p>

            {joinError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinHospital} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Hospital Access Code
                </label>
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. METRO-7842"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4C8A] font-mono text-sm tracking-wider uppercase text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-mono space-y-1">
                <div className="font-semibold text-slate-700">Quick Demo Facility Codes:</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInputCode('METRO-7842')}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-slate-400 cursor-pointer"
                  >
                    METRO-7842 (Metropolitan Trauma)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputCode('CITY-2491')}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-slate-400 cursor-pointer"
                  >
                    CITY-2491 (CityCare Hospital)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputCode('SUN-5510')}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:border-slate-400 cursor-pointer"
                  >
                    SUN-5510 (Sunrise Multi)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2E5A] hover:bg-[#1E4C8A] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Link & Authorize Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK BEDSIDE BLOOD ISSUE DRAWER */}
      {quickIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-poppins font-bold text-lg">
                  {selectedGroup}
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Bedside Blood Issue
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Facility: {hospitalName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickIssueModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmQuickIssue} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value as BloodGroup)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-poppins text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                  >
                    {inventoryItems.map((i) => (
                      <option key={i.bloodGroup} value={i.bloodGroup}>
                        {i.bloodGroup} ({i.availableQuantity.toFixed(1)} L in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Issue Volume (Litres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={availableInStock}
                    required
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600 font-bold"
                  />
                </div>
              </div>

              {/* Live Calculation Panel (Requirement: Available: 10 | Issuing: 2 | Remaining: 8) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Current Hospital Stock:</span>
                  <strong className="text-slate-800 font-bold">{availableInStock.toFixed(1)} Litres</strong>
                </div>
                <div className="flex justify-between items-center text-rose-600">
                  <span>Issuing to Patient:</span>
                  <strong className="font-bold">−{issueQuantity.toFixed(1)} Litres</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Remaining in Hospital:</span>
                  <strong
                    className={`text-sm font-bold ${
                      isInsufficient
                        ? 'text-rose-600'
                        : remainingInStock <= 1.5
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {remainingInStock.toFixed(1)} Litres
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Patient Case / Transfusion ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMERG-2026-904"
                  value={patientCaseId}
                  onChange={(e) => setPatientCaseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Department / Ward
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Trauma OR, ICU"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Clinical Indication / Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Hemorrhage Resuscitation"
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickIssueModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue || isInsufficient}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmittingIssue ? 'Recording...' : 'Confirm & Issue Units'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HospitalLayout>
  );
};
