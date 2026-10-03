import React from 'react';
import type { BloodRequest } from '../../types/bloodRequest';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { Calendar, Clock, MapPin, Building2, User, FileText } from 'lucide-react';

interface RequestSummaryProps {
  request: BloodRequest;
  className?: string;
}

export const RequestSummary: React.FC<RequestSummaryProps> = ({
  request,
  className = '',
}) => {
  const formattedCreated = new Date(request.createdAt).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedCreatedTime = new Date(request.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedRequiredBy = new Date(request.requiredBy).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-poppins font-semibold text-base text-[#0F172A]">
            Request Specification
          </h3>
          <p className="text-xs text-[#64748B]">
            Primary clinical parameters and delivery destination.
          </p>
        </div>

        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          {request.displayId}
        </span>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-lg border border-slate-200/80">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Blood Group
          </span>
          <span className="font-mono font-bold text-2xl text-[#0F172A] bg-white px-2.5 py-0.5 rounded border border-slate-200 inline-block">
            {request.bloodGroup}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Quantity
          </span>
          <span className="font-mono font-bold text-2xl text-[#0F172A] inline-block tabular-nums">
            {request.quantityLitres.toFixed(1)} <span className="text-base text-slate-500 font-medium">L</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Urgency
          </span>
          <div className="mt-1">
            <RequestPriorityBadge priority={request.priority} size="md" />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Required By
          </span>
          <span className="text-xs font-mono font-semibold text-[#0F172A] block mt-1">
            {formattedRequiredBy}
          </span>
        </div>
      </div>

      {/* Clinical Reason Section */}
      <div>
        <span className="text-xs font-mono uppercase text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Clinical & Operational Justification</span>
        </span>
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed font-inter">
          {request.reason ? (
            <p className="whitespace-pre-wrap">{request.reason}</p>
          ) : (
            <span className="text-slate-400 italic">No specific clinical reason recorded for this routine request.</span>
          )}
        </div>
      </div>

      {/* Delivery & Hospital Details */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-2">
          <span className="text-slate-400 text-[10px] uppercase tracking-wide block">
            Destination & Node
          </span>
          <div className="flex items-start gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#0F172A] block">{request.hospitalName}</span>
              <span className="text-slate-500 text-[11px] block">{request.hospitalCity} &bull; {request.hospitalId}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-700 pt-1">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-800 font-medium block">{request.deliveryLocation}</span>
              {request.department && (
                <span className="text-slate-500 text-[11px] block">{request.department}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-400 text-[10px] uppercase tracking-wide block">
            Logging & Audit Metadata
          </span>
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Logged by: <span className="font-semibold text-slate-900">{request.submittedBy}</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Created: {formattedCreated} &bull; {formattedCreatedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Last update: {new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
