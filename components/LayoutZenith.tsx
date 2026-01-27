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
    case 'RESEARCH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; 
    case 'DESIGN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>; 
    case 'MEDIA': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>; 
    case 'OUTREACH': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; 
    case 'ADMIN': return <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; 
    default: return null;
  }
}

export const SubModuleIcon = ({ id, active }: { id: SubModule; active: boolean }) => {
  const cn = active ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-300 transition-colors";
  const p = (paths: React.ReactNode) => (
    <svg className={`w-4 h-4 ${cn}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );

  switch(id) {
    case 'EXECUTIVE_DASHBOARD': return p(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>);
    case 'SYSTEM_CAPABILITIES': return p(<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>);
    case 'USER_GUIDE': return p(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></>);
    case 'MARKET_DISCOVERY': return p(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>);
    case 'AUTOMATED_SEARCH': return p(<><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/><path d="M8 10h4M10 8v4"/></>);
    case 'PROSPECT_DATABASE': return p(<><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7"/><path d="M4 7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2"/><path d="M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2"/></>);
    case 'PIPELINE': return p(<><path d="M12 20V10M18 20V4M6 20v-4"/></>);
    case 'STRATEGY_CENTER': return p(<><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/></>);
    case 'STRATEGIC_REASONING': return p(<><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></>);
    case 'WORKSPACE': return p(<><path d="M3 3h18v18H3z"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>);
    case 'MARKET_TRENDS': return p(<><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>);
    case 'VISUAL_ANALYSIS': return p(<><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>);
    case 'CONTENT_ANALYSIS': return p(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>);
    case 'BENCHMARK': return p(<><path d="M2 12h20M2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6M2 12V5a2 2 0 012-2h16a2 2 0 012 2v7"/></>);
    case 'ANALYTICS_HUB': return p(<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>);
    case 'HEATMAP': return p(<><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 000-5H12"/></>);
    case 'VISUAL_STUDIO': return p(<><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5"/></>);
    case 'BRAND_DNA': return p(<><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></>);
    case 'MOCKUPS_4K': return p(<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>);
    case 'PRODUCT_SYNTHESIS': return p(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>);
    case 'CONTENT_IDEATION': return p(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>);
    case 'ASSET_LIBRARY': return p(<><path d="M3 6h18M3 12h18M3 18h18"/></>);
    case 'VIDEO_PRODUCTION': return p(<><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>);
    case 'VIDEO_AUDIT': return p(<><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></>);
    case 'VIDEO_INSIGHTS': return p(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>);
    case 'MOTION_LAB': return p(<><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>);
    case 'SONIC_STUDIO': return p(<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>);
    case 'MEETING_NOTES': return p(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>);
    case 'CAMPAIGN_ORCHESTRATOR': return p(<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>);
    case 'PROPOSALS': return p(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>);
    case 'ROI_CALCULATOR': return p(<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h8M8 18h8"/></>);
    case 'SEQUENCER': return p(<><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></>);
    case 'PRESENTATION_BUILDER': return p(<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 12h20M12 17v4M8 21h8"/></>);
    case 'DEMO_SANDBOX': return p(<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>);
    case 'SALES_COACH': return p(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
    case 'AI_CONCIERGE': return p(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>);
    case 'ELEVATOR_PITCH': return p(<><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 18v4M8 22h8"/></>);
    case 'FUNNEL_MAP': return p(<><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>);
    case 'SOLUTIONS_ARCHITECT': return p(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>);
    case 'GROWTH_ADVISORY': return p(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
    case 'AGENCY_PLAYBOOK': return p(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></>);
    case 'BILLING': return p(<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>);
    case 'AFFILIATE': return p(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
    case 'IDENTITY': return p(<><circle cx="12" cy="12" r="10"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>);
    case 'SETTINGS': return p(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>);
    case 'NEXUS_GRAPH': return p(<><path d="M5 12l14 0M12 5l0 14M5 5l14 14M19 5l-14 14"/></>);
    case 'ACTIVITY_LOGS': return p(<><path d="M3 6h18M3 12h18M3 18h18M3 6h.01M3 12h.01M3 18h.01"/></>);
    default: return p(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>);
  }
};

const MODULE_GROUPS: Record<MainMode, Record<string, { id: SubModule; label: string; desc: string }[]>> = {
  RESEARCH: {
    "CORE ANALYTICS": [
      { id: 'EXECUTIVE_DASHBOARD', label: 'Agency Overview', desc: 'Main operational center' },
      { id: 'SYSTEM_CAPABILITIES', label: 'System Capabilities', desc: 'Capability framework' },
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
                {isSidebarExpanded && <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] ml-2">SYSTEM DIRECTORY</span>}
                <button 
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
                  title={isSidebarExpanded ? "RETRACT SIDEBAR" : "EXPAND SIDEBAR"}
                  className={`w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center transition-all hover:bg-slate-800/50 group bg-[#05091a] shadow-xl ${!isSidebarExpanded ? 'mx-auto' : ''}`}
                >
                    <svg className={`w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-transform duration-500 ${isSidebarExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
