import React from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { Brain, AlertTriangle, Clock, GitMerge, Cpu } from 'lucide-react';

interface Module {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  metricLabel: string;
  metricValue: string;
}

export const IntelligenceSection: React.FC = () => {
  const modules: Module[] = [
    {
      title: 'Demand Prediction',
      description: 'Forecast upcoming blood requirements.',
      icon: <Brain className="w-5 h-5 text-blue-400" />,
      tag: 'PREDICTIVE MODEL',
      metricLabel: 'SURGE HORIZON',
      metricValue: '24-48 HRS',
    },
    {
      title: 'Stockout Risk',
      description: 'Estimate when inventory may become unavailable.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      tag: 'EARLY WARNING',
      metricLabel: 'DEFICIT ALERT',
      metricValue: '< 4.5 HRS',
    },
    {
      title: 'Expiry Risk',
      description: 'Identify inventory approaching expiry.',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      tag: 'WASTE PREVENTION',
      metricLabel: 'VIABILITY WINDOW',
      metricValue: '35 DAYS MAX',
    },
    {
      title: 'Smart Matching',
      description: 'Find suitable sources across the network.',
      icon: <GitMerge className="w-5 h-5 text-emerald-400" />,
      tag: 'LOAD BALANCER',
      metricLabel: 'MATCH TIME',
      metricValue: '< 50 MS',
    },
  ];

  return (
    <section className="bg-[#0F172A] text-white py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300 mb-4">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>INTELLIGENCE LAYER // PHASE 1 SPECIFICATION</span>
          </div>

          <SectionHeading
            eyebrow="NETWORK INTELLIGENCE"
            title={
              <>
                One network.
                <br />
                <span className="text-slate-400 font-light">One intelligent view.</span>
              </>
            }
            description="Continuous machine-learning assessment of hospital consumption telemetry, blood bank stores, and transit logistics."
            dark
            align="center"
          />
        </div>

        {/* 4 Small Intelligence Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/70 flex items-center justify-center">
                    {mod.icon}
                  </div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    {mod.tag}
                  </span>
                </div>

                <h3 className="font-poppins font-semibold text-lg text-white mb-2 group-hover:text-red-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {mod.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">{mod.metricLabel}</span>
                <span className="text-slate-200 font-semibold tracking-wide">{mod.metricValue}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Informational note: product presentation layer */}
        <div className="mt-12 text-center">
          <p className="text-xs font-mono text-slate-400 inline-block px-4 py-1.5 rounded bg-slate-900/60 border border-slate-800">
            Presentation layer &bull; Full ML models integrate in Phase 2
          </p>
        </div>
      </div>
    </section>
  );
};
