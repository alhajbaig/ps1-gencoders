import React from 'react';
import { Eye, TrendingUp, Shuffle, Scale } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  detail: string;
}

export const HowItWorksTimeline: React.FC = () => {
  const steps: Step[] = [
    {
      number: '01',
      title: 'MONITOR',
      description: 'Track real-time inventory across connected organizations.',
      detail: 'Continuous telemetry on blood groups, volume, storage temperatures & expiry timestamps.',
      icon: <Eye className="w-5 h-5 text-[#1E4C8A]" />,
    },
    {
      number: '02',
      title: 'PREDICT',
      description: 'Analyze demand and identify potential stockouts.',
      detail: 'Machine learning forecasts incoming emergency surges and surgery requirements 24-48h ahead.',
      icon: <TrendingUp className="w-5 h-5 text-[#C1272D]" />,
    },
    {
      number: '03',
      title: 'MATCH',
      description: 'Find suitable blood sources based on availability, demand, expiry and network conditions.',
      detail: 'Multi-variable optimization prioritizing expiring units, shortest transit distance, and ABO/Rh-D safety.',
      icon: <Shuffle className="w-5 h-5 text-[#1E4C8A]" />,
    },
    {
      number: '04',
      title: 'BALANCE',
      description: 'Coordinate requests and redistribute inventory across the network.',
      detail: 'Pre-emptive reservation locks and cold-chain logistics routing to normalize reserves city-wide.',
      icon: <Scale className="w-5 h-5 text-[#10B981]" />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto my-12">
      {/* Desktop Horizontal Timeline */}
      <div className="hidden lg:grid grid-cols-4 gap-6 relative">
        {/* Connecting horizontal line */}
        <div className="absolute top-10 left-[12%] right-[12%] h-[1px] bg-slate-200 z-0" />

        {steps.map((step) => (
          <div key={step.number} className="relative z-10 flex flex-col group">
            {/* Step indicator node */}
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-subtle group-hover:border-[#C1272D]/40 group-hover:shadow-premium transition-all duration-300 flex flex-col items-center justify-center mb-6 mx-auto">
              <span className="font-mono text-xs font-semibold text-slate-400 group-hover:text-[#C1272D] transition-colors">
                {step.number}
              </span>
              <div className="mt-1">{step.icon}</div>
            </div>

            <div className="text-center px-2">
              <h3 className="font-poppins font-semibold text-lg text-[#0F172A] tracking-tight mb-2">
                {step.title}
              </h3>
              <p className="text-sm font-medium text-[#0F172A] leading-snug mb-2">
                {step.description}
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile/Tablet Vertical Timeline */}
      <div className="lg:hidden space-y-6 relative pl-6 border-l-2 border-slate-200 ml-4">
        {steps.map((step) => (
          <div key={step.number} className="relative pl-6">
            {/* Dot on line */}
            <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#1E4C8A] flex items-center justify-center text-[10px] font-mono font-bold text-[#1E4C8A]">
              {step.number}
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">{step.icon}</div>
                <div>
                  <span className="text-[10px] font-mono font-semibold text-[#64748B] uppercase">
                    PHASE {step.number}
                  </span>
                  <h4 className="font-poppins font-semibold text-base text-[#0F172A]">
                    {step.title}
                  </h4>
                </div>
              </div>
              <p className="text-sm font-medium text-[#0F172A] mb-1.5">
                {step.description}
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
