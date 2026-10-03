import React, { useState } from 'react';
import { useHospitalInventory } from '../context/HospitalInventoryContext';
import { HospitalLayout } from '../components/hospital/HospitalLayout';
import { HospitalKpiCard } from '../components/hospital/HospitalKpiCard';
import { HospitalStatusBadge } from '../components/hospital/HospitalStatusBadge';
import { InventoryDrawer } from '../components/hospital/InventoryDrawer';
import { Button } from '../components/common/Button';
import {
  HospitalDashboardSkeleton,
  HospitalErrorState,
} from '../components/hospital/HospitalSkeletons';
import type { HospitalInventoryItem } from '../data/hospitalInventory';
import {
  Plus,
  Droplets,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const HospitalInventoryPage: React.FC = () => {
  const {
    inventory,
    activity,
    summary,
    isLoading,
    error,
    updateInventory,
    refreshInventory,
  } = useHospitalInventory();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'details' | 'update'>('details');
  const [selectedGroupItem, setSelectedGroupItem] = useState<HospitalInventoryItem | null>(null);

  // Expiring soon count (within 14 days)
  const expiringSoonCount = inventory.filter((item: HospitalInventoryItem) => {
    const expiry = new Date(item.expiryDate).getTime();
    const now = new Date('2026-10-03').getTime();
    const daysDiff = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysDiff <= 14;
  }).length;

  const handleOpenDetails = (item: HospitalInventoryItem) => {
    setSelectedGroupItem(item);
    setDrawerMode('details');
    setDrawerOpen(true);
  };

  const handleOpenAddUpdate = (item?: HospitalInventoryItem) => {
    setSelectedGroupItem(item || inventory[0]);
    setDrawerMode('update');
    setDrawerOpen(true);
  };

  if (error) {
    return (
      <HospitalLayout pageTitle="Inventory">
        <HospitalErrorState onRetry={refreshInventory} />
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout pageTitle="Inventory">
      {isLoading ? (
        <HospitalDashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* 1. PAGE HEADER (Section 24) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                Inventory
              </h2>
              <p className="text-sm text-[#64748B] mt-0.5">
                Manage the blood available at your hospital.
              </p>
            </div>

            <Button
              variant="accent"
              size="md"
              onClick={() => handleOpenAddUpdate()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Update inventory
            </Button>
          </div>

          {/* 2. INVENTORY SUMMARY METRICS (Section 25) */}
          <section aria-label="Inventory Summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <HospitalKpiCard
              label="Total"
              value={summary.totalQuantity.toFixed(1)}
              unit="L"
              explanation="Across 8 blood groups"
              icon={<Droplets className="w-4 h-4" />}
            />

            <HospitalKpiCard
              label="Available"
              value={summary.availableQuantity.toFixed(1)}
              unit="L"
              explanation="Ready for allocation"
              indicatorColor="healthy"
              icon={<CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
            />

            <HospitalKpiCard
              label="Reserved"
              value={summary.reservedQuantity.toFixed(1)}
              unit="L"
              explanation="Committed to patients"
              tooltipText="Blood already committed to an approved request."
              icon={<Lock className="w-4 h-4" />}
            />

            <HospitalKpiCard
              label="Expiring Soon"
              value={expiringSoonCount}
              explanation="Units expiring in ≤ 14 days"
              indicatorColor={expiringSoonCount > 0 ? 'critical' : 'neutral'}
              tooltipText="Blood units nearing standard red cell viability limit."
              icon={<Clock className="w-4 h-4" />}
            />
          </section>

          {/* 3. INVENTORY TABLE (Section 26) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <span className="font-poppins font-semibold text-base text-[#0F172A]">
                Cold Storage Ledger
              </span>
              <span className="text-xs font-mono text-slate-400">
                8 OF 8 GROUPS MONITORED
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                    <th className="py-3 px-4 font-semibold">Blood Group</th>
                    <th className="py-3 px-4 font-semibold text-right">Available</th>
                    <th className="py-3 px-4 font-semibold text-right">Reserved</th>
                    <th className="py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item: HospitalInventoryItem) => (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDetails(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Blood Group */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-base text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                          {item.bloodGroup}
                        </span>
                      </td>

                      {/* Available */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#0F172A] tabular-nums">
                        {item.availableQuantity.toFixed(1)} L
                      </td>

                      {/* Reserved */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {item.reservedQuantity.toFixed(1)} L
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.expiryDate}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <HospitalStatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(item);
                          }}
                          className="text-xs font-medium text-slate-500 hover:text-[#0F172A] group-hover:text-[#1E4C8A] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="sm:hidden space-y-3">
              {inventory.map((item: HospitalInventoryItem) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetails(item)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-lg text-[#0F172A] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {item.bloodGroup}
                    </span>
                    <HospitalStatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2 border-t border-b border-slate-100 my-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">AVAILABLE</span>
                      <span className="font-bold text-[#0F172A] text-sm">
                        {item.availableQuantity.toFixed(1)} L
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">RESERVED</span>
                      <span className="text-slate-600">
                        {item.reservedQuantity.toFixed(1)} L
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.expiryDate}
                    </span>
                    <span className="font-medium text-[#1E4C8A] flex items-center gap-1">
                      View details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer */}
      <InventoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedItem={selectedGroupItem}
        mode={drawerMode}
        onModeChange={setDrawerMode}
        activities={activity}
        onSaveUpdate={updateInventory}
      />
    </HospitalLayout>
  );
};
