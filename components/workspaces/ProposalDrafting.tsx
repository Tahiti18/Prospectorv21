
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateProposalDraft } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

interface ProposalDraftingProps {
  lead?: Lead;
}

export const ProposalDrafting: React.FC<ProposalDraftingProps> = ({ lead }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDraft = async () => {
    if (!lead) return;
    setIsLoading(true);
    toast.neural("PROPOSAL: Synthesizing High-Ticket Transformation Plan...");
    try {
      const result = await generateProposalDraft(lead);
      setDraft(result);
      toast.success("PROPOSAL: Strategy Blueprint Synchronized.");
    } catch (e) {
      console.error(e);
      toast.error("Proposal Engine Error.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [lead?.id]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Context Required for Proposal Drafting</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">PROPOSAL <span className="text-emerald-600 not-italic">BUILDER</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Constructing Strategic Blueprint for {lead.businessName}</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={loadDraft}
             disabled={isLoading}
             className="px-6 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
           >
             RE-SYNTHESIZE PROPOSAL
           </button>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-16 shadow-2xl relative min-h-[700px] overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-[#0b1021]/80 z-20 backdrop-blur-sm">
             <div className="w-1.5 h-32 bg-emerald-500/10 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 animate-[pulse_1.5s_infinite]"></div>
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse italic">Synthesizing Visionary Strategy...</p>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <FormattedOutput content={draft} />
          </div>
        )}
      </div>

      <div className="flex justify-center">
         <button 
           onClick={() => {
             if (draft) {
               navigator.clipboard.writeText(draft);
               toast.success("PROPOSAL_COPIED_TO_CLIPBOARD");
             }
           }}
           className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all border-b-8 border-emerald-800"
         >
           FINALIZE & EXPORT BLUEPRINT
         </button>
      </div>
    </div>
  );
};
