
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { executeNeuralBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

export const GHLArchitect: React.FC<{ lead: Lead }> = ({ lead }) => {
  const [rounds, setRounds] = useState(3);
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'ARCHITECT', role: 'Technical Blueprint Design', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Red-Team / Risk', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'ROI & Strategy Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Executive Client Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  // Refs for auto-scrolling
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finalRef = useRef<HTMLDivElement | null>(null);

  const handleLaunchBoardroom = async () => {
    setIsExecuting(true);
    setFinalResult(null);
    try {
      const result = await executeNeuralBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success(`BOARDROOM: Consensus Finalized.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Tracking effect to scroll to thinking node
  useEffect(() => {
    const thinkingIndex = steps.findIndex(s => s.status === 'THINKING');
    if (thinkingIndex !== -1 && cardRefs.current[thinkingIndex]) {
        cardRefs.current[thinkingIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (finalResult && finalRef.current) {
        finalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [steps, finalResult]);

  return (
    <div className="max-w-[1700px] mx-auto py-8 space-y-12 animate-in fade-in duration-700 pb-80">
      {/* Dynamic Header */}
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none mb-3">
            GHL <span className="text-emerald-500 not-italic">BOARDROOM</span>
          </h1>
          <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] italic">Multi-Agent Adversarial Debate Hub // Target: {lead.businessName}</p>
        </div>
        
        <div className="flex items-center gap-8 bg-[#0b1021] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">ADVERSARIAL INTENSITY</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-emerald-400 text-[11px] font-black uppercase px-8 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} {r === 1 ? 'CYCLE' : 'CYCLES'} OF DEBATE</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult && (
             <button 
               onClick={handleLaunchBoardroom}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-6 rounded-[28px] text-[14px] font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(16,185,129,0.3)] active:scale-95 border-b-4 border-emerald-800 transition-all flex items-center gap-4"
             >
               <span className="text-2xl">⚡</span> BEGIN ADVERSARIAL FORGE
             </button>
           )}

           {finalResult && (
               <button 
                 onClick={() => { setFinalResult(null); setIsExecuting(false); }}
                 className="px-10 py-4 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
               >
                 RE-INITIATE TECHNICAL SCRUTINY
               </button>
           )}
        </div>
      </div>

      {/* STAGGERED WAR ROOM GRID */}
      <div className="space-y-12">
          {/* ROW 1: THE POWER DUO (MASSIVE CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {steps.slice(0, 2).map((step, i) => (
              <div key={i} ref={el => cardRefs.current[i] = el}>
                <AgentCard step={step} totalRounds={rounds} isLarge={true} />
              </div>
            ))}
          </div>

          {/* ROW 2: THE REFINEMENT DUO (STANDARD CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {steps.slice(2, 4).map((step, i) => (
              <div key={i+2} ref={el => cardRefs.current[i+2] = el}>
                <AgentCard step={step} totalRounds={rounds} isLarge={false} />
              </div>
            ))}
          </div>
      </div>

      {/* FINAL MASTER PLAN OUTPUT */}
      {finalResult && (
        <div ref={finalRef} className="bg-black border-4 border-emerald-500/50 rounded-[84px] shadow-[0_0_150px_rgba(16,185,129,0.2)] p-24 animate-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-500 via-indigo-500 via-rose-500 to-emerald-500"></div>
           <div className="mb-20 border-b border-slate-800 pb-16 flex justify-between items-center">
              <div className="space-y-3">
                <h2 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none">GHL MASTER <span className="text-emerald-500">BLUEPRINT</span></h2>
                <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.6em] mt-2">TECHNICAL CONSENSUS ACHIEVED // HIGH-FIDELITY ARCHITECTURE</p>
              </div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(finalResult); toast.success("Blueprint Copied."); }}
                    className="px-12 py-5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
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

      {/* EMPTY STATE */}
      {!isExecuting && !finalResult && (
        <div className="h-[400px] border-4 border-dashed border-slate-900 rounded-[84px] flex flex-col items-center justify-center opacity-10">
           <span className="text-9xl font-black italic text-slate-700 select-none">STANDBY</span>
        </div>
      )}
    </div>
  );
};

// Sub-component for Agent Cards with Logic for Highlighting
const AgentCard: React.FC<{ step: BoardroomStep; totalRounds: number; isLarge: boolean }> = ({ step, totalRounds, isLarge }) => {
    const isActive = step.status === 'THINKING';
    const isDone = step.status === 'COMPLETED';

    return (
        <div className={`bg-[#0b1021] border-4 rounded-[64px] p-12 transition-all duration-700 relative overflow-hidden flex flex-col ${
            isActive ? 'border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.3)] scale-[1.02] z-10 bg-emerald-950/10' : 
            isDone ? 'border-indigo-900/50 opacity-100' : 'border-slate-900 opacity-20'
          } ${isLarge ? 'min-h-[700px]' : 'min-h-[450px]'}`}>
            
            <div className="flex justify-between items-start mb-10">
               <div className="space-y-2">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-5xl' : 'text-3xl'}`}>{step.agentName}</h3>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{step.role}</p>
               </div>
               <div className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] ${
                 isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 
                 isDone ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-500 border-slate-700'
               }`}>
                  {step.status}
               </div>
            </div>
            
            <div className="space-y-8 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${step.status === 'WAITING' ? 'bg-slate-800' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{step.modelLabel}</span>
                    </div>
                    {(step.agentName === 'AUDITOR' || step.agentName === 'REFINER') && step.status !== 'WAITING' && (
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] animate-pulse">RECURSION PHASE</span>
                           <span className="text-2xl font-black italic text-white leading-none">{step.currentRound}/{totalRounds}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-h-0 relative">
                    {isActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                            <div className="w-24 h-24 border-8 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="text-center space-y-2">
                               <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.8em] animate-pulse leading-none">Neural Core Engaged</p>
                               <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">SYNCHRONIZING ADVERSARIAL VECTORS...</p>
                            </div>
                        </div>
                    )}

                    {step.output && (
                        <div className="h-full overflow-y-auto custom-scrollbar pr-6 space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
                             <div className="p-10 bg-black/50 rounded-[48px] border border-white/5 shadow-inner relative group">
                                <div className="absolute top-6 left-10 flex gap-2">
                                   <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                   <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                   <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                </div>
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] mb-8 border-b border-white/5 pb-2">SECURED_TRACE_FEED</h4>
                                <div className="text-[14px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
                                  {step.output}
                                </div>
                             </div>
                             <div className="flex items-center justify-center gap-6 py-6">
                                <span className="h-px bg-emerald-500/20 flex-1"></span>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] italic shrink-0">DATA HAND-OFF VERIFIED</p>
                                <span className="h-px bg-emerald-500/20 flex-1"></span>
                             </div>
                        </div>
                    )}

                    {step.status === 'WAITING' && !step.output && (
                        <div className="h-full flex items-center justify-center opacity-5 grayscale scale-110">
                            <span className="text-[120px] font-black italic text-slate-700 select-none">NODE</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
