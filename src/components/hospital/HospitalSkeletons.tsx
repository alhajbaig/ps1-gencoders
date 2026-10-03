import React from 'react';
import { Button } from '../common/Button';
import { AlertCircle, Droplets, RefreshCw } from 'lucide-react';

export const HospitalDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-20 bg-slate-200/70 rounded-xl" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200/70 rounded-xl" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-96 bg-slate-200/70 rounded-xl" />
        <div className="lg:col-span-4 h-96 bg-slate-200/70 rounded-xl" />
      </div>

      {/* Recent Activity Skeleton */}
      <div className="h-48 bg-slate-200/70 rounded-xl" />
    </div>
  );
};

export const HospitalEmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  return (
    <div className="py-20 text-center max-w-md mx-auto">
      {/* Blood drop outline */}
      <div className="w-16 h-16 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center mx-auto mb-5">
        <Droplets className="w-8 h-8 stroke-[1.5]" />
      </div>

      <h3 className="font-poppins font-bold text-2xl text-[#0F172A] tracking-tight mb-2">
        No inventory added yet
      </h3>

      <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
        Add your hospital's current blood inventory to begin monitoring availability and predictive early warnings.
      </p>

      <Button variant="accent" size="md" onClick={onAdd}>
        + Add inventory
      </Button>
    </div>
  );
};

export const HospitalErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-rose-50 text-[#E11D48] flex items-center justify-center mx-auto mb-4 border border-rose-200">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="font-poppins font-bold text-2xl text-[#0F172A] tracking-tight mb-2">
        Inventory couldn't be loaded
      </h3>

      <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
        Something went wrong while retrieving your inventory.
      </p>

      <Button variant="secondary" size="md" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Try again
      </Button>
    </div>
  );
};
