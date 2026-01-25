
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateOutreachSequence } from '../../services/geminiService';
import { dossierStorage } from '../../services/dossierStorage';
import { toast } from '../../services/toastManager';

interface SequencerProps {
  lead?: Lead;
}

export const Sequencer: React.FC<SequencerProps> = ({ lead }) => {
  const [sequence, setSequence] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;

    const loadSequence = async () => {
      setIsLoading(true);
      
      // 1. Check Dossier first (Pre-drafted by Campaign Architect)
      const dossier = dossierStorage.getByLead(lead.id);
      if (dossier && dossier.data.outreach?.emailSequence && dossier.data.outreach.emailSequence.length >= 7) {
          const strikePlan: any[] = [];
          
          dossier.data.outreach.emailSequence.forEach((e: any, i: number) => {
              strikePlan.push({
                  day: e.day || [1, 3, 5, 10, 15, 20, 25][i] || (i * 4) + 1,
                  channel: 'EMAIL',
                  purpose: e.purpose || (i === 0 ? 'Initial Hook' : 'Value Expansion'),
                  subject: e.subject,
                  body: e.body
              });
          });

          if (Array.isArray(dossier.data.outreach.linkedinSequence)) {
              dossier.data.outreach.linkedinSequence.forEach((l: any) => {
                  strikePlan.push({
                      day: l.day || 4,
                      channel: 'LINKEDIN',
                      purpose: 'Social Indoctrination',
                      body: l.message
                  });
              });
          }

          setSequence(strikePlan.sort((a, b) => a.day - b.day));
          setIsLoading(false);
          return;
      }

      // 2. Otherwise Generate New
      try {
        const steps = await generateOutreachSequence(lead);
        setSequence(steps.sort((a: any, b: any) => a.day - b.day));
      } catch (e) {
        console.error(e);
        toast.error("Strike Roadmap Generation Failed.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSequence();
  }, [lead?.id]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Strike Sequence</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
            ENGAGEMENT <span className="text-emerald-500 not-italic">SEQUENCE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">25-Day Strike Roadmap // 7-Email Multi-Channel Strike Protocol: {lead.businessName}</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-emerald-600/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">STRIKE_FLOW_ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          <div className="h-96 bg-[#0b1021] border border-slate-800 rounded-[48px] flex flex-col items-center justify-center space-y-8 shadow-2xl">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-emerald-900 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">✍️</div>
             </div>
             <div className="text-center space-y-2">
                <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Architecting 25-Day Sequence...</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest italic">NEURAL CORE LINKED TO OPENROUTER FLASH</p>
             </div>
          </div>
        ) : sequence.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
             {sequence.map((step, i) => (
               <div key={i} className="bg-[#0b1021] border border-slate-800 rounded-[40px] p-12 flex flex-col md:flex-row gap-12 hover:border-emerald-500/40 transition-all group shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-[120px] font-black italic select-none group-hover:opacity-5 transition-opacity">
                    {step.day}
                  </div>
                  
                  <div className="md:w-40 flex flex-col items-center justify-center border-r border-slate-800/50 pr-12 shrink-0">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">DAY</span>
                     <span className="text-7xl font-black italic text-white group-hover:text-emerald-500 transition-colors tracking-tighter leading-none">{step.day}</span>
                  </div>

                  <div className="flex-1 space-y-6 min-w-0">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 border rounded-xl text-[9px] font-black uppercase tracking-[0.2em] ${
                                step.channel === 'EMAIL' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' :
                                step.channel === 'LINKEDIN' ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' :
                                'bg-slate-900 border-slate-800 text-slate-400'
                            }`}>
                               {step.channel || 'EMAIL'}
                            </span>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-800 pl-4">{step.purpose || 'Strategic Outreach'}</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {step.subject && (
                            <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">SUBJECT:</span>
                                <span className="text-xs font-bold text-white uppercase italic">{step.subject}</span>
                            </div>
                        )}
                        <div className="text-slate-300 text-sm leading-[1.8] italic font-medium p-8 bg-slate-950/50 rounded-[32px] border border-slate-800/60 group-hover:border-emerald-500/20 transition-colors whitespace-pre-wrap font-serif">
                          "{step.body || step.message}"
                        </div>
                     </div>
                  </div>

                  <div className="md:w-56 flex flex-col items-center justify-center gap-4 border-l border-slate-800/50 pl-12 shrink-0">
                     <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800">
                        SEND TEST
                     </button>
                     <button className="w-full bg-slate-900 border border-slate-800 text-slate-600 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                        EDIT COPY
                     </button>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="h-96 border-4 border-dashed border-slate-800 rounded-[56px] flex flex-col items-center justify-center text-center opacity-20 group">
             <span className="text-8xl mb-8 group-hover:scale-110 transition-transform">📋</span>
             <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">SEQUENCE DATABASE EMPTY</h3>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">FORGE CAMPAIGN TO INITIALIZE DRIP LOGIC</p>
          </div>
        )}
      </div>
    </div>
  );
};
