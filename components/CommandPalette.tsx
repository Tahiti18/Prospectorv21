import React, { useState, useEffect } from 'react';
import { MainMode, SubModule } from '../types';
import { SubModuleIcon } from './LayoutZenith';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: MainMode, module: SubModule) => void;
  theme: 'dark' | 'light';
}

const MODULE_DATA: { mode: MainMode; mod: SubModule; label: string; zone: string }[] = [
  { mode: 'RESEARCH', mod: 'EXECUTIVE_DASHBOARD', label: 'EXECUTIVE DASHBOARD', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'MARKET_DISCOVERY', label: 'MARKET DISCOVERY', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'AUTOMATED_SEARCH', label: 'AUTOMATED SEARCH', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'PROSPECT_DATABASE', label: 'PROSPECT DATABASE', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'PIPELINE', label: 'GROWTH PIPELINE', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'STRATEGY_CENTER', label: 'STRATEGY HUB', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'STRATEGIC_REASONING', label: 'STRATEGIC REASONING', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'WORKSPACE', label: 'STRATEGIC WORKSPACE', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'MARKET_TRENDS', label: 'MARKET TRENDS', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'VISUAL_ANALYSIS', label: 'VISUAL ANALYSIS', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'CONTENT_ANALYSIS', label: 'CONTENT ANALYSIS', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'BENCHMARK', label: 'BENCHMARK ANALYSIS', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'ANALYTICS_HUB', label: 'MARKET INTEL HUB', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'HEATMAP', label: 'OPPORTUNITY HEATMAP', zone: 'RESEARCH ZONE' },
  { mode: 'RESEARCH', mod: 'USER_GUIDE', label: 'SYSTEM OVERVIEW', zone: 'RESEARCH ZONE' },

  { mode: 'DESIGN', mod: 'VISUAL_STUDIO', label: 'VISUAL STUDIO', zone: 'DESIGN ZONE' },
  { mode: 'DESIGN', mod: 'BRAND_DNA', label: 'BRAND DNA EXTRACTOR', zone: 'DESIGN ZONE' },
  { mode: 'DESIGN', mod: 'MOCKUPS_4K', label: 'MOCKUP STUDIO', zone: 'DESIGN ZONE' },
  { mode: 'DESIGN', mod: 'PRODUCT_SYNTHESIS', label: 'OFFER SYNTHESIS', zone: 'DESIGN ZONE' },
  { mode: 'DESIGN', mod: 'CONTENT_IDEATION', label: 'CONTENT IDEATION', zone: 'DESIGN ZONE' },
  { mode: 'DESIGN', mod: 'ASSET_LIBRARY', label: 'ASSET LIBRARY', zone: 'DESIGN ZONE' },

  { mode: 'MEDIA', mod: 'VIDEO_PRODUCTION', label: 'VIDEO STUDIO', zone: 'MEDIA ZONE' },
  { mode: 'MEDIA', mod: 'VIDEO_AUDIT', label: 'VIDEO AUDIT', zone: 'MEDIA ZONE' },
  { mode: 'MEDIA', mod: 'VIDEO_INSIGHTS', label: 'MEDIA INSIGHTS', zone: 'MEDIA ZONE' },
  { mode: 'MEDIA', mod: 'MOTION_LAB', label: 'MOTION LAB', zone: 'MEDIA ZONE' },
  { mode: 'MEDIA', mod: 'SONIC_STUDIO', label: 'SONIC STUDIO', zone: 'MEDIA ZONE' },
  { mode: 'MEDIA', mod: 'MEETING_NOTES', label: 'EXECUTIVE SCRIBE', zone: 'MEDIA ZONE' },

  { mode: 'OUTREACH', mod: 'CAMPAIGN_ORCHESTRATOR', label: 'CAMPAIGN ARCHITECT', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'GROWTH_ADVISORY', label: 'GROWTH BOARDROOM', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'PROPOSALS', label: 'PROPOSAL BUILDER', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'ROI_CALCULATOR', label: 'VALUE PROJECTOR', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'SEQUENCER', label: 'ENGAGEMENT SEQUENCE', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'PRESENTATION_BUILDER', label: 'DECK ARCHITECT', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'DEMO_SANDBOX', label: 'GROWTH SIMULATOR', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'DRAFTING', label: 'DRAFTING PORTAL', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'SALES_COACH', label: 'STRATEGIC COACH', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'AI_CONCIERGE', label: 'NEURAL AGENT', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'ELEVATOR_PITCH', label: 'PITCH GENERATOR', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'FUNNEL_MAP', label: 'FUNNEL MAPPER', zone: 'OUTREACH ZONE' },
  { mode: 'OUTREACH', mod: 'SOLUTIONS_ARCHITECT', label: 'GHL PLANNER', zone: 'OUTREACH ZONE' },

  { mode: 'ADMIN', mod: 'AGENCY_PLAYBOOK', label: 'AGENCY PLAYBOOK', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'BILLING', label: 'FINANCIALS', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'AFFILIATE', label: 'PARTNER PROGRAM', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'IDENTITY', label: 'AGENCY IDENTITY', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'SYSTEM_CONFIG', label: 'CORE CONFIG', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'EXPORT_DATA', label: 'DATA MANAGEMENT', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'CALENDAR', label: 'SCHEDULE HUB', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'ACTIVITY_LOGS', label: 'ACTIVITY TRACE', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'SETTINGS', label: 'GLOBAL SETTINGS', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'NEXUS_GRAPH', label: 'NEXUS GRAPH', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'TIMELINE', label: 'PROJECT TIMELINE', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'TASK_MANAGER', label: 'TASK MANAGER', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'THEME', label: 'INTERFACE THEME', zone: 'ADMIN ZONE' },
  { mode: 'ADMIN', mod: 'USAGE_STATS', label: 'RESOURCE STATS', zone: 'ADMIN ZONE' },
];

const ZONE_STYLES: Record<string, { headerBg: string; headerText: string; hoverBg: string; hoverText: string; iconBg: string; border: string }> = {
  'RESEARCH ZONE': { headerBg: 'bg-emerald-950/80', headerText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-600/10', hoverText: 'group-hover:text-emerald-400', iconBg: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'border-emerald-500/30' },
  'DESIGN ZONE': { headerBg: 'bg-emerald-950/80', headerText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-600/10', hoverText: 'group-hover:text-emerald-400', iconBg: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'border-emerald-500/30' },
  'MEDIA ZONE': { headerBg: 'bg-emerald-950/80', headerText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-600/10', hoverText: 'group-hover:text-emerald-400', iconBg: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'border-emerald-500/30' },
  'OUTREACH ZONE': { headerBg: 'bg-emerald-950/80', headerText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-600/10', hoverText: 'group-hover:text-emerald-400', iconBg: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'border-emerald-500/30' },
  'ADMIN ZONE': { headerBg: 'bg-emerald-950/80', headerText: 'text-emerald-400', hoverBg: 'hover:bg-emerald-600/10', hoverText: 'group-hover:text-emerald-400', iconBg: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'border-emerald-500/30' }
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect, theme }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredItems = MODULE_DATA.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.zone.toLowerCase().includes(query.toLowerCase())
  );

  const zones = Array.from(new Set(filteredItems.map(f => f.zone)));

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-3xl border-2 border-slate-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh] ${theme === 'dark' ? 'bg-[#0b1021]' : 'bg-white'}`}>
        
        {/* SEARCH HEADER */}
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-5 shrink-0">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round"/></svg>
          </div>
          <input
            autoFocus
            className={`w-full bg-transparent placeholder-slate-600 text-2xl outline-none font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            placeholder="SEARCH SYSTEM DIRECTORY..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">ESC</button>
        </div>
        
        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto custom-scrollbar flex-1 relative bg-slate-950/20">
          {filteredItems.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center justify-center opacity-50">
               <svg className="w-12 h-12 mb-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a2 2 0 100 4 2 2 0 000-4z" strokeWidth="2"/></svg>
               <p className="text-slate-500 font-black uppercase tracking-widest">SIGNAL LOST: NO MODULES FOUND</p>
            </div>
          )}

          {zones.map((zone) => {
            const style = ZONE_STYLES[zone] || ZONE_STYLES['RESEARCH ZONE'];
            const items = filteredItems.filter(f => f.zone === zone);
            
            return (
              <div key={zone} className="relative">
                {/* STICKY HEADER */}
                <div className={`sticky top-0 z-10 px-6 py-2 border-y border-slate-800/50 ${style.headerBg} backdrop-blur-md flex justify-between items-center`}>
                  <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${style.headerText}`}>{zone}</span>
                  <span className={`text-[9px] font-bold ${style.headerText} opacity-60`}>{items.length} NODES</span>
                </div>

                <div className="p-2 space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.mod}
                      onClick={() => { onSelect(item.mode, item.mod); onClose(); }}
                      className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center justify-between group ${style.hoverBg} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 border-slate-800 bg-slate-900 ${style.iconBg}`}>
                          <SubModuleIcon id={item.mod} active={false} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-widest transition-colors ${style.hoverText} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-500">
                            {item.mode} PROTOCOL
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all translate-x-2 group-hover:translate-x-0">
                        <span className={style.headerText}>INITIALIZE</span>
                        <span className="text-lg leading-none">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t border-slate-800/50 flex justify-between items-center bg-slate-950/80 shrink-0`}>
           <div className="flex gap-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span>↑↓ NAVIGATE</span>
              <span>ENTER SELECT</span>
              <span>ESC CLOSE</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SYSTEM SYNCHRONIZED</span>
           </div>
        </div>
      </div>
    </div>
  );
};
