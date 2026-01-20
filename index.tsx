
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutZenith } from './components/LayoutZenith';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/ToastContainer';
import { db } from './services/automation/db';
import { MainMode, SubModule, Lead } from './types';

// Import All functional workspaces
import { ExecutiveDashboard } from './components/workspaces/ExecutiveDashboard';
import { MarketDiscovery } from './components/workspaces/MarketDiscovery';
import { ProspectDatabase } from './components/workspaces/ProspectDatabase';
import { StrategyCenter } from './components/workspaces/StrategyCenter';
import { BusinessOrchestrator } from './components/workspaces/BusinessOrchestrator';
import { VisualStudio } from './components/workspaces/VisualStudio';
import { VideoPitch } from './components/workspaces/VideoPitch';
import { BillingNode } from './components/workspaces/BillingNode';
import { ScoringRubricView } from './components/workspaces/ScoringRubricView';
import { UserGuide } from './components/workspaces/UserGuide';
import { TransformationBlueprint } from './components/workspaces/TransformationBlueprint';
import { Heatmap } from './components/workspaces/Heatmap';
import { NexusGraph } from './components/workspaces/NexusGraph';
import { TimelineNode } from './components/workspaces/TimelineNode';
import { ActivityLogs } from './components/workspaces/ActivityLogs';
import { SettingsNode } from './components/workspaces/SettingsNode';
import { TokenNode } from './components/workspaces/TokenNode';
import { AssetLibrary } from './components/workspaces/AssetLibrary';
import { AutoCrawl } from './components/workspaces/AutoCrawl';
import { Pipeline } from './components/workspaces/Pipeline';
import { DeepLogic } from './components/workspaces/DeepLogic';
import { IntelNode } from './components/workspaces/IntelNode';
// Comment: Fixed missing import for BenchmarkNode
import { BenchmarkNode } from './components/workspaces/BenchmarkNode';
import { FunnelMap } from './components/workspaces/FunnelMap';
import { ROICalc } from './components/workspaces/ROICalc';
import { DeckArch } from './components/workspaces/DeckArch';
import { DemoSandbox } from './components/workspaces/DemoSandbox';
import { ProposalDrafting } from './components/workspaces/ProposalDrafting';
import { VoiceStrat } from './components/workspaces/VoiceStrat';
import { LiveScribe } from './components/workspaces/LiveScribe';
import { AIConcierge } from './components/workspaces/AIConcierge';
import { PitchGen } from './components/workspaces/PitchGen';
import { FlashSpark } from './components/workspaces/FlashSpark';
import { BrandDNA } from './components/workspaces/BrandDNA';
import { Mockups4K } from './components/workspaces/Mockups4K';
import { ProductSynth } from './components/workspaces/ProductSynth';
import { MotionLab } from './components/workspaces/MotionLab';
import { ViralPulse } from './components/workspaces/ViralPulse';
import { CinemaIntel } from './components/workspaces/CinemaIntel';
import { ArticleIntel } from './components/workspaces/ArticleIntel';
import { VisionLab } from './components/workspaces/VisionLab';
import { SonicStudio } from './components/workspaces/SonicStudio';
import { Sequencer } from './components/workspaces/Sequencer';
import { IdentityNode } from './components/workspaces/IdentityNode';
import { SystemConfig } from './components/workspaces/SystemConfig';
import { ThemeNode } from './components/workspaces/ThemeNode';
import { AffiliateNode } from './components/workspaces/AffiliateNode';
import { ExportNode } from './components/workspaces/ExportNode';
import { TaskManager } from './components/workspaces/TaskManager';
import { FactCheck } from './components/workspaces/FactCheck';
import { TranslatorNode } from './components/workspaces/TranslatorNode';
import { VideoAudit } from './components/workspaces/VideoAudit';

const App = () => {
  const [activeMode, setActiveMode] = useState<MainMode>('RESEARCH');
  const [activeModule, setActiveModule] = useState<SubModule>('EXECUTIVE_DASHBOARD');
  const [theater, setTheater] = useState('NEW YORK, USA');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lockedLeadId, setLockedLeadId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState('ZENITH');

  useEffect(() => {
    console.log("[RUNTIME] Establishing OS Neural Sync...");
    const unsub = db.subscribe((updatedLeads) => {
      setLeads(updatedLeads);
    });
    return () => unsub();
  }, []);

  const lockedLead = useMemo(() => leads.find(l => l.id === lockedLeadId), [leads, lockedLeadId]);

  const handleNavigate = (mode: MainMode, mod: SubModule) => {
    setActiveMode(mode);
    setActiveModule(mod);
  };

  const handleLeadsGenerated = (newLeads: Lead[]) => {
    // Synchronization handled by db listener
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    const updated = leads.map(l => l.id === id ? { ...l, ...updates } : l);
    db.saveLeads(updated);
  };

  const renderContent = () => {
    switch (activeModule) {
      // RESEARCH
      case 'EXECUTIVE_DASHBOARD': return <ExecutiveDashboard leads={leads} market={theater} onNavigate={handleNavigate} />;
      case 'TRANSFORMATION_BLUEPRINT': return <TransformationBlueprint onNavigate={handleNavigate} />;
      case 'USER_GUIDE': return <UserGuide onNavigate={handleNavigate} />;
      case 'MARKET_DISCOVERY': return <MarketDiscovery market={theater} onLeadsGenerated={handleLeadsGenerated} />;
      case 'AUTOMATED_SEARCH': return <AutoCrawl theater={theater} onNewLeads={handleLeadsGenerated} />;
      case 'MARKET_TRENDS': return <ViralPulse lead={lockedLead} />;
      case 'PROSPECT_DATABASE': return <ProspectDatabase leads={leads} lockedLeadId={lockedLeadId} onLockLead={setLockedLeadId} onInspect={(id) => { setLockedLeadId(id); handleNavigate('RESEARCH', 'STRATEGY_CENTER'); }} />;
      case 'STRATEGY_CENTER': return <StrategyCenter lead={lockedLead} onUpdateLead={handleUpdateLead} onNavigate={handleNavigate} />;
      case 'PIPELINE': return <Pipeline leads={leads} onUpdateStatus={(id, status) => handleUpdateLead(id, { outreachStatus: status })} />;
      case 'ANALYTICS_HUB': return <IntelNode module="ANALYTICS_HUB" lead={lockedLead} />;
      case 'BENCHMARK': return <BenchmarkNode lead={lockedLead} />;
      case 'VISUAL_ANALYSIS': return <VisionLab lead={lockedLead} />;
      case 'STRATEGIC_REASONING': return <DeepLogic lead={lockedLead} />;
      case 'HEATMAP': return <Heatmap leads={leads} market={theater} />;
      case 'CONTENT_ANALYSIS': return <ArticleIntel lead={lockedLead} />;

      // DESIGN
      case 'VISUAL_STUDIO': return <VisualStudio leads={leads} lockedLead={lockedLead} />;
      case 'BRAND_DNA': return <BrandDNA lead={lockedLead} onUpdateLead={handleUpdateLead} />;
      case 'MOCKUPS_4K': return <Mockups4K lead={lockedLead} />;
      case 'PRODUCT_SYNTHESIS': return <ProductSynth lead={lockedLead} />;
      case 'CONTENT_IDEATION': return <FlashSpark lead={lockedLead} />;
      case 'ASSET_LIBRARY': return <AssetLibrary />;

      // MEDIA
      case 'VIDEO_PRODUCTION': return <VideoPitch lead={lockedLead} />;
      case 'VIDEO_AUDIT': return <VideoAudit lead={lockedLead} />;
      case 'VIDEO_INSIGHTS': return <CinemaIntel lead={lockedLead} />;
      case 'MOTION_LAB': return <MotionLab lead={lockedLead} />;
      case 'SONIC_STUDIO': return <SonicStudio lead={lockedLead} />;
      case 'MEETING_NOTES': return <LiveScribe />;

      // OUTREACH
      case 'CAMPAIGN_ORCHESTRATOR': return <BusinessOrchestrator leads={leads} lockedLead={lockedLead} onNavigate={handleNavigate} onLockLead={setLockedLeadId} onUpdateLead={handleUpdateLead} />;
      case 'PROPOSALS': return <ProposalDrafting lead={lockedLead} />;
      case 'ROI_CALCULATOR': return <ROICalc leads={leads} />;
      case 'SEQUENCER': return <Sequencer lead={lockedLead} />;
      case 'PRESENTATION_BUILDER': return <DeckArch lead={lockedLead} />;
      case 'DEMO_SANDBOX': return <DemoSandbox lead={lockedLead} />;
      case 'DRAFTING': return <ProposalDrafting lead={lockedLead} />;
      case 'SALES_COACH': return <VoiceStrat lead={lockedLead} />;
      case 'AI_CONCIERGE': return <AIConcierge lead={lockedLead} />;
      case 'ELEVATOR_PITCH': return <PitchGen lead={lockedLead} />;
      case 'FUNNEL_MAP': return <FunnelMap lead={lockedLead} />;

      // ADMIN
      case 'AGENCY_PLAYBOOK': return <ScoringRubricView />;
      case 'IDENTITY': return <IdentityNode />;
      case 'BILLING': return <BillingNode />;
      case 'AFFILIATE': return <AffiliateNode />;
      case 'SETTINGS': return <SettingsNode />;
      case 'SYSTEM_CONFIG': return <SystemConfig />;
      case 'THEME': return <ThemeNode />;
      case 'USAGE_STATS': return <TokenNode />;
      case 'EXPORT_DATA': return <ExportNode leads={leads} />;
      case 'ACTIVITY_LOGS': return <ActivityLogs />;
      case 'TIMELINE': return <TimelineNode />;
      case 'NEXUS_GRAPH': return <NexusGraph leads={leads} />;
      case 'TASK_MANAGER': return <TaskManager lead={lockedLead} />;
      case 'CALENDAR': return <ActivityLogs />; // Placeholder calendar with logs for now
      case 'FACT_CHECK': return <FactCheck lead={lockedLead} />;
      case 'TRANSLATOR': return <TranslatorNode />;
      
      default: return <ExecutiveDashboard leads={leads} market={theater} onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <LayoutZenith
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onSearchClick={() => setIsCommandPaletteOpen(true)}
        theater={theater}
        setTheater={setTheater}
        currentLayout={layoutMode}
        setLayoutMode={setLayoutMode}
      >
        {renderContent()}
      </LayoutZenith>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelect={handleNavigate}
        theme="dark"
      />
      <ToastContainer />
    </>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
