import React from 'react';
import type { BloodRequest } from '../../types/bloodRequest';
import { getTimelineStageIndex } from '../../utils/requestStatus';
import { Check, Clock, Search, Lock, Truck, X } from 'lucide-react';

interface RequestTimelineProps {
  request: BloodRequest;
  className?: string;
}

interface TimelineStep {
  step: number;
  id: string;
  title: string;
  shortDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    step: 1,
    id: 'submitted',
    title: 'Submitted',
    shortDescription: 'Request registered in system',
    icon: Clock,
  },
  {
    step: 2,
    id: 'review',
    title: 'Review',
    shortDescription: 'Clinical verification',
    icon: Check,
  },
  {
    step: 3,
    id: 'search',
    title: 'Network Search',
    shortDescription: 'Querying blood repositories',
    icon: Search,
  },
  {
    step: 4,
    id: 'reservation',
    title: 'Reservation',
    shortDescription: 'Stock locked for hospital',
    icon: Lock,
  },
  {
    step: 5,
    id: 'fulfillment',
    title: 'Fulfillment',
    shortDescription: 'Cold-chain dispatch & delivery',
    icon: Truck,
  },
];

export const RequestTimeline: React.FC<RequestTimelineProps> = ({
  request,
  className = '',
}) => {
  const { activeStep, isTerminated } = getTimelineStageIndex(request.status);
  const isCancelled = request.status === 'cancelled';
  const isRejected = request.status === 'rejected';

  // Helper to extract timestamp from activities matching stage
  const getStepTimestamp = (stepNum: number) => {
    if (stepNum === 1) {
      const created = request.activities.find((a) => a.type === 'created');
      if (created) return created.timeFormatted || new Date(created.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (stepNum === 2 && activeStep >= 2) {
      const approval = request.activities.find((a) => a.type === 'approval');
      if (approval) return approval.timeFormatted || new Date(approval.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (stepNum === 3 && activeStep >= 3) {
      const search = request.activities.find((a) => a.title.toLowerCase().includes('search'));
      if (search) return search.timeFormatted || new Date(search.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (stepNum === 4 && activeStep >= 4) {
      const match = request.activities.find((a) => a.type === 'match_found' || a.type === 'reserved');
      if (match) return match.timeFormatted || new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (stepNum === 5 && activeStep >= 5) {
      const dispatch = request.activities.find((a) => a.type === 'dispatch');
      if (dispatch) return dispatch.timeFormatted || new Date(dispatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return undefined;
  };

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card ${className}`}>
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-poppins font-semibold text-sm sm:text-base text-[#0F172A]">
            Request Progression
          </h3>
          <p className="text-xs text-[#64748B]">
            Real-time status tracking across the network workflow.
          </p>
        </div>

        {isCancelled && (
          <span className="text-xs font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            Workflow Terminated (Cancelled)
          </span>
        )}
        {isRejected && (
          <span className="text-xs font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            Workflow Terminated (Rejected)
          </span>
        )}
      </div>

      {/* DESKTOP HORIZONTAL TIMELINE */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 relative">
          {/* Connecting line behind icons */}
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-slate-200 -z-0" />

          {TIMELINE_STEPS.map((step) => {
            const isCompleted = !isTerminated && activeStep > step.step;
            const isCurrent = !isTerminated && activeStep === step.step;
            const isTerminatedHere = isTerminated && activeStep === step.step;
            const isPending = !isTerminated && activeStep < step.step;
            const timestamp = getStepTimestamp(step.step);

            return (
              <div key={step.id} className="flex flex-col items-center text-center px-2 relative z-10">
                {/* Node icon circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                      : isCurrent
                      ? 'bg-[#1E4C8A] text-white shadow-sm ring-4 ring-blue-100 animate-pulse'
                      : isTerminatedHere
                      ? 'bg-rose-600 text-white shadow-sm ring-4 ring-rose-50'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isTerminatedHere ? (
                    <X className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Title & info */}
                <div className="mt-3">
                  <span
                    className={`block font-poppins text-xs font-semibold ${
                      isCurrent
                        ? 'text-[#1E4C8A]'
                        : isCompleted
                        ? 'text-[#0F172A]'
                        : isTerminatedHere
                        ? 'text-rose-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>

                  {timestamp && (
                    <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                      {timestamp}
                    </span>
                  )}

                  {isCurrent && !timestamp && (
                    <span className="inline-block text-[10px] font-mono text-[#1E4C8A] bg-blue-50 px-1.5 py-0.2 rounded mt-1 font-medium">
                      In progress
                    </span>
                  )}

                  {isPending && (
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                      Pending
                    </span>
                  )}

                  <span className="block text-[10px] text-slate-400 mt-1 max-w-[120px] mx-auto leading-tight">
                    {step.shortDescription}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE VERTICAL TIMELINE */}
      <div className="md:hidden space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {TIMELINE_STEPS.map((step) => {
          const isCompleted = !isTerminated && activeStep > step.step;
          const isCurrent = !isTerminated && activeStep === step.step;
          const isTerminatedHere = isTerminated && activeStep === step.step;
          const timestamp = getStepTimestamp(step.step);

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {/* Vertical node circle */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-50'
                    : isCurrent
                    ? 'bg-[#1E4C8A] text-white ring-2 ring-blue-100'
                    : isTerminatedHere
                    ? 'bg-rose-600 text-white ring-2 ring-rose-50'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isTerminatedHere ? (
                  <X className="w-3 h-3 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-poppins text-xs font-semibold ${
                      isCurrent
                        ? 'text-[#1E4C8A]'
                        : isCompleted
                        ? 'text-[#0F172A]'
                        : isTerminatedHere
                        ? 'text-rose-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>

                  {timestamp && (
                    <span className="text-[11px] font-mono text-slate-500">
                      {timestamp}
                    </span>
                  )}
                  {isCurrent && !timestamp && (
                    <span className="text-[10px] font-mono text-[#1E4C8A] bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                      In progress
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {step.shortDescription}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
