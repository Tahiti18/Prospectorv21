import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { executeNeuralBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

interface GHLArchitectProps {
  lead?: Lead;
  leads: Lead[];
  onLockLead: (id: string) => void;
}

export const GHLArchitect: React.FC<GHLArchitectProps> = ({ lead, leads, onLockLead }) => {
  const [rounds, setRounds] = useState(3);
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'ARCHITECT', role: 'GHL System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Compliance Audit', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
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
    if (!lead) {
      toast.error("MISSION_ABORT: Target identification required.");
      return;
    }
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
      {/* Normalized Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-emerald-500/20 pb-12 gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
            GHL <span className="text-emerald-500 not-italic">PLANNER</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] italic">Neural Boardroom Engine // {lead ? `Target: ${lead.businessName}` : 'AWAITING TARGET SELECTION'}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[#0b1021] p-6 rounded-[32px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">SELECT TARGET</span>
              <select 
                value={lead?.id || ''}
                onChange={(e) => onLockLead(e.target.value)}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-slate-300 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-emerald-500 cursor-pointer outline-none transition-all max-w-[200px] truncate"
              >
                <option value="">-- NO TARGET SELECTED --</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
              </select>
           </div>

           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">DEBATE INTENSITY</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-emerald-400 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-emerald-500 cursor-pointer outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} CYCLES OF DEBATE</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult ? (
             <button 
                onClick={handleLaunch} 
                disabled={!lead}
                className={`px-12 py-5 rounded-[24px] text-[13px] font-black uppercase tracking-[0.3em] shadow-xl transition-all border-b-4 ${
                    lead ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 active:scale-95' : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed opacity-50'
                }`}
             >
               {lead ? 'INITIALIZE BOARDROOM' : 'TARGET REQUIRED'}
             </button>
           ) : (
             <button onClick={() => { setFinalResult(null); setIsExecuting(false); }} className="px-10 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">RE-INITIATE SEQUENCE</button>
           )}
        </div>
      </div>

      {/* STAGGERED COMMAND GRID */}
      <div className="space-y-12">
          {/* ROW 1: THE POWER DUO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {steps.slice(0, 2).map((step, i) => (
              <div key={i} ref={cardRefs[i]}>
                <AgentNode step={step} isLarge={true} />
              </div>
            ))}
          </div>

          {/* ROW 2: THE REFINEMENT DUO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.slice(2, 4).map((step, i) => (
              <div key={i+2} ref={cardRefs[i+2]}>
                <AgentNode step={step} isLarge={false} />
              </div>
            ))}
          </div>
      </div>

      {/* FINAL MASTER BLUEPRINT */}
      {finalResult && (
        <div ref={finalRef} className="bg-black border-4 border-emerald-500/50 rounded-[84px] shadow-[0_0_150px_rgba(16,185,129,0.15)] p-20 animate-in slide-in-from-bottom-20 duration-1000 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500"></div>
           <div className="mb-16 border-b border-slate-800 pb-12 flex justify-between items-center">
              <div className="space-y-3">
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">GHL MASTER <span className="text-emerald-500">BLUEPRINT</span></h2>
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] mt-2">TECHNICAL SYNERGY ACHIEVED // STATE PERSISTED</p>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(finalResult); toast.success("Schematic Copied."); }}
                className="px-10 py-5 bg-slate-900 border-2 border-slate-800 text-slate-300 hover:text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
              >
                COPY RAW DATA
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

const AgentNode = ({ step, isLarge }: { step: BoardroomStep, isLarge: boolean }) => {
    const isActive = step.status === 'THINKING';
    const isDone = step.status === 'COMPLETED';
    const isFailed = step.status === 'FAILED';

    return (
        <div className={`bg-[#0b1021] border-4 rounded-[64px] p-12 transition-all duration-1000 relative overflow-hidden flex flex-col ${
            isActive ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)] scale-[1.01] z-10 bg-emerald-950/5' : 
            isDone ? 'border-slate-800 opacity-100' : 
            isFailed ? 'border-rose-500/50 bg-rose-950/5 opacity-100' :
            'border-slate-900 opacity-20'
          } ${isLarge ? 'min-h-[700px]' : 'min-h-[450px]'}`}>
            
            <div className="flex justify-between items-start mb-12 relative z-10">
               <div className="space-y-2">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-3xl' : 'text-xl'}`}>{step.agentName}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">{step.role}</p>
               </div>
               <div className={`px-6 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-[0.2em] ${
                 isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 
                 isDone ? 'bg-slate-800 text-emerald-400 border-emerald-500/20' : 
                 isFailed ? 'bg-rose-500 text-white border-rose-400' :
                 'bg-slate-900 text-slate-600 border-slate-800'
               }`}>
                  {step.status}
               </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                        <div className="w-24 h-24 border-[10px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.8em] animate-pulse ml-4">THINKING...</p>
                    </div>
                )}

                {step.output && (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-6 space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
                         <div className="space-y-10">
                            {step.output.split('\n').filter(line => line.trim() !== '').map((line, idx) => {
                                const trimmedLine = line.trim();
                                const isHeader = (/^[A-Z\s_]+:?$/.test(trimmedLine) && trimmedLine.length > 3) || trimmedLine.endsWith(':');
                                
                                if (isHeader) {
                                    return <h4 key={idx} className="text-lg font-black text-emerald-400 uppercase tracking-tighter border-l-4 border-emerald-500 pl-5 mt-8 first:mt-0 italic">{trimmedLine.replace(':', '')}</h4>;
                                }
                                if (trimmedLine.startsWith('-')) {
                                    return (
                                        <div key={idx} className="flex gap-3 items-start pl-6 group">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0 group-hover:scale-150 transition-all"></div>
                                            <p className="text-[13px] text-slate-300 leading-relaxed font-sans">{trimmedLine.replace('-', '').trim()}</p>
                                        </div>
                                    );
                                }
                                return <p key={idx} className="text-[14px] text-slate-400 leading-[1.7] font-sans pl-5 border-l border-slate-800">{trimmedLine}</p>;
                            })}
                         </div>
                    </div>
                )}

                {isFailed && (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <span className="text-4xl">⚠️</span>
                      <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest">NEURAL LINK INTERRUPTED</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">THE AGENT ENCOUNTERED A COGNITIVE FAULT. RETRYING IS RECOMMENDED.</p>
                   </div>
                )}

                {!isActive && !isDone && !isFailed && (
                    <div className="h-full flex items-center justify-center opacity-5 grayscale scale-110">
                        <span className="text-[120px] font-black italic text-slate-700 select-none">NODE</span>
                    </div>
                )}
            </div>

            <div className="absolute -bottom-10 -right-10 opacity-[0.01] text-[200px] font-black italic pointer-events-none select-none text-white">
                {step.agentName.slice(0, 1)}
            </div>
        </div>
    );
};