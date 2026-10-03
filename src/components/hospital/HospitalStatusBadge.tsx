import React from 'react';
import type { InventoryStatus } from '../../data/hospitalInventory';
import { CheckCircle2, AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface HospitalStatusBadgeProps {
  status: InventoryStatus;
  size?: 'sm' | 'md';
}

export const HospitalStatusBadge: React.FC<HospitalStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const configs = {
    healthy: {
      label: 'Healthy',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />,
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      dotColor: 'bg-[#10B981]',
    },
    monitor: {
      label: 'Monitor',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />,
      className: 'bg-amber-50 text-amber-800 border-amber-200/90',
      dotColor: 'bg-[#F59E0B]',
    },
    attention: {
      label: 'Attention',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#F97316] shrink-0" />,
      className: 'bg-orange-50 text-orange-900 border-orange-200/90',
      dotColor: 'bg-[#F97316]',
    },
    critical: {
      label: 'Critical',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />,
      className: 'bg-rose-50 text-rose-900 border-rose-200/90',
      dotColor: 'bg-[#E11D48]',
    },
  };

  const config = configs[status] || configs.healthy;
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5 gap-1.5' : 'text-sm px-3 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${sizeClasses} ${config.className} select-none`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
