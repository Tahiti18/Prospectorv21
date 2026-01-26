
import React, { useState } from 'react';
import { Lead } from '../../types';
import { executeNeuralBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

export const GHLArchitect: React.FC<{ lead: Lead }> = ({ lead }) => {
  const [rounds, setRounds] = useState(3);
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'ARCHITECT', role: 'System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Red-Team', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Polish', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Executive Synthesis', modelLabel: 'ChatGPT (4o-mini)', modelId: 'openai/gpt-4o-mini', status: 'WAITING', currentRound: 1 }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  const handleLaunchBoardroom = async () => {
    setIsExecuting(true);
    setFinalResult(null);
    try {
      const result = await executeNeuralBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success(`BOARDROOM: ${rounds}-Round Technical Consensus Achieved.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto py-8 space-y-12 animate-in fade-in duration-700 pb-60">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none mb-3">
            GHL <span className="text-emerald-500 not-italic">BOARDROOM</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] italic">Multi-Agent Adversarial Debate Hub // Target: {lead.businessName}</p>
        </div>
        
        <div className="flex items-center gap-8 bg-[#0b1021] p-6 rounded-[32px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">DEBATE INTENSITY (LOOP DEPTH)</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-emerald-400 text-[10px] font-black uppercase px-6 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} {r === 1 ? 'ROUND' : 'ROUNDS'} OF DEBATE</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult && (
             <button 
               onClick={handleLaunchBoardroom}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-95 border-b-4 border-emerald-800 transition-all flex items-center gap-4"
             >
               <span className="text-xl">⚔️</span> BEGIN DEBATE
             </button>
           )}

           {finalResult && (
               <button 
                 onClick={() => { setFinalResult(null); setIsExecuting(false); }}
                 className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
               >
                 RE-INITIATE TECHNICAL SCRUTINY
               </button>
           )}
        </div>
      </div>

      {/* STAGGERED WAR ROOM GRID */}
      <div className="space-y-10">
          {/* ROW 1: THE POWER DUO (Large) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {steps.slice(0, 2).map((step, i) => (
              /* Comment: Fixed type error by explicitly defining AgentCard as React.FC, ensuring 'key' is handled correctly */
              <AgentCard key={i} step={step} totalRounds={rounds} isLarge={true} />
            ))}
          </div>

          {/* ROW 2: THE REFINEMENT DUO (Standard) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.slice(2, 4).map((step, i) => (
              /* Comment: Fixed type error by explicitly defining AgentCard as React.FC, ensuring 'key' is handled correctly */
              <AgentCard key={i} step={step} totalRounds={rounds} isLarge={false} />
            ))}
          </div>
      </div>

      {/* FINAL MASTER PLAN OUTPUT */}
      {finalResult && (
        <div className="bg-black border-2 border-emerald-500/50 rounded-[64px] shadow-[0_0_100px_rgba(16,185,129,0.15)] p-20 animate-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 via-rose-500 to-emerald-500"></div>
           <div className="mb-16 border-b border-slate-800 pb-12 flex justify-between items-center">
              <div className="space-y-2">
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">GHL MASTER <span className="text-emerald-500">BLUEPRINT</span></h2>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mt-1">High-Fidelity Consensus Achieved // Model Synchronized</p>
              </div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(finalResult); toast.success("Blueprint Copied."); }}
                    className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl"
                  >
                    COPY RAW SCHEMATIC
                  </button>
              </div>
           </div>
           <div className="animate-in fade-in duration-1000 delay-500">
              <FormattedOutput content={finalResult} />
           </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Agent Cards
/* Comment: Fixed type error by explicitly defining props using React.FC to allow 'key' prop when rendering from map() */
const AgentCard: React.FC<{ step: BoardroomStep; totalRounds: number; isLarge: boolean }> = ({ step, totalRounds, isLarge }) => {
    return (
        <div className={`bg-[#0b1021] border-2 rounded-[48px] p-10 transition-all duration-700 relative overflow-hidden flex flex-col ${
            step.status === 'THINKING' ? 'border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.15)] scale-[1.01] z-10' : 
            step.status === 'COMPLETED' ? 'border-indigo-900/50 opacity-100' : 'border-slate-900 opacity-30'
          } ${isLarge ? 'min-h-[500px]' : 'min-h-[350px]'}`}>
            
            <div className="flex justify-between items-start mb-8">
               <div className="space-y-1">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-3xl' : 'text-xl'}`}>{step.agentName}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{step.role}</p>
               </div>
               <div className={`px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                 step.status === 'THINKING' ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 
                 step.status === 'COMPLETED' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-500 border-slate-700'
               }`}>
                  {step.status}
               </div>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${step.status === 'WAITING' ? 'bg-slate-800' : 'bg-emerald-500'}`}></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{step.modelLabel}</span>
                    </div>
                    {(step.agentName === 'AUDITOR' || step.agentName === 'REFINER') && step.status !== 'WAITING' && (
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">RECURSION {step.currentRound}/{totalRounds}</span>
                    )}
                </div>
                
                <div className="flex-1 min-h-0 relative">
                    {step.status === 'THINKING' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] animate-pulse">Neural Path Tracing...</p>
                        </div>
                    )}

                    {step.output && (
                        <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-4 animate-in slide-in-from-bottom-2 duration-1000">
                             <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 shadow-inner">
                                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">NEURAL_TRACE_FEED:</h4>
                                <div className="text-[12px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                                  {step.output}
                                </div>
                             </div>
                             <div className="flex items-center justify-center gap-4 py-4">
                                <span className="h-px bg-emerald-500/20 flex-1"></span>
                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.5em] italic shrink-0">DATA PACKET SECURED</p>
                                <span className="h-px bg-emerald-500/20 flex-1"></span>
                             </div>
                        </div>
                    )}

                    {step.status === 'WAITING' && !step.output && (
                        <div className="h-full flex items-center justify-center opacity-10">
                            <span className="text-8xl font-black italic text-slate-700">STDBY</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
