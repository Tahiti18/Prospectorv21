import React, { useState, useEffect, useRef } from 'react';
import { MainMode, SubModule } from '../types';
import { Tooltip } from './workspaces/Tooltip';

interface LayoutProps {
  children: React.ReactNode;
  activeMode: MainMode;
  setActiveMode: (m: MainMode) => void;
  activeModule: SubModule;
  setActiveModule: (m: SubModule) => void;
  onSearchClick: () => void;
  theater: string;
  setTheater: (t: string) => void;
  currentLayout: string;
  setLayoutMode: (mode: string) => void;
}

const STRATEGIC_CITIES = [
  { city: "CUSTOM REGION", rank: 0 },
  { city: "NEW YORK, USA", rank: 1 },
  { city: "LONDON, UK", rank: 2 },
  { city: "DUBAI, UAE", rank: 3 },
  { city: "SINGAPORE", rank: 4 },
  { city: "MIAMI, USA", rank: 7 },
  { city: "LOS ANGELES, USA", rank: 8 }
];

const ModeIcon = ({ id, active }: { id: MainMode, active: boolean }) => {
  const cn = active ? "text-white" : "text-slate-400 group-hover:text-white";
  switch(id) {
    case 'RESEARCH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" cy1="21" x2="16.65" y2="16.65"/></svg>; 
    case 'DESIGN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>; 
    case 'MEDIA': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>; 
    case 'OUTREACH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; 
    case 'ADMIN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg>; 
    default: return null;
  }
}

const SubModuleIcon = ({ id, active }: { id: SubModule; active: boolean }) => {
  const cn = active ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300 transition-colors";
  const p = (paths: string[]) => (
    <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );

  switch(id) {
    case 'EXECUTIVE_DASHBOARD': return p(["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"]);
    case 'SYSTEM_CAPABILITIES': return p(["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5"]);
    case 'USER_GUIDE': return p(["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"]);
    case 'MARKET_DISCOVERY': return p(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]);
    case 'AUTOMATED_SEARCH': return p(["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]);
    case 'PIPELINE': return p(["M12 20V10", "M18 20V4", "M6 20v-4"]);
    case 'BRAND_DNA': return p(["M4.5 16.5c-1.5 1.26-2 3.5-2 3.5s2.24-.5 3.5-2L16.5 7.5"]);
    case 'CAMPAIGN_ORCHESTRATOR': return p(["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"]);
    case 'SOLUTIONS_ARCHITECT': return p(["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"]);
    case 'GROWTH_ADVISORY': return p(["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0-4 4v2"]);
    default: return p(["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"]);
  }
};

const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string; desc: string }[]>> = {
  RESEARCH: {
    "CORE ANALYTICS": [
      { id: 'EXECUTIVE_DASHBOARD', label: 'Agency Overview', desc: 'Main operational center' },
      { id: 'SYSTEM_CAPABILITIES', label: 'Solutions Matrix', desc: 'Capability framework' },
      { id: 'USER_GUIDE', label: 'User Manual', desc: 'Feature documentation' },
      { id: 'MARKET_DISCOVERY', label: 'Lead Discovery', desc: 'Identify new opportunities' },
      { id: 'AUTOMATED_SEARCH', label: 'Auto Analysis', desc: 'Autonomous identification' },
      { id: 'MARKET_TRENDS', label: 'Industry Monitor', desc: 'Real-time news' },
    ],
    "MANAGEMENT": [
      { id: 'PROSPECT_DATABASE', label: 'Lead Database', desc: 'Contact repository' },
      { id: 'STRATEGY_CENTER', label: 'Strategic Hub', desc: 'Portfolio audits' },
      { id: 'PIPELINE', label: 'Sales Pipeline', desc: 'Deal tracking' },
      { id: 'ANALYTICS_HUB', label: 'Market Intelligence', desc: 'Aggregate data' },
    ],
    "TOOLS": [
      { id: 'BENCHMARK', label: 'Analysis Center', desc: 'Competitive deconstruction' },
      { id: 'VISUAL_ANALYSIS', label: 'Aesthetic Audit', desc: 'Design review' },
      { id: 'STRATEGIC_REASONING', label: 'Logic Lab', desc: 'Strategic problem solving' },
    ]
  },
  DESIGN: {
    "CREATIVE CENTER": [
      { id: 'VISUAL_STUDIO', label: 'Asset Lab', desc: 'Identity generation' },
      { id: 'BRAND_DNA', label: 'Identity Profile', desc: 'Style extraction' },
      { id: 'MOCKUPS_4K', label: 'Visualization', desc: 'Professional renders' },
    ],
    "CONTENT": [
      { id: 'PRODUCT_SYNTHESIS', label: 'Offer Design', desc: 'Solution architecture' },
      { id: 'CONTENT_IDEATION', label: 'Creative Sparks', desc: 'Campaign hooks' },
      { id: 'ASSET_LIBRARY', label: 'Media Archive', desc: 'Digital vault' },
    ]
  },
  MEDIA: {
    "PRODUCTION": [
      { id: 'VIDEO_PRODUCTION', label: 'Video Studio', desc: 'Ad synthesis' },
      { id: 'VIDEO_AUDIT', label: 'Media Review', desc: 'Presence audit' },
      { id: 'VIDEO_INSIGHTS', label: 'Content Lab', desc: 'Temporal analysis' },
      { id: 'MOTION_LAB', label: 'Storyboarding', desc: 'Dynamic planning' },
    ],
    "AUDIO": [
      { id: 'SONIC_STUDIO', label: 'Audio Engineering', desc: 'Voice/Music sync' },
      { id: 'MEETING_NOTES', label: 'Transcription', desc: 'Action items' },
    ]
  },
  OUTREACH: {
    "STRATEGY": [
      { id: 'CAMPAIGN_ORCHESTRATOR', label: 'Campaign Architect', desc: 'Full deployment' },
      { id: 'GROWTH_ADVISORY', label: 'Strategy Advisory', desc: 'Advisory Panel' },
      { id: 'SOLUTIONS_ARCHITECT', label: 'Solutions Planner', desc: 'Deployment roadmap' },
      { id: 'PRESENTATION_BUILDER', label: 'Deck Architect', desc: 'Slide design' },
      { id: 'FUNNEL_MAP', label: 'Journey Mapping', desc: 'Conversion flow' },
    ],
    "ENGAGEMENT": [
      { id: 'PROPOSALS', label: 'Agreement Builder', desc: 'Closing portal' },
      { id: 'SEQUENCER', label: 'Outreach Manager', desc: 'Sequence schedule' },
      { id: 'ELEVATOR_PITCH', label: 'Value Scripting', desc: 'Introduction tools' },
      { id: 'SALES_COACH', label: 'Sales Director', desc: 'Tactical guidance' },
    ],
    "PLANNING": [
      { id: 'ROI_CALCULATOR', label: 'Value Analysis', desc: 'Growth projections' },
      { id: 'DEMO_SANDBOX', label: 'Market Simulator', desc: 'Scenario testing' },
      { id: 'AI_CONCIERGE', label: 'Client Relations', desc: 'Automated response' },
    ]
  },
  ADMIN: {
    "OPERATIONS": [
      { id: 'AGENCY_PLAYBOOK', label: 'Standard SOPs', desc: 'Internal playbook' },
      { id: 'IDENTITY', label: 'Agency Profile', desc: 'Workplace branding' },
      { id: 'BILLING', label: 'Financial Hub', desc: 'Resource management' },
      { id: 'AFFILIATE', label: 'Partner Program', desc: 'Growth network' },
    ],
    "SYSTEM": [
      { id: 'SETTINGS', label: 'Configurations', desc: 'Global settings' },
      { id: 'SYSTEM_CONFIG', label: 'Platform Core', desc: 'Technical tuning' },
      { id: 'THEME', label: 'Interface Style', desc: 'UI aesthetic' },
      { id: 'USAGE_STATS', label: 'Resource Logs', desc: 'Consumption metrics' },
    ],
    "HISTORY": [
        { id: 'EXPORT_DATA', label: 'Data Hub', desc: 'Portability' },
        { id: 'ACTIVITY_LOGS', label: 'Log Stream', desc: 'Execution trace' },
        { id: 'TIMELINE', label: 'Historical Flow', desc: 'Event sequence' },
        { id: 'NEXUS_GRAPH', label: 'Entity Mapping', desc: 'Lead network' },
        { id: 'TASK_MANAGER', label: 'Action Ledger', desc: 'Checklists' },
    ]
  }
};

export const LayoutZenith: React.FC<LayoutProps> = ({ 
  children, activeMode, setActiveMode, activeModule, setActiveModule, onSearchClick, theater, setTheater
}) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [marketExpanded, setMarketExpanded] = useState(false);
  const marketRef = useRef<HTMLDivElement>(null);

  const groups = MODULE_GROUPS[activeMode] || MODULE_GROUPS['RESEARCH'];

  const handleModeClick = (mode: MainMode) => {
    setActiveMode(mode);
    switch (mode) {
      case 'RESEARCH': setActiveModule('EXECUTIVE_DASHBOARD'); break;
      case 'DESIGN': setActiveModule('VISUAL_STUDIO'); break;
      case 'MEDIA': setActiveModule('VIDEO_PRODUCTION'); break;
      case 'OUTREACH': setActiveModule('CAMPAIGN_ORCHESTRATOR'); break;
      case 'ADMIN': setActiveModule('AGENCY_PLAYBOOK'); break;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#020617] text-slate-100 print:h-auto print:overflow-visible print:block font-sans">
      <header className="fixed top-0 left-0 right-0 h-20 border-b z-[100] flex items-center bg-[#030712]/95 backdrop-blur-3xl border-slate-800 px-8 print:hidden">
         <div className="flex-1 flex items-center">
            <h1 className="text-xl font-black tracking-tight leading-none text-white uppercase">
               PROSPECTOR <span className="text-emerald-500 italic">OS</span>
            </h1>
         </div>

         <div className="hidden lg:flex items-center justify-center flex-[2]">
            <nav className="flex items-center gap-1 p-1.5 rounded-full border shadow-2xl bg-[#0b1021] border-slate-800">
               {(Object.keys(MODULE_GROUPS) as MainMode[]).map((mode) => {
                  const isActive = activeMode === mode;
                  return (
                     <button
                        key={mode}
                        onClick={() => handleModeClick(mode)}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                           isActive 
                              ? 'bg-emerald-600 text-white shadow-lg' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                     >
                        <ModeIcon id={mode} active={isActive} />
                        {mode}
                     </button>
                  );
               })}
            </nav>
         </div>

         <div className="flex-1 flex items-center gap-4 justify-end">
            <button onClick={onSearchClick} className="hidden sm:flex items-center gap-3 px-4 h-11 rounded-2xl border text-xs font-bold transition-all bg-[#0b1021] border-slate-800 text-slate-400 hover:text-white">
               <span className="uppercase tracking-wider text-[9px]">COMMAND</span>
               <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">⌘K</span>
            </button>
            <div ref={marketRef} className={`relative transition-all duration-300 ${marketExpanded ? 'w-64' : 'w-[100px]'}`}>
                <div onClick={() => !marketExpanded && setMarketExpanded(true)} className={`flex items-center gap-3 px-4 h-11 rounded-full border transition-all bg-[#0b1021] border-slate-800 hover:border-emerald-500/50 overflow-hidden ${marketExpanded ? 'cursor-default' : 'cursor-pointer'}`}>
                   {marketExpanded ? (
                         <select autoFocus value={theater} onChange={(e) => { setTheater(e.target.value); setMarketExpanded(false); }} onBlur={() => setMarketExpanded(false)} className="bg-transparent text-[10px] font-bold uppercase focus:outline-none w-full text-white cursor-pointer">
                            {STRATEGIC_CITIES.map(c => <option key={c.city} value={c.city} className="text-slate-900 bg-white">{c.city}</option>)}
                         </select>
                   ) : (
                       <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest leading-none w-full text-center">REGION</span>
                   )}
                </div>
            </div>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden pt-20 print:block print:pt-0">
         <aside className={`flex-shrink-0 border-r flex flex-col z-[90] transition-all duration-300 bg-[#0b1021] border-slate-800 print:hidden relative ${isSidebarExpanded ? 'w-[260px]' : 'w-[80px]'}`}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between h-16 shrink-0">
                {isSidebarExpanded && <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] ml-2">CAMPAIGN</span>}
                <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className={`w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center transition-all hover:bg-slate-800/50 group bg-[#05091a] shadow-xl ${!isSidebarExpanded ? 'mx-auto' : ''}`}>
                    <svg className={`w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-transform duration-500 ${!isSidebarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20 space-y-8">
               {Object.entries(groups).map(([groupName, modules]) => (
                  <div key={groupName} className="mb-2">
                     {isSidebarExpanded && (
                       <h3 className="sticky top-0 px-6 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 mt-1 border-b border-white/5 pb-2 bg-[#0b1021] z-10">{groupName}</h3>
                     )}
                     <div className={`space-y-1 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
                        {(modules as any[]).map(mod => {
                           const isActive = activeModule === mod.id;
                           return (
                              <button key={mod.id} onClick={() => setActiveModule(mod.id)} className={`w-full rounded-xl transition-all flex items-center group ${isSidebarExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-3 justify-center'} ${isActive ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                                 <SubModuleIcon id={mod.id} active={isActive} />
                                 {isSidebarExpanded && <span className="text-[10px] font-black uppercase truncate tracking-widest">{mod.label}</span>}
                              </button>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </aside>
         <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-[#020617] p-8 md:p-12 z-0 print:block print:h-auto print:overflow-visible print:bg-white print:text-black print:p-0">
            <div className="max-w-[1920px] mx-auto pb-32 print:pb-0 relative z-10">{children}</div>
         </main>
      </div>
    </div>
  );
};
