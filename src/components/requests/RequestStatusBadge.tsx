import React from 'react';
import type { BloodRequestStatus } from '../../types/bloodRequest';
import { requestStatusConfig } from '../../utils/requestStatus';
import {
  FileText,
  Clock,
  ShieldCheck,
  Search,
  CheckCheck,
  Lock,
  Truck,
  CheckCircle2,
  AlertOctagon,
  XCircle,
} from 'lucide-react';

interface RequestStatusBadgeProps {
  status: BloodRequestStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const config = requestStatusConfig[status] || requestStatusConfig.pending_approval;

  const getIcon = () => {
    const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    switch (status) {
      case 'draft':
        return <FileText className={`${iconClass} text-slate-500`} />;
      case 'pending_approval':
        return <Clock className={`${iconClass} text-amber-600`} />;
      case 'approved':
        return <ShieldCheck className={`${iconClass} text-sky-600`} />;
      case 'searching':
        return <Search className={`${iconClass} text-[#1E4C8A] animate-pulse`} />;
      case 'matched':
        return <CheckCheck className={`${iconClass} text-indigo-600`} />;
      case 'reserved':
        return <Lock className={`${iconClass} text-purple-600`} />;
      case 'in_transit':
        return <Truck className={`${iconClass} text-blue-600`} />;
      case 'completed':
        return <CheckCircle2 className={`${iconClass} text-emerald-600`} />;
      case 'rejected':
        return <AlertOctagon className={`${iconClass} text-rose-600`} />;
      case 'cancelled':
        return <XCircle className={`${iconClass} text-slate-500`} />;
      default:
        return <Clock className={`${iconClass} text-slate-500`} />;
    }
  };

  const colorStyles: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/90',
    monitor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    info: 'bg-sky-50 text-sky-800 border-sky-200/90',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200/90',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/90',
    healthy: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    critical: 'bg-rose-50 text-rose-800 border-rose-200/90',
  };

  const styleClass = colorStyles[config.badgeVariant] || colorStyles.neutral;
  const sizeClass =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5 font-mono'
      : 'text-xs px-3 py-1 gap-2 font-mono';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full select-none ${sizeClass} ${styleClass} ${className}`}
      title={config.description}
    >
      {showIcon && getIcon()}
      <span>{config.badgeLabel}</span>
    </span>
  );
};
