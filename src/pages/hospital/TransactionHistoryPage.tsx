import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { transactionService } from '../../services/transactionService';
import { TransactionDetailsDrawer } from '../../components/transactions/TransactionDetailsDrawer';
import type { BloodInventoryTransaction, TransactionType } from '../../types/transaction';
import type { BloodGroup } from '../../types';
import {
  Search,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const BLOOD_GROUPS: (BloodGroup | 'all')[] = ['all', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const TRANSACTION_TYPES: { label: string; value: string }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Issued (Consumption)', value: 'ISSUED' },
  { label: 'Transferred In (Receipt)', value: 'TRANSFERRED_IN' },
  { label: 'Received (Supply)', value: 'RECEIVED' },
  { label: 'Transferred Out', value: 'TRANSFERRED_OUT' },
  { label: 'Adjustments (Audit)', value: 'ADJUSTMENT' },
  { label: 'Expired', value: 'EXPIRED' },
];

export const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<BloodInventoryTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<BloodInventoryTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.getTransactions({
        bloodGroup: selectedBloodGroup,
        type: selectedType,
        searchQuery,
      });
      setTransactions(data);
    } catch (e) {
      console.error('Error fetching transactions', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBloodGroup, selectedType, searchQuery]);

  useEffect(() => {
    loadTransactions();

    const handleUpdate = () => loadTransactions();
    window.addEventListener('raktsetu_transaction_updated', handleUpdate);
    return () => window.removeEventListener('raktsetu_transaction_updated', handleUpdate);
  }, [loadTransactions]);

  const handleOpenDetails = (txn: BloodInventoryTransaction) => {
    setSelectedTxn(txn);
    setIsDrawerOpen(true);
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'ISSUED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'RECEIVED':
      case 'TRANSFERRED_IN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRANSFERRED_OUT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADJUSTMENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'EXPIRED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isDeduction = (type: TransactionType) =>
    type === 'ISSUED' || type === 'TRANSFERRED_OUT' || type === 'EXPIRED';

  return (
    <HospitalLayout pageTitle="Blood Transaction History">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Authoritative Inventory Ledger
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; 100% Immutable</span>
            </div>
            <h2 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight mt-1">
              Blood Transaction History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Financial-ledger grade log of verified blood movements, issues, receipts, and reconciliation adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/hospital/inventory/reconciliation"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-colors"
            >
              <span>Reconcile Ledger</span>
            </Link>

            <Link
              to="/hospital/usage/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Blood Issue</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Patient ID, Performed By..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-100 focus:border-[#C1272D]"
            />
          </div>

          {/* Blood Group & Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#C1272D]"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg === 'all' ? 'All Blood Groups' : bg}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#C1272D]"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadTransactions}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Reference / Patient</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading authoritative transaction ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No transactions match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const deduction = isDeduction(txn.transactionType);
                    return (
                      <tr
                        key={txn.id}
                        onClick={() => handleOpenDetails(txn)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {txn.transactionId}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${getTypeBadge(
                              txn.transactionType
                            )}`}
                          >
                            {txn.transactionType}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-poppins font-bold text-slate-900 text-sm">
                          {txn.bloodGroup}
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                            deduction ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {deduction ? '-' : '+'}
                          {txn.quantityLitres.toFixed(1)} U
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          {txn.patientCaseId || txn.referenceId || '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                          {txn.department || 'Central Storage'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 truncate max-w-[130px]">
                          {txn.performedBy}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(txn.occurredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{txn.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {transactions.length} verified records</span>
            <span className="font-mono text-[11px]">Ledger Invariant: Updates strictly prohibited</span>
          </div>
        </div>

        {/* Transaction Details Drawer */}
        <TransactionDetailsDrawer
          transaction={selectedTxn}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      </div>
    </HospitalLayout>
  );
};
