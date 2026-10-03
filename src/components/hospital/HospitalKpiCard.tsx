import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface HospitalKpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  explanation: string;
  icon?: React.ReactNode;
  tooltipText?: string;
  indicatorColor?: 'healthy' | 'critical' | 'neutral';
}

export const HospitalKpiCard: React.FC<HospitalKpiCardProps> = ({
  label,
  value,
  unit,
  explanation,
  icon,
  tooltipText,
  indicatorColor = 'neutral',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const indicatorStyles = {
    healthy: 'text-[#10B981]',
    critical: 'text-[#E11D48]',
    neutral: 'text-slate-400',
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-card hover:border-slate-300/90 transition-all flex flex-col justify-between relative group">
      <div>
        {/* Header row: label + icon + optional tooltip */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#64748B] uppercase">
              {label}
            </span>
            {tooltipText && (
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  aria-label={`Info about ${label}`}
                  onClick={() => setShowTooltip(!showTooltip)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-[#0F172A] text-white text-[11px] rounded-md shadow-premium z-30 font-inter pointer-events-none leading-tight">
                    {tooltipText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                  </div>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={`shrink-0 ${indicatorStyles[indicatorColor]}`}>
              {icon}
            </div>
          )}
        </div>

        {/* Big number */}
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="font-poppins font-bold text-3xl sm:text-4xl text-[#0F172A] tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="font-poppins font-semibold text-lg text-slate-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Small explanation */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
        <span>{explanation}</span>
        {indicatorColor === 'critical' && (
          <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
        )}
        {indicatorColor === 'healthy' && (
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
        )}
      </div>
    </div>
  );
};
