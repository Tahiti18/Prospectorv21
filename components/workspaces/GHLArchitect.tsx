import React, { useState, useEffect, useRef } from 'react';
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
    { agentName: 'EXECUTIVE', role: 'Executive Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  const cardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const finalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIdx = steps.findIndex(s => s.status === 'THINKING');
    if (activeIdx !== -1 && cardRefs[activeIdx].current) {
      cardRefs[activeIdx].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (finalResult && finalRef.current) {
      finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [steps, finalResult]);

  const handleLaunch = async () => {
    setIsExecuting(true);
    setFinalResult(null);
    try {
      const result = await executeNeuralBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success("TECHNICAL CONSENSUS ACHIEVED.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto py-12 space-y-16 animate-in fade-in duration-700 pb-96 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-emerald-500/20 pb-12 gap-8">
        <div className="space-y-4">
          <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none">
            GHL <span className="text-emerald-500 not-italic">PLANNER</span>
          </h1>
          <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.6em] italic">High-Fidelity Neural Boardroom // Target: {lead.businessName}</p>
        </div>
        
        <div className="flex items-center gap-10 bg-[#0b1021] p-10 rounded-[48px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">DEBATE CYCLES</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                disabled={isExecuting}
                className="bg-black border-2 border-slate-800 text-emerald-400 text-[11px] font-black uppercase px-8 py-3.5 rounded-2xl focus:border-emerald-500 cursor-pointer outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ROUNDS OF WARFARE</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult ? (
             <button onClick={handleLaunch} className="bg-emerald-600 hover:bg-emerald-500 text-white px-20 py-7 rounded-[32px] text-[16px] font-black uppercase tracking-[0.4em] shadow-[0_0_60px_rgba(16,185,129,0.3)] active:scale-95 border-b-8 border-emerald-800 transition-all flex items-center gap-6">
               <span className="text-3xl">⚔️</span> BEGIN BOARDROOM
             </button>
           ) : (
             <button onClick={() => { setFinalResult(null); setIsExecuting(false); }} className="px-12 py-5 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all">RE-INITIATE SCENARIO</button>
           )}
        </div>
      </div>

      {/* STAGGERED COMMAND GRID */}
      <div className="space-y-16">
          {/* ROW 1: THE POWER DUO (Massive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {steps.slice(0, 2).map((step, i) => (
              <div key={i} ref={cardRefs[i]}>
                <AgentNode step={step} isLarge={true} />
              </div>
            ))}
          </div>

          {/* ROW 2: THE REFINEMENT DUO (Standard) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {steps.slice(2, 4).map((step, i) => (
              <div key={i+2} ref={cardRefs[i+2]}>
                <AgentNode step={step} isLarge={false} />
              </div>
            ))}
          </div>
      </div>

      {/* FINAL MASTER BLUEPRINT */}
      {finalResult && (
        <div ref={finalRef} className="bg-black border-4 border-emerald-500/50 rounded-[96px] shadow-[0_0_200px_rgba(16,185,129,0.2)] p-24 animate-in slide-in-from-bottom-20 duration-1000 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500"></div>
           <div className="mb-24 border-b border-slate-800 pb-20 flex justify-between items-center">
              <div className="space-y-4">
                <h2 className="text-8xl font-black italic text-white uppercase tracking-tighter leading-none">GHL MASTER <span className="text-emerald-500">BLUEPRINT</span></h2>
                <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.8em] mt-2">TECHNICAL SYNERGY ACHIEVED // STRATEGIC DOMINANCE SECURED</p>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(finalResult); toast.success("Schematic Copied."); }}
                className="px-16 py-7 bg-slate-900 border-2 border-slate-800 text-slate-300 hover:text-white rounded-[32px] text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
              >
                COPY RAW SCHEMATIC
              </button>
           </div>
           <div className="animate-in fade-in duration-1000 delay-500">
              <FormattedOutput content={finalResult} />
           </div>
        </div>
      )}
    </div>
  );
};

// Internal node renderer for the beautiful clean output
const AgentNode = ({ step, isLarge }: { step: BoardroomStep, isLarge: boolean }) => {
    const isActive = step.status === 'THINKING';
    const isDone = step.status === 'COMPLETED';

    return (
        <div className={`bg-[#0b1021] border-4 rounded-[72px] p-16 transition-all duration-1000 relative overflow-hidden flex flex-col ${
            isActive ? 'border-emerald-500 shadow-[0_0_120px_rgba(16,185,129,0.4)] scale-[1.02] z-10 bg-emerald-950/10' : 
            isDone ? 'border-slate-800 opacity-100' : 'border-slate-900 opacity-20'
          } ${isLarge ? 'min-h-[850px]' : 'min-h-[500px]'}`}>
            
            <div className="flex justify-between items-start mb-16 relative z-10">
               <div className="space-y-3">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-6xl' : 'text-3xl'}`}>{step.agentName}</h3>
                  <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">{step.role}</p>
               </div>
               <div className={`px-8 py-3 rounded-2xl border-2 text-[11px] font-black uppercase tracking-[0.3em] ${
                 isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 
                 isDone ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-600 border-slate-800'
               }`}>
                  {step.status}
               </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-10 animate-in fade-in">
                        <div className="w-32 h-32 border-[12px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-[14px] font-black text-emerald-400 uppercase tracking-[1em] animate-pulse ml-4">THINKING...</p>
                    </div>
                )}

                {step.output && (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-8 space-y-10 animate-in slide-in-from-bottom-4 duration-1000">
                         <div className="space-y-12">
                            {step.output.split('\n').filter(line => line.trim() !== '').map((line, idx) => {
                                // Simple header detection: All caps and ends with colon or just all caps
                                const trimmedLine = line.trim();
                                const isHeader = (/^[A-Z\s_]+:?$/.test(trimmedLine) && trimmedLine.length > 3) || trimmedLine.endsWith(':');
                                
                                if (isHeader) {
                                    return <h4 key={idx} className="text-xl font-black text-emerald-400 uppercase tracking-tighter border-l-4 border-emerald-500 pl-6 mt-10 first:mt-0 italic">{trimmedLine.replace(':', '')}</h4>;
                                }
                                if (trimmedLine.startsWith('-')) {
                                    return (
                                        <div key={idx} className="flex gap-4 items-start pl-8 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0 group-hover:scale-150 transition-all"></div>
                                            <p className="text-[15px] text-slate-300 leading-relaxed font-medium uppercase tracking-tight">{trimmedLine.replace('-', '').trim()}</p>
                                        </div>
                                    );
                                }
                                return <p key={idx} className="text-[15px] text-slate-400 leading-[1.8] font-serif italic pl-6 border-l border-slate-800">{trimmedLine}</p>;
                            })}
                         </div>
                         <div className="pt-16 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.8em] italic">PACKET VERIFIED // END TRACE</p>
                         </div>
                    </div>
                )}

                {!isActive && !isDone && (
                    <div className="h-full flex items-center justify-center opacity-5 grayscale scale-110">
                        <span className="text-[160px] font-black italic text-slate-700 select-none">NODE</span>
                    </div>
                )}
            </div>

            {/* Background Aesthetic Watermark */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.02] text-[300px] font-black italic pointer-events-none select-none text-white">
                {step.agentName.slice(0, 1)}
            </div>
        </div>
    );
};