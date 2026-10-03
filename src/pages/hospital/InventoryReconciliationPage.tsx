import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { transactionService } from '../../services/transactionService';
import { PhysicalCountModal } from '../../components/reconciliation/PhysicalCountModal';
import type { ReconciliationRecord } from '../../types/transaction';
import type { BloodGroup } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const InventoryReconciliationPage: React.FC = () => {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadReconciliation = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.reconcileInventory();
      setRecords(data);
    } catch (e) {
      console.error('Error reconciling inventory', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReconciliation();
    const handleUpdate = () => loadReconciliation();
    window.addEventListener('raktsetu_transaction_updated', handleUpdate);
    return () => window.removeEventListener('raktsetu_transaction_updated', handleUpdate);
  }, [loadReconciliation]);

  const handleOpenVerify = (rec: ReconciliationRecord) => {
    setSelectedRecord(rec);
    setIsModalOpen(true);
  };

  const handleConfirmAdjustment = async (
    bloodGroup: BloodGroup,
    physicalCount: number,
    reason: string,
    notes: string
  ) => {
    await transactionService.recordAdjustment({
      bloodGroup,
      physicalCount,
      reason,
      notes,
      performedBy: 'Lead Quality Auditor',
      verifiedBy: 'Chief Medical Officer',
    });
    await loadReconciliation();
  };

  const totalCalculated = records.reduce((acc, r) => acc + r.calculatedSystemStock, 0);
  const totalPhysical = records.reduce((acc, r) => acc + r.verifiedPhysicalStock, 0);
  const discrepancyCount = records.filter((r) => r.status === 'discrepancy').length;

  return (
    <HospitalLayout pageTitle="Inventory Reconciliation &amp; Audit">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Step 10 Audit Verification
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Mathematical Ledger Balance</span>
            </div>
            <h2 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight mt-1">
              Inventory Reconciliation &amp; Audit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict reconciliation between physical stock counts and verified transactions. Answers: "Why is there currently X units?"
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/hospital/transactions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transaction Ledger</span>
            </Link>

            <button
              type="button"
              onClick={loadReconciliation}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recompute</span>
            </button>
          </div>
        </div>

        {/* Audit Status KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Calculated Ledger Stock
            </span>
            <span className="font-mono text-2xl font-bold text-slate-900">
              {totalCalculated.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Opening + Inflows - Outflows &plusmn; Adjustments
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Counted Physical Stock
            </span>
            <span className="font-mono text-2xl font-bold text-slate-900">
              {totalPhysical.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Active verified in-hospital units
            </span>
          </div>

          <div
            className={`border rounded-xl p-4 shadow-2xs ${
              discrepancyCount > 0
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            }`}
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider block">
              Ledger Audit Integrity
            </span>
            <div className="flex items-center gap-2 mt-1">
              {discrepancyCount > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-poppins font-bold text-lg text-amber-900">
                    {discrepancyCount} Variance Detected
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-poppins font-bold text-lg text-emerald-900">
                    100% Balanced Ledger
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] block mt-1 opacity-80">
              {discrepancyCount > 0
                ? 'Physical count differs from calculated transaction balance'
                : 'Zero discrepancy between verified counts and transactions'}
            </span>
          </div>
        </div>

        {/* Breakdown Table (Section 17) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Group</th>
                  <th className="py-3 px-3 text-right">Opening</th>
                  <th className="py-3 px-3 text-right text-emerald-700">+ Received</th>
                  <th className="py-3 px-3 text-right text-emerald-700">+ Transfers In</th>
                  <th className="py-3 px-3 text-right text-rose-700">- Issued</th>
                  <th className="py-3 px-3 text-right text-rose-700">- Transfers Out</th>
                  <th className="py-3 px-3 text-right text-slate-600">- Expired</th>
                  <th className="py-3 px-3 text-right text-indigo-700">&plusmn; Adjust</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900 bg-slate-100/50">System Stock</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Physical Stock</th>
                  <th className="py-3 px-3.5 text-center">Audit Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {records.map((rec) => {
                  const hasDiscrepancy = rec.status === 'discrepancy';
                  return (
                    <tr
                      key={rec.bloodGroup}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        hasDiscrepancy ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5 font-poppins font-bold text-sm text-slate-900">
                        {rec.bloodGroup}
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-700">
                        {rec.openingStock.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-emerald-700 font-semibold">
                        +{rec.received.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-emerald-700">
                        +{rec.transfersIn.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-rose-700 font-semibold">
                        -{rec.issued.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-600">
                        -{rec.transfersOut.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-500">
                        -{rec.expired.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-indigo-700">
                        {rec.adjustments >= 0 ? `+${rec.adjustments.toFixed(1)}` : rec.adjustments.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3.5 text-right font-bold text-sm text-slate-900 bg-slate-100/40">
                        {rec.calculatedSystemStock.toFixed(1)} U
                      </td>

                      <td className="py-3.5 px-3.5 text-right font-bold text-sm text-slate-900">
                        {rec.verifiedPhysicalStock.toFixed(1)} U
                      </td>

                      <td className="py-3.5 px-3.5 text-center font-sans">
                        {hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{rec.discrepancy > 0 ? `+${rec.discrepancy} U` : `${rec.discrepancy} U`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Balanced</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => handleOpenVerify(rec)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Verify Count
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Reconciliation Formula: Opening + Inflows - Outflows &plusmn; Adjustments = Current Stock</span>
            <span>Section 18 Specification</span>
          </div>
        </div>

        {/* Physical Count Modal */}
        <PhysicalCountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          record={selectedRecord}
          onConfirmAdjustment={handleConfirmAdjustment}
        />
      </div>
    </HospitalLayout>
  );
};
