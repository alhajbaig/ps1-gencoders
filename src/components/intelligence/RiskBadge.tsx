import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { RiskLevel } from '../../intelligence/types/prediction';
import { getRiskConfig } from '../../intelligence/prediction/riskClassifier';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = getRiskConfig(level);

  const getIcon = () => {
    switch (level) {
      case 'critical':
        return <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'high':
        return <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'monitor':
        return <Info className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'low':
      default:
        return <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${config.badgeClass} ${sizeClasses} ${className}`}
      title={config.description}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      {showIcon && getIcon()}
      <span>{config.label}</span>
    </span>
  );
};
