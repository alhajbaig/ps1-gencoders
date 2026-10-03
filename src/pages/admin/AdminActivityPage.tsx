import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import { selectRecentActivity } from '../../store/selectors';
import {
  Truck,
  Boxes,
  GitPullRequest,
} from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const { state } = useAppStore();
  const [filterType, setFilterType] = useState<string>('ALL');

  const allActivity = selectRecentActivity(state, 50);

  const filteredActivity = useMemo(() => {
    if (filterType === 'ALL') return allActivity;
    return allActivity.filter((item) => item.type === filterType);
  }, [allActivity, filterType]);

  return (
    <AdminLayout pageTitle="Live Operational Activity Stream">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Step 20 Live Ledger Feed
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Zero Simulated Timers</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Live Network Activity Stream
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological feed generated strictly from real transactional issues, receipts, dispatches, and administrative approvals.
            </p>
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
            {['ALL', 'TRANSACTION', 'TRANSFER', 'REQUEST'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-[#1E4C8A] text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {type === 'ALL' ? 'All Operations' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="space-y-3">
            {filteredActivity.length === 0 ? (
              <p className="py-12 text-center text-slate-400 text-xs italic">
                No activity records found for the selected category.
              </p>
            ) : (
              filteredActivity.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 mt-0.5">
                      {item.type === 'TRANSFER' ? (
                        <Truck className="w-4 h-4 text-blue-600" />
                      ) : item.type === 'REQUEST' ? (
                        <GitPullRequest className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Boxes className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-poppins font-bold text-sm text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px] text-slate-400">
                    <span>{item.timeFormatted}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {item.entityId}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
