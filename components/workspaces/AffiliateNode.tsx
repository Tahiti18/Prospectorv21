
/* =========================================================
   AFFILIATE NODE – APEX VELOCITY NETWORK
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { generateAffiliateProgram } from '../../services/geminiService';
import { toast } from '../../services/toastManager';
import { Tooltip } from './Tooltip';

export const AffiliateNode: React.FC = () => {
  const [niche, setNiche] = useState('Agency Owners & Growth Partners');
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiers' | 'arsenal' | 'metrics'>('tiers');

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await generateAffiliateProgram(niche);
      setProgram(data);
      toast.success("PARTNER ARCHITECTURE SYNCHRONIZED.");
    } catch (e: any) {
      console.error(e);
      toast.error("Architecture Fault: Node Busy.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="max-w-[1550px] mx-auto py-8 space-y-12 animate-in fade-in duration-700 pb-40 px-4">
      
      {/* APEX HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-800 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <span className="text-white font-black text-3xl italic">A</span>
             </div>
             <div>
                <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">APEX <span className="text-emerald-500 not-italic">NETWORK</span></h1>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] mt-2 italic">Partner Infrastructure // High-Gravity Rewards</p>
             </div>
          </div>
        </div>
        
        <div className="flex bg-[#0b1021] p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
           {['tiers', 'arsenal', 'metrics'].map((t: any) => (
             <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
                {t}
             </button>
           ))}
        </div>
      </div>

      {isLoading ? (
         <div className="py-40 flex flex-col items-center justify-center space-y-8 animate-pulse">
            <div className="w-20 h-20 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] italic">Synthesizing Network Infrastructure...</p>
         </div>
      ) : program ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: MAIN CONTENT AREA */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* VISION BLOCK */}
             <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full transition-all group-hover:bg-emerald-600/10"></div>
                <div className="relative z-10 space-y-6">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">MISSION_PROTOCOL</h3>
                    <p className="text-3xl font-black italic text-slate-100 leading-tight tracking-tighter uppercase">"{program.vision}"</p>
                    <div className="flex gap-4 pt-4">
                        {program.nextSteps.map((s: string, i: number) => (
                          <div key={i} className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                             <span className="text-emerald-500 font-black text-xs mr-2">0{i+1}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s}</span>
                          </div>
                        ))}
                    </div>
                </div>
             </div>

             {activeTab === 'tiers' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {program.tiers.map((t: any, i: number) => (
                      <div key={i} className={`bg-[#0b1021] border p-8 rounded-[40px] shadow-2xl space-y-6 relative overflow-hidden transition-all hover:-translate-y-1 ${i === 2 ? 'border-emerald-500/50 ring-1 ring-emerald-500/10' : 'border-slate-800'}`}>
                         <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TIER 0{i+1}</span>
                            {i === 2 && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">{t.name}</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.requirement}</p>
                         </div>
                         <div className="py-5 border-y border-slate-800/50 flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-emerald-400 tracking-tighter leading-none">{t.commission}</span>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">RECURRING</span>
                            </div>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed italic">"{t.bonus}"</p>
                      </div>
                    ))}
                </div>
             )}

             {activeTab === 'arsenal' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                   {program.marketingArsenal.map((a: any, i: number) => (
                     <div key={i} className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 flex flex-col md:flex-row gap-10 hover:border-emerald-500/40 transition-all group">
                        <div className="md:w-48 flex flex-col justify-center border-r border-slate-800/50 pr-10 shrink-0">
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{a.type}</span>
                           <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">{a.title}</h4>
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed italic shadow-inner">
                              "{a.content}"
                           </div>
                           <button 
                             onClick={() => { navigator.clipboard.writeText(a.content); toast.success("Arsenal Copied."); }}
                             className="text-[9px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-[0.3em] transition-colors"
                           >
                             COPY PAYLOAD →
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             )}

             {activeTab === 'metrics' && (
                <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex justify-between items-center mb-12">
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">POTENTIAL REVENUE RADAR</h3>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BASED ON {program.roiPartnerModel.avgUserValue} USER VALUE</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {Object.entries(program.roiPartnerModel.monthlyIncomePotential).map(([users, income]: any, idx: number) => (
                         <div key={idx} className="bg-slate-950 border border-slate-800 p-8 rounded-3xl text-center space-y-4 shadow-xl">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{users.replace('_', ' ')}</span>
                            <p className="text-4xl font-black italic text-emerald-400 tracking-tighter">{income}</p>
                            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">MONTHLY UPLINK</p>
                         </div>
                      ))}
                   </div>
                   <div className="mt-16 p-8 bg-emerald-600/5 border border-emerald-500/20 rounded-[32px] flex items-center gap-8">
                      <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl shadow-xl">💰</div>
                      <div className="flex-1 space-y-1">
                         <p className="text-sm font-black text-white uppercase italic tracking-widest">High-Velocity Passive Flow</p>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">By targeting 10 agencies per week using Prospector OS, your projection to hit $5,000/mo is approximately 120 days.</p>
                      </div>
                   </div>
                </div>
             )}
          </div>

          {/* RIGHT: PARTNER STATUS SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-10 sticky top-10">
                <div className="text-center space-y-6">
                   <div className="w-32 h-32 bg-slate-900 border-4 border-slate-800 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-600/10 animate-pulse"></div>
                      <span className="text-5xl font-black text-emerald-500 italic relative z-10 group-hover:scale-110 transition-transform">01</span>
                   </div>
                   <div>
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">PARTNER NODE #001</h3>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-1 animate-pulse">STATUS: INITIALIZING</p>
                   </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-800">
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">ACTIVE USERS</span>
                      <span className="text-xl font-black italic text-white">0</span>
                   </div>
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">TOTAL PAYOUTS</span>
                      <span className="text-xl font-black italic text-emerald-400">$0.00</span>
                   </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">UNIQUE_REFERRAL_NODE</p>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-inner">
                        <span className="text-[10px] font-mono text-emerald-500 uppercase font-black truncate">os.apex.net/fndr_01</span>
                        <button onClick={() => toast.info("Referral ID Copied.")} className="text-[8px] font-black text-slate-600 hover:text-white uppercase tracking-widest">COPY</button>
                    </div>
                </div>

                <button 
                  onClick={() => toast.success("Uplink established. Protocol Active.")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 border-b-4 border-emerald-800 transition-all"
                >
                   LAUNCH PARTNER DASHBOARD
                </button>
             </div>
          </div>

        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center opacity-20 italic">
          <p className="text-[12px] font-black uppercase tracking-[0.5em]">Awaiting Infrastructure Synthesis...</p>
        </div>
      )}

      {/* FOOTER NOTICE */}
      <div className="bg-slate-950/40 border-4 border-slate-800 border-dashed rounded-[64px] p-20 text-center space-y-6">
         <p className="text-[13px] font-black text-slate-600 uppercase tracking-[0.6em] leading-relaxed max-w-3xl mx-auto italic">
           THIS PROGRAM IS ARCHITECTED FOR DIRECT HIGH-FIDELITY PARTICIPATION. NO MULTI-LEVEL STRUCTURES. ALL CAPITAL IS DIRECTED TO THE PRIMARY REFERRAL NODE.
         </p>
         <div className="flex justify-center gap-10 opacity-30">
            {['SINGLE_LEVEL_STRICT', 'INSTANT_SETTLEMENT', 'FOUNDERS_CIRCLE_READY'].map(t => <span key={t} className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">{t}</span>)}
         </div>
      </div>
    </div>
  );
};
