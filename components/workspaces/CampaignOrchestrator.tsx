/* =========================================================
   CAMPAIGN ORCHESTRATOR – ENHANCED V15
   ========================================================= */

import React, { useState, useMemo, useEffect } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { SESSION_ASSETS, orchestrateBusinessPackage } from '../../services/geminiService';
import { dossierStorage } from '../../services/dossierStorage';
import { OutreachModal } from './OutreachModal';
import { toast } from '../../services/toastManager';
import { FormattedOutput } from '../common/FormattedOutput';

interface CampaignOrchestratorProps {
  leads: Lead[];
  lockedLead?: Lead;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
  onLockLead: (id: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const CampaignOrchestrator: React.FC<CampaignOrchestratorProps> = ({ leads, lockedLead, onNavigate, onLockLead, onUpdateLead }) => {
  const [packageData, setPackageData] = useState<any>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'narrative' | 'content' | 'outreach' | 'visual' | 'funnel'>('strategy');
  const [outreachSubTab, setOutreachSubTab] = useState<'email' | 'linkedin' | 'call'>('email');
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  
  const leadAssets = useMemo(() => {
    if (!lockedLead) return [];
    return SESSION_ASSETS.filter(a => a.leadId === lockedLead.id);
  }, [lockedLead]);

  useEffect(() => {
    if (lockedLead) {
      const savedDossiers = dossierStorage.getAllByLead(lockedLead.id);
      if (savedDossiers.length > 0) {
        setPackageData(savedDossiers[0].data);
      } else {
        setPackageData(null);
      }
    }
  }, [lockedLead?.id]);

  const handleOrchestrate = async () => {
    if (!lockedLead) {
        toast.info("Target identification required.");
        return;
    }
    setIsOrchestrating(true);
    setPackageData(null); 
    
    try {
      toast.neural("FORGE: Initiating High-Density Intelligence Sweep...");
      const result = await orchestrateBusinessPackage(lockedLead, leadAssets);
      
      dossierStorage.save(lockedLead, result, leadAssets.map(a => a.id));
      setPackageData(result);
      toast.success("FORGE: High-Density Intelligence Mesh Synchronized.");
    } catch (e: any) {
      console.error(e);
      toast.error(`NEURAL_FAULT: ${e.message || "Uplink timed out."}`);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleLocalSelect = (id: string) => {
    if (!id) return;
    onLockLead(id);
  };

  if (!lockedLead) {
      return (
          <div className="max-w-4xl mx-auto py-40 text-center space-y-12 animate-in fade-in duration-700">
              <span className="text-8xl block grayscale opacity-20">🎯</span>
              <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Mission Target Selection</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] max-w-sm mx-auto">
                      Establish a primary prospect to initialize the high-density campaign forge.
                  </p>
              </div>
              <div className="max-w-md mx-auto">
                 <select 
                    onChange={(e) => handleLocalSelect(e.target.value)}
                    className="w-full bg-[#0b1021] border-2 border-slate-800 rounded-2xl px-6 py-5 text-sm font-bold text-slate-400 focus:border-emerald-500 outline-none appearance-none cursor-pointer uppercase italic text-center"
                 >
                    <option value="">-- SELECT TARGET FROM LEDGER --</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
                 </select>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            CAMPAIGN <span className="text-emerald-500 not-italic">FORGE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            SECURED NEURAL CORE GATEWAY: {lockedLead.businessName.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={handleOrchestrate}
                disabled={isOrchestrating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
            >
                {isOrchestrating ? 'ORCHESTRATING...' : 'INITIATE CAMPAIGN FORGE'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
           <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] min-h-[700px] flex flex-col shadow-2xl relative overflow-hidden">
              {isOrchestrating && (
                 <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-8 p-20 text-center animate-in fade-in">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-900 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">NEURAL FORGE ACTIVE</h3>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.6em] animate-pulse">ARCHITECTING EXHAUSTIVE INTELLIGENCE MESH</p>
                    </div>
                 </div>
              )}

              {!packageData && !isOrchestrating ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                    <span className="text-9xl font-black italic text-slate-700 uppercase tracking-tighter">STANDBY</span>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
                    <div className="flex border-b border-slate-800 bg-slate-900/50">
                       {[
                         { id: 'strategy', label: 'STRATEGY' },
                         { id: 'narrative', label: 'NARRATIVE' },
                         { id: 'content', label: 'CONTENT' },
                         { id: 'funnel', label: 'FUNNEL' },
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

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#020617]">
                       {activeTab === 'strategy' && (
                          <div className="space-y-10">
                             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{packageData?.presentation?.title || "STRATEGY Blueprint"}</h2>
                             <div className="grid gap-6">
                                {packageData?.presentation?.slides?.map((s: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] group hover:border-emerald-500/30 transition-all relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-4 opacity-5 text-[40px] font-black italic">{s.category}</div>
                                     <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black italic text-white shadow-lg shadow-emerald-600/20">{i+1}</div>
                                        <h3 className="text-xl font-bold text-white uppercase">{s?.title || 'Segment'}</h3>
                                     </div>
                                     <ul className="space-y-3 mb-6">
                                        {(s?.bullets || []).map((b: string, j: number) => (
                                          <li key={j} className="text-sm text-slate-400 flex items-start gap-3">
                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                             {b}
                                          </li>
                                        ))}
                                     </ul>
                                     {s.insight && (
                                         <div className="p-4 bg-slate-950/50 border border-emerald-500/10 rounded-2xl">
                                             <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">CORE_INSIGHT</p>
                                             <p className="text-[11px] text-slate-500 italic font-medium">"{s.insight}"</p>
                                         </div>
                                     )}
                                  </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {activeTab === 'narrative' && (
                          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[40px] shadow-inner relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-600"></div>
                             <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-8 tracking-widest flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                EXECUTIVE_THESIS
                             </h3>
                             <p className="text-2xl text-slate-200 italic font-medium leading-relaxed font-serif whitespace-pre-wrap">{packageData?.narrative || "Synthesis pending..."}</p>
                          </div>
                       )}

                       {activeTab === 'outreach' && (
                          <div className="space-y-8">
                             <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-6 inline-flex">
                                 {['email', 'linkedin', 'call'].map((sub) => (
                                     <button
                                         key={sub}
                                         onClick={() => setOutreachSubTab(sub as any)}
                                         className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${outreachSubTab === sub ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                     >
                                         {sub}
                                     </button>
                                 ))}
                             </div>

                             {outreachSubTab === 'email' && packageData?.outreach?.emailSequence?.map((e: any, i: number) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 shadow-xl animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">
                                          <span className="text-slate-500 font-black">SUBJECT:</span> {e?.subject || "Draft"}
                                        </p>
                                        <span className="text-[9px] font-black text-emerald-500 px-2 py-1 bg-emerald-900/20 rounded">EMAIL_{i+1}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed bg-black/30 p-6 rounded-2xl border border-slate-800/50">{e?.body || "..."}</p>
                                </div>
                             ))}

                             {outreachSubTab === 'linkedin' && packageData?.outreach?.linkedinSequence?.map((l: any, i: number) => (
                                 <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 shadow-xl animate-in slide-in-from-bottom-2">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{l.type}</span>
                                         <span className="text-[9px] font-black text-slate-500 px-2 py-1 bg-slate-950 rounded">MSG_{i+1}</span>
                                     </div>
                                     <p className="text-xs text-slate-300 italic p-6 bg-indigo-900/5 rounded-2xl border border-indigo-500/10">"{l.message}"</p>
                                 </div>
                             ))}

                             {outreachSubTab === 'call' && packageData?.outreach?.callScript && (
                                 <div className="bg-[#0b1021] border border-slate-800 p-12 rounded-[48px] space-y-10 animate-in zoom-in-95">
                                     <div className="space-y-4">
                                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block border-b border-emerald-500/20 pb-2">1. THE OPENER</span>
                                         <p className="text-lg font-black text-white italic uppercase tracking-tighter">{packageData.outreach.callScript.opener}</p>
                                     </div>
                                     <div className="space-y-4">
                                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block border-b border-emerald-500/20 pb-2">2. THE HOOK (VALUE PROP)</span>
                                         <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"{packageData.outreach.callScript.hook}"</p>
                                     </div>
                                     <div className="space-y-4">
                                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block border-b border-emerald-500/20 pb-2">3. THE CLOSING</span>
                                         <p className="text-sm font-black text-emerald-400 italic">{packageData.outreach.callScript.closing}</p>
                                     </div>
                                 </div>
                             )}
                          </div>
                       )}

                       {activeTab === 'funnel' && (
                          <div className="space-y-8">
                            {packageData?.funnel?.map((f: any, i: number) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] flex items-center gap-10 group hover:border-emerald-500/30 transition-all">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black italic text-xl shadow-inner group-hover:scale-110 transition-transform">{i+1}</div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-white uppercase tracking-widest">{f.title}</h4>
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white uppercase">{f.conversionGoal}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium italic">"{f.description}"</p>
                                        {f.frictionFix && (
                                            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                                <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">AI_TRANSFORMATION_VECTOR</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase">{f.frictionFix}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                          </div>
                       )}

                       {activeTab === 'content' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {packageData?.contentPack?.map((post: any, i: number) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-[30px] font-black italic">{post.type}</div>
                                    <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">{post.platform}</span>
                                    <p className="text-slate-200 text-sm font-medium italic leading-relaxed">"{post.caption}"</p>
                                    <div className="pt-4 border-t border-slate-800">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">VISUAL_DIRECTIVE</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">"{post.visualDirective || 'Default visual engine trigger.'}"</p>
                                    </div>
                                </div>
                            ))}
                          </div>
                       )}

                       {activeTab === 'visual' && (
                          <div className="space-y-12">
                            {/* BRAND STYLE GUIDE HEADER */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-7 space-y-10">
                                    <div className="bg-[#0b1021] border border-slate-800 p-10 rounded-[48px] shadow-inner space-y-8">
                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mb-4">COLOR PALETTE (NEURAL SYNC)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {packageData?.visualDirection?.colorPalette?.map((c: any, i: number) => (
                                                <div key={i} className="space-y-3 group">
                                                    <div className="h-20 w-full rounded-2xl border border-white/5 shadow-2xl transition-transform group-hover:scale-105" style={{ backgroundColor: c.hex }}></div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-white">{c.hex}</p>
                                                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">{c.color}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">AESTHETIC_LOGIC</p>
                                             <p className="text-xs text-slate-400 italic">"{packageData?.visualDirection?.brandMood}"</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5">
                                    <div className="bg-[#0b1021] border border-slate-800 p-10 rounded-[48px] shadow-inner space-y-8 h-full">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">TYPOGRAPHY HIERARCHY</h4>
                                        <div className="space-y-10 py-4">
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-slate-600 uppercase">HEADING (H1-H3)</p>
                                                <p className="text-4xl font-black text-white italic truncate tracking-tighter" style={{ fontFamily: 'serif' }}>{packageData?.visualDirection?.typography?.heading || 'Serif Bold'}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-slate-600 uppercase">BODY (PARAGRAPH)</p>
                                                <p className="text-xl font-medium text-slate-400 truncate tracking-tight">{packageData?.visualDirection?.typography?.body || 'Sans Regular'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {packageData?.visualDirection?.aiImagePrompts?.map((p: any, i: number) => (
                                    <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-4 hover:border-emerald-500/40 transition-all">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{p.use_case} PLATE</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono italic leading-relaxed bg-black/40 p-5 rounded-2xl border border-white/5">"{p.prompt}"</p>
                                    </div>
                                ))}
                            </div>
                          </div>
                       )}
                    </div>
                    
                    <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">DATA_SET_SYNC: COMPLETE</p>
                        <button 
                            onClick={() => setIsOutreachOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 border-b-4 border-indigo-800"
                        >
                            DEPLOY OUTREACH HUB
                        </button>
                    </div>
                 </div>
              )}
           </div>
      </div>

      {packageData && lockedLead && (
        <OutreachModal 
          isOpen={isOutreachOpen}
          onClose={() => setIsOutreachOpen(false)}
          dossier={{ data: packageData }}
          lead={lockedLead}
          onUpdateLead={onUpdateLead}
        />
      )}
    </div>
  );
};