import React from 'react';
import type { BloodGroup } from '../../types';
import { Minus, Plus } from 'lucide-react';

interface BloodGroupCardProps {
  group: BloodGroup;
  units: number;
  interactive?: boolean;
  onChange?: (newUnits: number) => void;
  status?: 'optimal' | 'warning' | 'critical' | 'excess';
  minUnits?: number;
  maxUnits?: number;
}

export const BloodGroupCard: React.FC<BloodGroupCardProps> = ({
  group,
  units,
  interactive = false,
  onChange,
  status,
  minUnits = 0,
  maxUnits = 999,
}) => {
  // Infer status if not passed explicitly
  const computedStatus =
    status ||
    (units <= 3 ? 'critical' : units <= 8 ? 'warning' : units >= 40 ? 'excess' : 'optimal');

  const statusBorderColors = {
    critical: 'border-rose-200 hover:border-rose-300',
    warning: 'border-amber-200 hover:border-amber-300',
    optimal: 'border-slate-200 hover:border-slate-300',
    excess: 'border-blue-200 hover:border-blue-300',
  };

  const statusPill = {
    critical: { label: 'Critically Low', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    warning: { label: 'Low Stock', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    optimal: { label: 'Adequate', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    excess: { label: 'Surplus', class: 'bg-blue-50 text-[#1E4C8A] border-blue-200' },
  };

  const handleIncrement = () => {
    if (onChange && units < maxUnits) {
      onChange(units + 1);
    }
  };

  const handleDecrement = () => {
    if (onChange && units > minUnits) {
      onChange(units - 1);
    }
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (onChange) {
      if (isNaN(val)) onChange(0);
      else onChange(Math.max(minUnits, Math.min(maxUnits, val)));
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 border transition-all duration-200 shadow-sm ${statusBorderColors[computedStatus]} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-semibold text-lg sm:text-xl text-[#0F172A] tracking-tight bg-slate-50 px-2.5 py-1 rounded border border-slate-200/70">
          {group}
        </span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusPill[computedStatus].class}`}
        >
          {statusPill[computedStatus].label}
        </span>
      </div>

      {interactive ? (
        <div className="mt-2">
          <label htmlFor={`blood-input-${group}`} className="text-xs text-[#64748B] block mb-1.5 font-medium">
            Available Inventory
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              aria-label={`Decrease ${group} inventory`}
              disabled={units <= minUnits}
              className="w-8 h-8 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="relative flex-1">
              <input
                id={`blood-input-${group}`}
                type="number"
                min={minUnits}
                max={maxUnits}
                value={units}
                onChange={handleDirectInput}
                className="w-full text-center font-mono font-medium text-base h-8 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
              />
            </div>
            <button
              type="button"
              onClick={handleIncrement}
              aria-label={`Increase ${group} inventory`}
              disabled={units >= maxUnits}
              className="w-8 h-8 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px] text-slate-400 block text-center mt-1 font-mono">
            units (approx. {units * 450} mL)
          </span>
        </div>
      ) : (
        <div className="mt-1 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {units}
          </span>
          <span className="text-xs text-slate-500 font-mono">units</span>
        </div>
      )}
    </div>
  );
};
