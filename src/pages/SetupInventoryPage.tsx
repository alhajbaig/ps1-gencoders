import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';
import { useAuth } from '../context/AuthContext';
import type { BloodGroup } from '../types';
import { ALL_BLOOD_GROUPS, DEFAULT_INVENTORY_PRESET } from '../data/mockData';
import { BloodGroupCard } from '../components/common/BloodGroupCard';
import { Button } from '../components/common/Button';
import { ArrowLeft, Check, Droplet } from 'lucide-react';

export const SetupInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateInventory, setAllInventory, completeRegistration } = useRegistration();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inventory = data.inventory || DEFAULT_INVENTORY_PRESET;

  // Calculate totals
  const totalUnits = ALL_BLOOD_GROUPS.reduce((acc, g) => acc + (inventory[g] || 0), 0);
  const totalLiters = (totalUnits * 0.45).toFixed(1);

  const handleGroupChange = (group: BloodGroup, units: number) => {
    updateInventory(group, units);
  };

  const handleApplyPreset = (presetType: 'balanced' | 'low' | 'clear') => {
    if (presetType === 'balanced') {
      setAllInventory({ ...DEFAULT_INVENTORY_PRESET });
    } else if (presetType === 'low') {
      setAllInventory({
        'A+': 5,
        'A-': 1,
        'B+': 6,
        'B-': 1,
        'AB+': 2,
        'AB-': 0,
        'O+': 8,
        'O-': 2,
      });
    } else {
      setAllInventory({
        'A+': 0,
        'A-': 0,
        'B+': 0,
        'B-': 0,
        'AB+': 0,
        'AB-': 0,
        'O+': 0,
        'O-': 0,
      });
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    // Simulate brief network submission
    await new Promise((r) => setTimeout(r, 600));

    completeRegistration();

    // Also auto-login the newly registered user session
    await login(
      data.email || 'director@apextrauma.org',
      data.organizationType,
      data.organizationName || 'Registered Organization'
    );

    setIsSubmitting(false);
    navigate('/setup-complete');
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
          <span className="font-semibold text-[#C1272D]">STEP 02 OF 02</span>
          <span>INITIAL INVENTORY MAPPING</span>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="w-full h-full bg-[#C1272D] rounded-full" />
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 shadow-subtle">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono font-semibold text-[#1E4C8A] uppercase block mb-1">
              ORGANIZATION: {data.organizationName || 'New Facility Node'}
            </span>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Set up your starting inventory
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Enter verified blood units currently present in your cold storage units.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('balanced')}
              className="text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Standard Preset
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('low')}
              className="text-[11px] font-mono text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Low Reserve
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('clear')}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Zero Out
            </button>
          </div>
        </div>

        {/* 8 Blood Groups Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {ALL_BLOOD_GROUPS.map((group) => (
            <BloodGroupCard
              key={group}
              group={group}
              units={inventory[group] || 0}
              interactive={true}
              onChange={(newUnits) => handleGroupChange(group, newUnits)}
            />
          ))}
        </div>

        {/* Summary Metric Ribbon */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C1272D]/10 text-[#C1272D] flex items-center justify-center shrink-0">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase block">
                AGGREGATE INVENTORY CAPACITY
              </span>
              <span className="font-mono text-lg font-bold text-[#0F172A]">
                {totalUnits} Units <span className="text-xs text-slate-500 font-normal">({totalLiters} Liters equivalent)</span>
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for ledger initialization</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Organization Details</span>
          </button>

          <Button
            type="button"
            variant="accent"
            size="lg"
            isLoading={isSubmitting}
            onClick={handleComplete}
            rightIcon={<Check className="w-4 h-4" />}
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
};
