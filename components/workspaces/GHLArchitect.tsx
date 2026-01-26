
import React, { useState } from 'react';
import { Lead } from '../../types';
import { executeNeuralBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

export const GHLArchitect: React.FC<{ lead: Lead }> = ({ lead }) => {
  const [rounds, setRounds] = useState(2);
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'ARCHITECT', role: 'Technical Design', modelLabel: 'Gemini 2.0 Flash', modelId: 'google/gemini-2.0-flash-001', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Logical Critique', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Polish', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Final Synthesis', modelLabel: 'ChatGPT (4o-mini)', modelId: 'openai/gpt-4o-mini', status: 'WAITING', currentRound: 1 }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  const handleLaunchBoardroom = async () => {
    setIsExecuting(true);
    setFinalResult(null);
    try {
      const result = await executeNeuralBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success(`BOARDROOM: ${rounds}-Round Consensus Finalized.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto py-8 space-y-12 animate-in fade-in duration-700 pb-40">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">
            GHL <span className="text-emerald-500 not-italic">ARCHITECT</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Multi-Agent Neural Boardroom // Iterative Adversarial Logic // Target: {lead.businessName}</p>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">DEBATE INTENSITY</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                disabled={isExecuting}
                className="bg-[#0b1021] border border-slate-800 text-emerald-400 text-[10px] font-black uppercase px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} {r === 1 ? 'ROUND' : 'ROUNDS'}</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult && (
             <button 
               onClick={handleLaunchBoardroom}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl active:scale-95 border-b-4 border-emerald-800 transition-all flex items-center gap-3"
             >
               <span>🤝</span> INITIATE BOARDROOM
             </button>
           )}

           {finalResult && (
               <button 
                 onClick={() => { setFinalResult(null); setIsExecuting(false); }}
                 className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
               >
                 RE-INITIATE DEBATE
               </button>
           )}
        </div>
      </div>

      {/* BOARDROOM VISUALIZER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div key={i} className={`bg-[#0b1021] border-2 rounded-[32px] p-8 transition-all duration-500 relative overflow-hidden flex flex-col ${
            step.status === 'THINKING' ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02] z-10' : 
            step.status === 'COMPLETED' ? 'border-indigo-900/50 opacity-100 bg-indigo-900/5' : 'border-slate-900 opacity-30'
          }`}>
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{step.agentName}</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{step.role}</p>
               </div>
               <div className={`px-2 py-1 rounded-md border text-[8px] font-black uppercase ${
                 step.status === 'THINKING' ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 
                 step.status === 'COMPLETED' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-500 border-slate-700'
               }`}>
                  {step.status}
               </div>
            </div>
            
            <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'WAITING' ? 'bg-slate-700' : 'bg-emerald-500'}`}></div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{step.modelLabel}</span>
                    </div>
                    {(step.agentName === 'AUDITOR' || step.agentName === 'REFINER') && step.status !== 'WAITING' && (
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">ROUND {step.currentRound}/{rounds}</span>
                    )}
                </div>
                
                {step.status === 'THINKING' && (
                  <div className="py-10 text-center animate-in fade-in">
                     <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Processing Mesh Data...</p>
                  </div>
                )}

                {step.status === 'COMPLETED' && (
                  <div className="py-4 space-y-4 animate-in zoom-in-95 h-full flex flex-col justify-center">
                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                        <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-3 italic">
                          "{step.output?.slice(0, 120)}..."
                        </p>
                     </div>
                     <p className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2 justify-center">
                        <span className="text-lg">✅</span> PAYLOAD HAND-OFF
                     </p>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* FINAL OUTPUT */}
      {finalResult && (
        <div className="bg-[#0b1021] border-2 border-emerald-500/30 rounded-[56px] shadow-2xl p-16 animate-in slide-in-from-bottom-10 duration-1000 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 via-rose-500 to-emerald-500"></div>
           <div className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">GHL MASTER <span className="text-emerald-500">BLUEPRINT</span></h2>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Consensus reached after {rounds} rounds of adversarial logic</p>
              </div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(finalResult); toast.success("Blueprint Copied."); }}
                    className="px-6 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    COPY RAW DATA
                  </button>
              </div>
           </div>
           <div className="animate-in fade-in duration-1000 delay-300">
              <FormattedOutput content={finalResult} />
           </div>
        </div>
      )}

      {!isExecuting && !finalResult && (
        <div className="h-96 border-4 border-dashed border-slate-800 rounded-[64px] flex flex-col items-center justify-center group opacity-20">
           <span className="text-9xl font-black italic text-slate-800 uppercase tracking-tighter leading-none group-hover:scale-105 group-hover:text-slate-700 transition-all select-none">IDLE</span>
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mt-8 group-hover:text-emerald-600 transition-colors">AWAITING BOARDROOM ACTIVATION</p>
        </div>
      )}
    </div>
  );
};
