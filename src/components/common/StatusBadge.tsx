import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'neutral' | 'demo';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  children,
  showDot = true,
  className = '',
  size = 'sm',
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    critical: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-[#1E4C8A] border-blue-200/80',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    demo: 'bg-slate-100/90 text-slate-600 border-slate-200/90 tracking-wide font-mono',
  };

  const dotColors = {
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    critical: 'bg-[#E11D48] animate-pulse',
    info: 'bg-[#1E4C8A]',
    neutral: 'bg-slate-400',
    demo: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${sizeClasses} ${styles[variant]} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
