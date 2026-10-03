import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import { syncEngine } from '../../sync/broadcastSync';
import {
  RotateCcw,
  ShieldAlert,
  Database,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { state, resetDemo, mutate } = useAppStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { isSupported, tabId } = syncEngine.getChannelStatus();

  const handleConfirmReset = () => {
    resetDemo();
    setShowResetModal(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleToggleAutoSync = () => {
    mutate((draft) => {
      draft.settings.autoSync = !draft.settings.autoSync;
    }, 'STATE_UPDATED');
  };

  const handleToggleProtection = () => {
    mutate((draft) => {
      draft.settings.networkProtectionEnabled = !draft.settings.networkProtectionEnabled;
    }, 'STATE_UPDATED');
  };

  // Estimate local storage usage in KB
  const storageUsageKb = Math.round(
    (JSON.stringify(state).length * 2) / 1024
  );

  return (
    <AdminLayout pageTitle="System Settings & Demo Diagnostics">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                System Governance & Controls
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Local-First Architecture</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Settings & Demo Controls
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure cross-tab synchronization parameters, threshold boundaries, and trigger controlled demo environment resets.
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Demo Environment Reset Complete:</strong> Initial seed dataset restored and synchronized across all open browser tabs.
            </span>
          </div>
        )}

        {/* 1. Operational Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-[#1E4C8A]" />
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Network Operating Parameters
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <p className="font-semibold text-slate-800">Cross-Tab Realtime Broadcast</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synchronize administrative approvals and hospital blood consumption in real-time across multiple tabs via BroadcastChannel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  state.settings.autoSync ? 'bg-[#1E4C8A]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    state.settings.autoSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <p className="font-semibold text-slate-800">Smart Load Balancing & Network Protection</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prevents candidate blood banks from depleting beyond their own 3-hour shortage threshold during candidate matching.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleProtection}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  state.settings.networkProtectionEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    state.settings.networkProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Demo Diagnostics Panel (Requirement #91) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-slate-700" />
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Demo System Diagnostics & Integrity
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">State Version</span>
              <strong className="text-slate-900 font-bold text-base">v{state.stateVersion}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Schema Version</span>
              <strong className="text-slate-900 font-bold text-base">v{state.schemaVersion}</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Storage Size</span>
              <strong className="text-slate-900 font-bold text-base">~{storageUsageKb} KB</strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Broadcast Engine</span>
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isSupported ? 'Channel Active' : 'Storage Fallback'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Active Tab ID:</span>
              <strong className="text-slate-900">{tabId}</strong>
            </div>
            <div className="flex justify-between">
              <span>Organizations Registered:</span>
              <strong className="text-slate-900">{state.organizations.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Transactions Logged:</span>
              <strong className="text-slate-900">{state.transactions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Immutable Audit Logs:</span>
              <strong className="text-slate-900">{state.auditLogs.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Last Synchronized:</span>
              <strong className="text-slate-900">{new Date(state.meta.lastUpdatedAt).toLocaleTimeString()}</strong>
            </div>
          </div>
        </div>

        {/* 3. Demo Reset Zone (Requirement #8) */}
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h2 className="font-poppins font-bold text-base text-rose-950">
                  Reset Demo Environment
                </h2>
              </div>
              <p className="text-xs text-rose-800/80 mt-1 max-w-xl leading-relaxed">
                Restore the initial consistent fictional seed dataset. This resets hospital stock (O+ back to 4.0 L with high demand), restores pending requests, and clears transient test state across all open browser tabs without requiring a page refresh.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Reset RaktSetu Demo?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Restores initial synchronized state across all tabs
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                This will clear any local blood issues, physical inventory reconciliation adjustments, and approved requisitions created during this session.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm & Reset Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
