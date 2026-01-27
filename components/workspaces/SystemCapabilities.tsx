import React from 'react';
import { MainMode, SubModule } from '../../types';

interface SystemCapabilitiesProps {
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

interface CapabilitySection {
  title: string;
  subtitle: string;
  points: { title: string; desc: string }[];
  iconPaths: string[];
  color: string;
}

const CAPABILITIES: CapabilitySection[] = [
  {
    title: "Strategic Intelligence",
    subtitle: "Opportunity Detection",
    iconPaths: ["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", "M10 7v3m0 0v3m0-3h3m-3 0H7"],
    color: "emerald",
    points: [
      { title: "Social Feed Audit", desc: "Monitors cross-platform activity to identify credibility deficits and growth opportunities." },
      { title: "Aesthetic Grading", desc: "Neural vision engine evaluates design hierarchy and brand authority scores." },
      { title: "Competitive Modeling", desc: "Deconstructs the digital infrastructure and marketing strategy of market leaders." }
    ]
  },
  {
    title: "Brand Transformation",
    subtitle: "Aesthetic Engineering",
    iconPaths: ["M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"],
    color: "emerald",
    points: [
      { title: "DNA Extraction", desc: "Synchronizes typography and color palettes from existing assets for absolute consistency." },
      { title: "4K Asset Lab", desc: "Generates high-resolution commercial photography tailored to the brand identity." },
      { title: "Commercial Visualization", desc: "Produces high-fidelity mockups representing the business as a premium authority." }
    ]
  },
  {
    title: "Operational Sales Flow",
    subtitle: "The Closing Framework",
    iconPaths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M12 8v4"],
    color: "emerald",
    points: [
      { title: "Engagement Sequence", desc: "Architects professional multi-touch outreach flows across all primary channels." },
      { title: "Value Projections", desc: "Mathematical models quantifying the financial impact of business transformation." },
      { title: "Magic Link Proposals", desc: "Replaces standard documents with interactive, high-conversion web presentations." }
    ]
  }
];

export const SystemCapabilities: React.FC<SystemCapabilitiesProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-20 animate-in fade-in duration-1000 pb-60">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-emerald-500/20 pb-16 relative overflow-hidden">
        <div className="space-y-6 max-w-4xl relative z-10">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official System Registry</span>
           </div>
           <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
             SYSTEM <span className="text-emerald-500 italic">CAPABILITIES</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed font-serif italic max-w-2xl">
             Comprehensive deconstruction of the Transformation Engine. Engineering market authority through neural strategy and creative precision.
           </p>
        </div>
        <button 
          onClick={() => onNavigate('RESEARCH', 'MARKET_DISCOVERY')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all border-b-4 border-emerald-800 relative z-10"
        >
          Begin Discovery →
        </button>
      </div>

      <div className="space-y-32">
        {CAPABILITIES.map((cap, i) => (
          <div key={i} className={`flex flex-col ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-20 items-center`}>
            <div className="flex-1 w-full">
              <div className="aspect-square md:aspect-video rounded-[64px] bg-[#0b1021] border-2 border-slate-800/80 p-16 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group transition-all hover:border-emerald-500/50">
                 <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10 mb-8 transition-transform group-hover:scale-110">
                    <svg className="w-20 h-20 text-emerald-500/50 group-hover:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {cap.iconPaths.map((d, di) => <path key={di} d={d} />)}
                    </svg>
                 </div>
                 <div className="text-center relative z-10">
                   <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{cap.title}</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{cap.subtitle}</p>
                 </div>
              </div>
            </div>

            <div className="flex-1 space-y-10">
               <div className="space-y-4">
                  <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] block">PROTOCOL 0{i+1}</span>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">{cap.title}</h2>
               </div>
               <div className="space-y-8">
                  {cap.points.map((point, pi) => (
                    <div key={pi} className="flex gap-6 group">
                       <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">{point.title}</h4>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80">{point.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
