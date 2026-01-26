
/* =========================================================
   PITCH ENGINE – HIGH-FIDELITY SYNTHESIS
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generatePitch } from '../../services/geminiService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';
import { dossierStorage } from '../../services/dossierStorage';

interface PitchGenProps {
  lead?: Lead;
}

export const PitchGen: React.FC<PitchGenProps> = ({ lead }) => {
  const [pitch, setPitch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPitch = async (force = false) => {
    if (!lead) return;
    
    // Check for existing dossier data first to avoid manual trigger wait
    const dossier = dossierStorage.getByLead(lead.id);
    if (!force && dossier && dossier.data.pitch) {
        setPitch(JSON.stringify(dossier.data.pitch));
        return;
    }

    setIsLoading(true);
    setPitch(null);
    toast.neural("PITCH: Crafting Psychological Conversion Scripts...");
    try {
      const data = await generatePitch(lead);
      setPitch(data);
      toast.success("PITCH: Script Architecture Synchronized.");
    } catch (e) {
      console.error(e);
      toast.error("Pitch Engine Uplink Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPitch();
  }, [lead?.id]);

  const handleCopy = () => {
    if (pitch) {
        try {
            const parsed = JSON.parse(pitch);
            const textToCopy = parsed.sections?.map((s: any) => 
                `${s.heading}\n${s.body.map((b: any) => Array.isArray(b.content) ? b.content.join('\n') : b.content).join('\n')}`
            ).join('\n\n');
            navigator.clipboard.writeText(textToCopy);
        } catch(e) {
            navigator.clipboard.writeText(pitch);
        }
        toast.success("Pitch Scripts Copied.");
    }
  };

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Pitch Architecture</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">
              PITCH <span className="text-emerald-500 not-italic">ENGINE</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Psychological Scripting Architecture for {lead.businessName}</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => loadPitch(true)}
                disabled={isLoading}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
            >
                RE-SYNTHESIZE SCRIPTS
            </button>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] shadow-2xl relative min-h-[600px] flex flex-col overflow-hidden">
         {isLoading ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 text-center bg-[#0b1021] z-20 backdrop-blur-sm">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-900 rounded-full"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎤</div>
              </div>
              <div className="space-y-2">
                <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em] animate-pulse italic">Crystallizing Narrative Architecture...</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest italic">NEURAL LINGUISTIC CORE ACTIVE</p>
              </div>
           </div>
         ) : pitch && (
           <div className="flex-1 p-16 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-700 bg-[#020617]/40">
              <div className="max-w-4xl mx-auto">
                 <FormattedOutput content={pitch} />
                 
                 <div className="mt-20 flex flex-col items-center gap-8 border-t border-slate-800 pt-16">
                    <button 
                        onClick={handleCopy}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-6 rounded-[32px] text-[12px] font-black uppercase tracking-[0.4em] shadow-xl transition-all active:scale-95 border-b-8 border-emerald-800"
                    >
                        COPY ALL SCRIPTS
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
