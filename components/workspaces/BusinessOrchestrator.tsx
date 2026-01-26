
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { 
  SESSION_ASSETS, 
  orchestrateBusinessPackage, 
  resynthesizeNarrative, 
  resynthesizeVisuals, 
  architectPitchDeck, 
  generateOutreachSequence, 
  architectFunnel 
} from '../../services/geminiService';
import { dossierStorage, StrategicDossier } from '../../services/dossierStorage';
import { OutreachModal } from './OutreachModal';
import { toast } from '../../services/toastManager';
import { db } from '../../services/automation/db';

interface BusinessOrchestratorProps {
  leads: Lead[];
  lockedLead?: Lead;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
  onLockLead: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const BusinessOrchestrator: React.FC<BusinessOrchestratorProps> = ({ leads, lockedLead, onNavigate, onLockLead, onUpdateLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lockedLead?.id || '');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  
  const [packageData, setPackageData] = useState<any>(null);
  const [currentDossier, setCurrentDossier] = useState<StrategicDossier | null>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [localLoading, setLocalLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach' | 'visual' | 'funnel'>('strategy');
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  
  // Local target calculation
  const targetLead = useMemo(() => {
    if (isManualMode) {
      if (!manualName || !manualUrl) return null;
      // We check if a lead with this URL already exists in our list
      const existing = leads.find(l => l.websiteUrl === manualUrl);
      if (existing) return existing;

      return {
        id: `MANUAL-${Date.now()}`,
        businessName: manualName,
        websiteUrl: manualUrl,
        niche: 'Manual Entry',
        city: 'Global',
        rank: 0,
        leadScore: 95,
        assetGrade: 'A',
        socialGap: 'Target established via direct override protocol.',
        status: 'cold',
        tags: ['[MANUAL]']
      } as Lead;
    }
    return leads.find(l => l.id === (selectedLeadId || lockedLead?.id));
  }, [leads, selectedLeadId, isManualMode, manualName, manualUrl, lockedLead]);
  
  const leadAssets = useMemo(() => {
    if (!targetLead) return [];
    return SESSION_ASSETS.filter(a => a.leadId === targetLead.id);
  }, [targetLead]);

  useEffect(() => {
    if (targetLead) {
      const savedDossiers = dossierStorage.getAllByLead(targetLead.id);
      if (savedDossiers.length > 0) {
        setCurrentDossier(savedDossiers[0]);
        setPackageData(savedDossiers[0].data);
      } else {
        setCurrentDossier(null);
        setPackageData(null);
      }
    }
  }, [targetLead?.id]);

  const handleOrchestrate = async () => {
    if (!targetLead) {
        toast.info(isManualMode ? "Identity and Website required." : "Business selection required.");
        return;
    }

    setIsOrchestrating(true);
    setPackageData(null); 
    
    try {
      // 1. If in manual mode, we MUST persist and lock this target globally so other modules function
      if (isManualMode) {
        toast.neural("PROTOCOL: Persisting custom business to ledger...");
        db.upsertLeads([targetLead]);
        onLockLead(targetLead.id); // Triggers global system lock
        setSelectedLeadId(targetLead.id);
        setIsManualMode(false); // Switch back to ledger mode now that it's in the DB
      } else {
        onLockLead(targetLead.id); // Ensure existing lead is also locked
      }

      toast.neural(`BUILDER: Initiating Neural Synthesis for ${targetLead.businessName}...`);
      const result = await orchestrateBusinessPackage(targetLead, leadAssets);
      
      const saved = dossierStorage.save(targetLead, result, leadAssets.map(a => a.id));
      setPackageData(result);
      setCurrentDossier(saved);
      toast.success("BUILDER: Strategic Intelligence Mesh Synchronized globally.");
    } catch (e: any) {
      console.error(e);
      toast.error(`SYSTEM_FAULT: ${e.message || "Synthesis timed out."}`);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleResynthesize = async (part: string) => {
    if (!targetLead || !packageData) return;
    setLocalLoading(part);
    toast.neural(`RE-SYNTHESIZING: ${part.toUpperCase()}...`);

    try {
      let updatedData = { ...packageData };
      
      switch(part) {
        case 'narrative':
          const narrative = await resynthesizeNarrative(targetLead);
          updatedData.narrative = narrative;
          break;
        case 'visual':
          const visual = await resynthesizeVisuals(targetLead);
          updatedData.visualDirection = visual;
          break;
        case 'strategy':
          const deck = await architectPitchDeck(targetLead);
          updatedData.presentation = deck;
          break;
        case 'outreach':
          const sequence = await generateOutreachSequence(targetLead);
          updatedData.outreach.emailSequence = sequence;
          break;
        case 'journey':
          const funnel = await architectFunnel(targetLead);
          updatedData.funnel = funnel;
          break;
      }

      setPackageData(updatedData);
      dossierStorage.save(targetLead, updatedData, leadAssets.map(a => a.id));
      toast.success(`RE-SYNTHESIS COMPLETE: ${part.toUpperCase()} UPDATED.`);
    } catch (e) {
      toast.error("Re-synthesis failed.");
    } finally {
      setLocalLoading(null);
    }
  };

  const EmptyState = ({ section }: { section: string }) => (
    <div className="py-20 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-slate-800 rounded-[40px] text-center px-10">
       <span className="text-5xl mb-6 grayscale">📦</span>
       <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">{section} STAGING</h4>
       <p className="text-[10px] font-bold uppercase tracking-widest mt-3 text-slate-600 italic">INITIATE SYNTHESIS TO LOAD DATA MESH</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            CAMPAIGN <span className="text-emerald-500 not-italic">BUILDER</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            SECURED STRATEGY SYNTHESIS HUB
          </p>
        </div>
        <div className="flex gap-4">
            {packageData && (
                <button 
                  onClick={() => onNavigate('RESEARCH', 'EXECUTIVE_DOSSIER')}
                  className="bg-white text-black hover:bg-emerald-500 hover:text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-4 border-slate-300"
                >
                  📄 EXPORT EXECUTIVE PACKAGE
                </button>
            )}
            <button 
                onClick={handleOrchestrate}
                disabled={isOrchestrating || (!isManualMode && !targetLead)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
            >
                {isOrchestrating ? 'SYNTHESIZING...' : 'INITIATE CAMPAIGN BUILD'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-8">
              
              {/* MODE TOGGLE */}
              <div className="flex p-1 bg-[#020617] border border-slate-800 rounded-2xl mb-4">
                 <button 
                  onClick={() => setIsManualMode(false)}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${!isManualMode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Ledger Selection
                 </button>
                 <button 
                  onClick={() => setIsManualMode(true)}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${isManualMode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Direct Entry
                 </button>
              </div>

              {isManualMode ? (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">BUSINESS_IDENTITY</label>
                      <input 
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="NAME OF COMPANY..."
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all uppercase placeholder-slate-700 shadow-inner"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">WEBSITE_NODE</label>
                      <input 
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all placeholder-slate-700 shadow-inner"
                      />
                   </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                   <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">SELECT_FROM_LEDGER</label>
                   <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 shadow-inner">
                      {targetLead ? (
                          <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-white uppercase italic tracking-tight">{targetLead.businessName}</span>
                              <button onClick={() => { setSelectedLeadId(''); onLockLead(''); }} className="text-slate-600 hover:text-rose-500 transition-colors">×</button>
                          </div>
                      ) : (
                          <select 
                            value={selectedLeadId || lockedLead?.id || ''}
                            onChange={(e) => { setSelectedLeadId(e.target.value); onLockLead(e.target.value); }}
                            className="w-full bg-transparent border-none text-sm font-bold text-slate-500 focus:outline-none cursor-pointer appearance-none uppercase italic"
                          >
                             <option value="">-- SELECT BUSINESS --</option>
                             {leads.map(l => (
                               <option key={l.id} value={l.id}>{l.businessName}</option>
                             ))}
                          </select>
                      )}
                   </div>
                </div>
              )}

              <button 
                onClick={handleOrchestrate}
                disabled={isOrchestrating || (!isManualMode && !targetLead)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
              >
                {isOrchestrating ? 'SYNTHESIZING...' : 'INITIATE CAMPAIGN BUILD'}
              </button>
              
              {packageData && (
                <button 
                  onClick={() => setIsOutreachOpen(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
                >
                  🚀 OPEN OUTREACH CONSOLE
                </button>
              )}
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              {isOrchestrating && (
                 <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-8 p-20 text-center animate-in fade-in">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-900 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">BUILDER ACTIVE</h3>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.6em] animate-pulse">ARCHITECTING EXHAUSTIVE BUSINESS STRATEGY</p>
                    </div>
                 </div>
              )}

              {!packageData && !isOrchestrating ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                    <span className="text-9xl font-black italic text-slate-700 uppercase tracking-tighter">READY</span>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
                    <div className="flex border-b border-slate-800 bg-slate-900/50">
                       {[
                         { id: 'strategy', label: 'STRATEGY' },
                         { id: 'narrative', label: 'NARRATIVE' },
                         { id: 'content', label: 'CONTENT' },
                         { id: 'funnel', label: 'JOURNEY' },
                         { id: 'outreach', label: 'OUTREACH' },
                         { id: 'visual', label: 'VISUALS' }
                       ].map(tab => (
                         <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                             activeTab === tab.id 
                               ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500' 
                               : 'text-slate-500 hover:text-white hover:bg-slate-900'
                           }`}
                         >
                           {tab.label}
                         </button>
                       ))}
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#020617] relative">
                       {/* Tab Action Bar */}
                       {packageData && (
                         <div className="absolute top-8 right-12 z-20">
                            <button 
                                onClick={() => handleResynthesize(activeTab === 'funnel' ? 'journey' : activeTab)}
                                disabled={!!localLoading}
                                className="px-4 py-2 bg-slate-900 border border-slate-700 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                               {localLoading === (activeTab === 'funnel' ? 'journey' : activeTab) ? 'SYNCING...' : `RE-SYNTHESIZE ${activeTab}`}
                            </button>
                         </div>
                       )}

                       {activeTab === 'strategy' && (
                          <div className="space-y-10">
                             {packageData?.presentation?.slides?.length > 0 ? (
                                <>
                                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{packageData.presentation.title || "STRATEGY Blueprint"}</h2>
                                   <div className="grid gap-6">
                                      {packageData.presentation.slides.map((s: any, i: number) => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] group hover:border-emerald-500/30 transition-all">
                                           <h3 className="text-xl font-bold text-white uppercase mb-4">#{i+1}: {s?.title || 'Segment'}</h3>
                                           <ul className="space-y-3">
                                              {(s?.bullets || []).map((b: string, j: number) => (
                                                <li key={j} className="text-sm text-slate-400 flex items-start gap-3">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                                   {b}
                                                </li>
                                              ))}
                                           </ul>
                                        </div>
                                      ))}
                                   </div>
                                </>
                             ) : <EmptyState section="STRATEGY" />}
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[40px] shadow-inner">
                             <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-8 tracking-widest flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                EXECUTIVE_NARRATIVE
                             </h3>
                             <p className="text-xl text-slate-300 italic font-medium leading-relaxed font-serif whitespace-pre-wrap">{packageData?.narrative || "Narrative synthesis pending..."}</p>
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             {packageData?.outreach?.emailSequence?.length > 0 ? (
                                packageData.outreach.emailSequence.map((e: any, i: number) => (
                                   <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 shadow-xl">
                                      <div className="flex justify-between items-center">
                                          <p className="text-sm font-bold text-white uppercase tracking-tight">
                                            <span className="text-slate-500 font-black">SUBJECT:</span> {e?.subject || "Draft"}
                                          </p>
                                          <span className="text-[9px] font-black text-emerald-500 px-2 py-1 bg-emerald-900/20 rounded">EMAIL_{i+1}</span>
                                      </div>
                                      <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed bg-black/30 p-6 rounded-2xl border border-slate-800/50">{e?.body || "..."}</p>
                                   </div>
                                ))
                             ) : <EmptyState section="OUTREACH" />}
                          </div>
                       )}

                       {activeTab === 'funnel' && (
                          <div className="space-y-8">
                            {packageData?.funnel?.map((f: any, i: number) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] flex items-center gap-8 group hover:border-emerald-500/30 transition-all">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black italic">{i+1}</div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-white uppercase tracking-widest">{f.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{f.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-emerald-500 uppercase block">GOAL</span>
                                        <span className="text-xs font-bold text-white uppercase">{f.conversionGoal}</span>
                                    </div>
                                </div>
                            ))}
                            {!packageData?.funnel && <EmptyState section="JOURNEY" />}
                          </div>
                       )}

                       {activeTab === 'content' && (
                          <div className="space-y-6">
                            {packageData?.contentPack?.map((post: any, i: number) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4">
                                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{post.platform} // {post.type}</span>
                                    <p className="text-slate-300 text-sm italic">"{post.caption}"</p>
                                </div>
                            ))}
                            {!packageData?.contentPack && <EmptyState section="CONTENT" />}
                          </div>
                       )}

                       {activeTab === 'visual' && (
                          <div className="space-y-8">
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-8 rounded-[32px]">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">BRAND AESTHETIC DIRECTION</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{packageData?.visualDirection?.brandMood || "Direction required."}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {packageData?.visualDirection?.aiImagePrompts?.map((p: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                                        <span className="text-[9px] font-black text-slate-500 uppercase">{p.use_case} PROMPT</span>
                                        <p className="text-[10px] text-emerald-400 font-mono italic leading-relaxed">"{p.prompt}"</p>
                                    </div>
                                ))}
                            </div>
                            {!packageData?.visualDirection && <EmptyState section="VISUALS" />}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {currentDossier && targetLead && (
        <OutreachModal 
          isOpen={isOutreachOpen}
          onClose={() => setIsOutreachOpen(false)}
          dossier={currentDossier}
          lead={targetLead}
          onUpdateLead={onUpdateLead}
          onSent={() => {}} 
        />
      )}
    </div>
  );
};
