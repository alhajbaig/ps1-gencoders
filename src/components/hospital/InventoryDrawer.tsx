import React, { useState, useEffect } from 'react';
import type { BloodGroup } from '../../types';
import type { HospitalInventoryItem, InventoryActivityItem } from '../../data/hospitalInventory';
import { HospitalStatusBadge } from './HospitalStatusBadge';
import { Button } from '../common/Button';
import { X, Check, ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import { ALL_BLOOD_GROUPS } from '../../data/mockData';

interface InventoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: HospitalInventoryItem | null;
  mode: 'details' | 'update';
  onModeChange: (mode: 'details' | 'update') => void;
  activities: InventoryActivityItem[];
  onSaveUpdate: (
    bloodGroup: BloodGroup,
    quantity: number,
    expiryDate: string,
    notes?: string
  ) => Promise<boolean>;
}

export const InventoryDrawer: React.FC<InventoryDrawerProps> = ({
  isOpen,
  onClose,
  selectedItem,
  mode,
  onModeChange,
  activities,
  onSaveUpdate,
}) => {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [quantity, setQuantity] = useState<string>('5.0');
  const [unitMode, setUnitMode] = useState<'L' | 'units'>('L');
  const [expiryDate, setExpiryDate] = useState<string>('2026-10-20');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setBloodGroup(selectedItem.bloodGroup);
      setQuantity(selectedItem.availableQuantity.toString());
      setExpiryDate(selectedItem.expiryDate);
      setNotes(selectedItem.notes || '');
    } else {
      setBloodGroup('O+');
      setQuantity('5.0');
      setExpiryDate('2026-10-20');
      setNotes('');
    }
    setError('');
  }, [selectedItem, isOpen]);

  if (!isOpen) return null;

  // Filter activities relevant to this specific blood group
  const groupActivities = activities.filter((a) => a.bloodGroup === (selectedItem?.bloodGroup || bloodGroup));

  const handleUnitToggle = (newMode: 'L' | 'units') => {
    const currentVal = parseFloat(quantity) || 0;
    if (newMode === 'units' && unitMode === 'L') {
      // 1 L ~ 2.22 bags (450ml)
      setQuantity(Math.round(currentVal / 0.45).toString());
    } else if (newMode === 'L' && unitMode === 'units') {
      setQuantity((currentVal * 0.45).toFixed(1));
    }
    setUnitMode(newMode);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quantity);
    if (isNaN(val) || val < 0) {
      setError('Please provide a valid quantity (≥ 0).');
      return;
    }

    // Convert to Liters if entered in units
    const quantityInLiters = unitMode === 'units' ? Math.round(val * 0.45 * 10) / 10 : Math.round(val * 10) / 10;

    setIsSaving(true);
    setError('');

    const success = await onSaveUpdate(bloodGroup, quantityInLiters, expiryDate, notes);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to update inventory. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel / mobile modal */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2.5">
              {mode === 'update' && selectedItem && (
                <button
                  type="button"
                  onClick={() => onModeChange('details')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Back to details"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="font-poppins font-bold text-xl text-[#0F172A]">
                {mode === 'details' ? `${selectedItem?.bloodGroup} Details` : 'Update inventory'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1">
            {mode === 'details' && selectedItem ? (
              /* VIEW DETAILS MODE */
              <div className="space-y-6">
                {/* Blood Group Header Card */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-3xl text-[#0F172A] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {selectedItem.bloodGroup}
                    </span>
                    <div>
                      <span className="text-xs text-slate-400 font-mono block">DEMAND LEVEL</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {selectedItem.demandLevel} Demand
                      </span>
                    </div>
                  </div>

                  <HospitalStatusBadge status={selectedItem.status} size="md" />
                </div>

                {/* 3 Metric Cards: Available / Reserved / Total */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Available</span>
                    <span className="font-poppins font-bold text-lg text-[#0F172A] tabular-nums">
                      {selectedItem.availableQuantity.toFixed(1)} L
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Reserved</span>
                    <span className="font-poppins font-bold text-lg text-slate-600 tabular-nums">
                      {selectedItem.reservedQuantity.toFixed(1)} L
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Total</span>
                    <span className="font-poppins font-bold text-lg text-[#0F172A] tabular-nums">
                      {(selectedItem.availableQuantity + selectedItem.reservedQuantity).toFixed(1)} L
                    </span>
                  </div>
                </div>

                {/* Expiry & Logistics Info */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Nearest Expiration:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedItem.expiryDate}
                    </span>
                  </div>

                  {selectedItem.prediction && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Projected Horizon:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        ~{selectedItem.prediction.predictedDepletionHours} hours (demo)
                      </span>
                    </div>
                  )}

                  {selectedItem.notes && (
                    <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                      <span className="font-medium text-slate-700 block mb-0.5">Notes:</span>
                      <p className="italic text-[11px]">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>

                {/* Recent Changes for This Group (Section 29) */}
                <div>
                  <h4 className="font-poppins font-semibold text-sm text-[#0F172A] mb-3">
                    Recent changes
                  </h4>

                  {groupActivities.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No recent log events for {selectedItem.bloodGroup}.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {groupActivities.slice(0, 4).map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {act.timeFormatted}
                            </span>
                            <span className="font-medium text-slate-800">
                              {act.description}
                            </span>
                          </div>
                          {act.delta && (
                            <span className="font-mono font-bold text-xs text-slate-700">
                              {act.delta}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* UPDATE FORM MODE (Section 27 & 28) */
              <form id="inventory-update-form" onSubmit={handleFormSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {error}
                  </div>
                )}

                {/* Blood Group Dropdown */}
                <div>
                  <label htmlFor="drawer-blood-group" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Blood Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="drawer-blood-group"
                    value={bloodGroup}
                    onChange={(e) => {
                      const bg = e.target.value as BloodGroup;
                      setBloodGroup(bg);
                      // Auto-fill existing quantity if available
                      const existing = activities.find((a) => a.bloodGroup === bg);
                      if (existing && selectedItem?.bloodGroup === bg) {
                        setQuantity(selectedItem.availableQuantity.toString());
                      }
                    }}
                    className="w-full px-3 py-2 text-sm font-mono font-medium bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                  >
                    {ALL_BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input + Unit Toggle (L / units) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="drawer-quantity" className="block text-xs font-semibold text-[#0F172A]">
                      Available Quantity <span className="text-rose-500">*</span>
                    </label>
                    <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => handleUnitToggle('L')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          unitMode === 'L' ? 'bg-white font-bold text-[#0F172A] shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Liters (L)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitToggle('units')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          unitMode === 'units' ? 'bg-white font-bold text-[#0F172A] shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Units / Bags
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      id="drawer-quantity"
                      type="number"
                      step={unitMode === 'L' ? '0.1' : '1'}
                      min="0"
                      max="100"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                      {unitMode === 'L' ? 'Liters' : 'Bags (~450ml)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {unitMode === 'L'
                      ? `≈ ${Math.round(parseFloat(quantity || '0') / 0.45)} standard donation units`
                      : `≈ ${(parseFloat(quantity || '0') * 0.45).toFixed(1)} Liters total volume`}
                  </span>
                </div>

                {/* Expiry Date */}
                <div>
                  <label htmlFor="drawer-expiry" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Nearest Expiration Date
                  </label>
                  <div className="relative">
                    <input
                      id="drawer-expiry"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                    />
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label htmlFor="drawer-notes" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Internal Storage Notes (Optional)
                  </label>
                  <textarea
                    id="drawer-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Cold storage vault #2, donor verification pending"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
            {mode === 'details' ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => onModeChange('update')}
                className="w-full"
              >
                Update inventory
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="inventory-update-form"
                  variant="accent"
                  size="md"
                  isLoading={isSaving}
                  className="flex-1"
                  rightIcon={<Check className="w-4 h-4" />}
                >
                  Save update
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
