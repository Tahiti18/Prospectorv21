
import React, { useState, useEffect } from 'react';
import { generatePlaybookStrategy } from '../../services/geminiService';
import { toast } from '../../services/toastManager';
import { FormattedOutput } from '../common/FormattedOutput';

export const ScoringRubricView: React.FC = () => {
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('High-Ticket SaaS Agency');

  const niches = [
    'High-Ticket SaaS Agency',
    'Luxury Real Estate Marketing',
    'Elite Medical Transformation',
    'Automotive Digital Domination',
    'Hospitality Brand Revamp'
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      toast.neural(`SYRINGING PLAYBOOK DNA: ${selectedNiche}`);
      const data = await generatePlaybookStrategy(selectedNiche);
      setStrategy(data);
      toast.success("AGENCY PLAYBOOK SYNCHRONIZED.");
    } catch (e: any) {
      console.error(e);
      toast.error(`Architecture Fault: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-16 max-w-[1500px] mx-auto py-12 px-6 pb-60 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Agency Protocols</span>
        </div>
        <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">THE PROSPECTOR <span className="text-emerald-500 not-italic">PLAYBOOK</span></h1>
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Operational Master Methodology & SOPs</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* LEFT COLUMN: SCORING LOGIC */}
        <div className="lg:col-span-7 bg-[#0b1021] border-2 border-slate-800 rounded-[72px] p-20 space-y-16 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
          <div className="flex justify-between items-center relative z-10">
             <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] italic flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                Lead Grading Matrix
             </h3>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800 px-4 py-1.5 rounded-full">COMMIT_VERSION: 3.2</span>
          </div>
          
          <div className="space-y-16 relative z-10 flex-1">
            {[
              { label: 'VISUAL AUTHORITY', max: '40 PTS', progress: 95, desc: 'Original photography quality, UI design hierarchy, and pixel-level brand consistency.' },
              { label: 'SOCIAL SILENCE INDEX', max: '30 PTS', progress: 80, desc: 'Measurement of account activity versus potential viral leverage. Gap analysis factor.' },
              { label: 'HIGH-TICKET GRAVITY', max: '20 PTS', progress: 65, desc: 'Averaging LTV and affluent density markers to determine premium service plausibility.' },
              { label: 'TECHNICAL REACHABILITY', max: '10 PTS', progress: 45, desc: 'The complexity of reaching the high-level decision maker via official contact vectors.' },
            ].map((item, i) => (
              <div key={i} className="space-y-6 group">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-100 uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors">{item.label}</span>
                  <span className="text-[11px] font-black text-emerald-500 uppercase italic">{item.max}</span>
                </div>
                <div className="h-3 bg-[#05091a] rounded-full overflow-hidden border-2 border-slate-800 p-[3px] shadow-inner">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-[1.5s] ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:brightness-125" style={{ width: `${item.progress}%` }}></div>
                </div>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-2 border-slate-800 relative z-10">
             <div className="grid grid-cols-3 gap-6">
                {['GRADE A: ELITE', 'GRADE B: VIABLE', 'GRADE C: LEGACY'].map(g => (
                   <div key={g} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">THRESHOLD</span>
                      <span className="text-[10px] font-black text-white uppercase italic">{g}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SOP GENERATOR */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[64px] p-16 flex-1 shadow-2xl relative overflow-hidden flex flex-col">
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mb-32"></div>
             
             <div className="space-y-10 relative z-10 h-full flex flex-col">
                <div className="space-y-4">
                   <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">SOP Generator</h3>
                   <div className="relative group">
                      <select 
                        value={selectedNiche}
                        onChange={(e) => setSelectedNiche(e.target.value)}
                        className="w-full bg-[#020617] border-2 border-slate-800 rounded-3xl px-8 py-6 text-[11px] font-black text-emerald-400 uppercase tracking-widest focus:border-emerald-500 outline-none cursor-pointer appearance-none"
                      >
                         {niches.map(n => <option key={n} value={n}>{n.toUpperCase()}</option>)}
                      </select>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">▼</div>
                   </div>
                </div>

                {!strategy && !isLoading && (
                   <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-20 text-center">
                      <div className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[32px] flex items-center justify-center text-4xl grayscale opacity-30 shadow-2xl">📜</div>
                      <div className="space-y-4">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] max-w-[240px] leading-relaxed">SELECT A NICHE TO SYNC OPERATIONAL PROTOCOLS</p>
                        <button 
                          onClick={handleGenerate}
                          className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all border-b-4 border-emerald-800"
                        >
                          SYNC SOP MESH
                        </button>
                      </div>
                   </div>
                )}

                {isLoading && (
                   <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                      <div className="w-16 h-16 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] animate-pulse italic">DECODING PLAYBOOK DNA...</p>
                   </div>
                )}

                {strategy && !isLoading && (
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                      <div className="p-8 bg-emerald-600 rounded-[40px] shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black italic select-none">SOP</div>
                         <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic mb-4 border-b border-white/20 pb-4">CORE STRATEGY</h3>
                         <p className="text-white text-2xl font-black italic leading-tight uppercase tracking-tighter">"{strategy.strategyName}"</p>
                      </div>
                      
                      <div className="space-y-12">
                         {strategy.steps?.map((s: any, i: number) => (
                           <div key={i} className="flex gap-8 group">
                              <span className="text-5xl font-black italic text-slate-800 group-hover:text-emerald-500 transition-colors leading-none">{i+1}</span>
                              <div className="space-y-2">
                                 <h4 className="text-[13px] font-black text-white uppercase tracking-widest">{s.title}</h4>
                                 <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">{s.tactic}</p>
                              </div>
                           </div>
                         ))}
                      </div>

                      <button onClick={() => setStrategy(null)} className="w-full py-4 text-[9px] font-black text-slate-700 hover:text-white uppercase tracking-[0.4em] border-2 border-slate-800 border-dashed rounded-3xl transition-all">RE-INITIATE SOP SYNC</button>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
