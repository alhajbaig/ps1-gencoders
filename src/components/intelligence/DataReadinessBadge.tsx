import React from 'react';
import { Database, Clock, AlertCircle } from 'lucide-react';
import type { DataReadiness } from '../../intelligence/types/prediction';

interface DataReadinessBadgeProps {
  status: DataReadiness;
  dataCoverageDays?: number;
  className?: string;
}

export const DataReadinessBadge: React.FC<DataReadinessBadgeProps> = ({
  status,
  dataCoverageDays = 28,
  className = '',
}) => {
  switch (status) {
    case 'ready':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
          title={`${dataCoverageDays} days of reliable usage ledger data`}
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Ready ({dataCoverageDays}d history)</span>
        </span>
      );

    case 'building_history':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
          title="Building historical baseline. 7+ days required for full confidence."
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Building History ({dataCoverageDays}d)</span>
        </span>
      );

    case 'insufficient_data':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
          title="Insufficient transaction history for automated forecasting."
        >
          <AlertCircle className="w-3 h-3 text-slate-500" />
          <span>Insufficient Data</span>
        </span>
      );
  }
};
