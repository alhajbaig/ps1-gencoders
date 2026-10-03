import React from 'react';
import type { RequestPriority } from '../../types/bloodRequest';
import { requestPriorityConfig } from '../../utils/requestStatus';
import { Calendar, AlertCircle, AlertTriangle } from 'lucide-react';

interface RequestPriorityBadgeProps {
  priority: RequestPriority;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const RequestPriorityBadge: React.FC<RequestPriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const config = requestPriorityConfig[priority] || requestPriorityConfig.routine;

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    switch (priority) {
      case 'emergency':
        return <AlertTriangle className={`${iconSize} text-[#C1272D] shrink-0`} />;
      case 'urgent':
        return <AlertCircle className={`${iconSize} text-amber-600 shrink-0`} />;
      case 'routine':
      default:
        return <Calendar className={`${iconSize} text-slate-500 shrink-0`} />;
    }
  };

  const priorityStyles = {
    routine: 'bg-slate-50 text-slate-700 border-slate-200/90',
    urgent: 'bg-amber-50 text-amber-900 border-amber-300/80',
    emergency: 'bg-rose-50 text-[#C1272D] border-red-300 font-semibold',
  };

  const sizeStyles =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5'
      : 'text-xs px-3 py-1 gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md select-none font-inter ${sizeStyles} ${priorityStyles[priority]} ${className}`}
      title={config.description}
    >
      {showIcon && getIcon()}
      <span>{config.label}</span>
    </span>
  );
};
