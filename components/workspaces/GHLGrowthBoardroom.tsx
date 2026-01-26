import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { executeGrowthBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';

interface GHLGrowthBoardroomProps {
  lead?: Lead;
  leads: Lead[];
  onLockLead: (id: string) => void;
}

export const GHLGrowthBoardroom: React.FC<GHLGrowthBoardroomProps> = ({ lead, leads, onLockLead }) => {
  const [rounds, setRounds] = useState(3);
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'THE VISIONARY', role: 'Brand & Experience Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'PROFIT HACKER', role: 'Revenue Optimization Expert', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'OPS MASTER', role: 'Efficiency Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'MD SYNTHESIS', role: 'Managing Director', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" }
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
  }, [steps]);

  const handleLaunch = async () => {
    if (!lead) {
      toast.error("MISSION_ABORT: Target identification required.");
      return;
    }
    setIsExecuting(true);
    setFinalResult(null);
    setSteps(prev => prev.map(s => ({ ...s, output: "", status: 'WAITING', currentRound: 1 })));
    
    try {
      const result = await executeGrowthBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success("STRATEGIC CONSENSUS ACHIEVED.");
      setTimeout(() => finalRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto py-12 space-y-16 animate-in fade-in duration-700 pb-96 px-6">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-indigo-500/20 pb-12 gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
            GROWTH <span className="text-indigo-500 not-italic">BOARDROOM</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] italic">Layman Strategic Refinement v1.2 // {lead ? `Client: ${lead.businessName}` : 'AWAITING CLIENT SELECTION'}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[#0b1021] p-6 rounded-[32px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">DEBATE ROUNDS</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-indigo-400 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-indigo-500 cursor-pointer outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} CYCLES OF DEBATE</option>)}
              </select>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">SELECT TARGET</span>
              <select 
                value={lead?.id || ''}
                onChange={(e) => onLockLead(e.target.value)}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-slate-300 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-indigo-500 cursor-pointer outline-none transition-all max-w-[200px] truncate"
              >
                <option value="">-- NO TARGET --</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult ? (
             <button 
                onClick={handleLaunch} 
                disabled={!lead}
                className={`px-12 py-5 rounded-[24px] text-[13px] font-black uppercase tracking-[0.3em] shadow-xl transition-all border-b-4 ${
                    lead ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-800 active:scale-95' : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed opacity-50'
                }`}
             >
               {lead ? 'CONVENE BOARDROOM' : 'CLIENT REQUIRED'}
             </button>
           ) : (
             <button onClick={() => { setFinalResult(null); setSteps(prev => prev.map(s => ({ ...s, output: "", status: 'WAITING' }))); }} className="px-10 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">NEW SESSION</button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {steps.slice(0, 3).map((step, i) => (
          <div key={i} ref={cardRefs[i]}><AgentNode step={step} isLarge={false} /></div>
        ))}
      </div>

      <div className="flex justify-center">
          <div ref={cardRefs[3]} className="max-w-xl w-full">
            <AgentNode step={steps[3]} isLarge={false} />
          </div>
      </div>

      {finalResult && (
        <div ref={finalRef} className="bg-white border-4 border-emerald-500/50 rounded-[64px] shadow-2xl p-20 animate-in slide-in-from-bottom-20 duration-1000">
           <div className="mb-16 border-b border-slate-200 pb-12 flex justify-between items-end">
             <div>
                <h2 className="text-5xl font-black italic text-slate-900 uppercase tracking-tighter leading-none mb-4">DEFINITIVE TRANSFORMATION <span className="text-emerald-600">PLAN</span></h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">CLIENT STRATEGY MANIFEST // {lead?.businessName}</p>
             </div>
             <div className="text-right">
                <span className="px-6 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Verified Layman Standards</span>
             </div>
           </div>
           <FormattedOutput content={finalResult} />
           
           <div className="mt-20 pt-16 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-slate-50 p-10 rounded-[40px] text-center space-y-4 shadow-sm border border-slate-100">
                 <span className="text-4xl">💰</span>
                 <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Revenue Impact</h4>
                 <p className="text-[12px] text-slate-600 font-bold uppercase tracking-tight">Projected +30-50% Lift</p>
              </div>
              <div className="bg-slate-50 p-10 rounded-[40px] text-center space-y-4 shadow-sm border border-slate-100">
                 <span className="text-4xl">⏱️</span>
                 <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Time Reclaimed</h4>
                 <p className="text-[12px] text-slate-600 font-bold uppercase tracking-tight">40+ Hours/Mo Saved</p>
              </div>
              <div className="bg-slate-50 p-10 rounded-[40px] text-center space-y-4 shadow-sm border border-slate-100">
                 <span className="text-4xl">📈</span>
                 <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Scale Status</h4>
                 <p className="text-[12px] text-slate-600 font-bold uppercase tracking-tight">Enterprise Optimal</p>
              </div>
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
            isActive ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)] scale-[1.01] z-10' : 
            isDone ? 'border-slate-800 opacity-100 shadow-xl' : 
            isFailed ? 'border-rose-500/50 opacity-100' : 'border-slate-900 opacity-20'
          } min-h-[450px]`}>
            
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-8xl font-black italic select-none">
              {step.agentName.slice(0, 1)}
            </div>

            <div className="flex justify-between items-start mb-12 relative z-10">
               <div className="space-y-2">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-3xl' : 'text-xl'}`}>{step.agentName}</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">{step.role}</p>
               </div>
               <div className="flex flex-col items-end gap-2">
                 <div className={`px-6 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>{step.status}</div>
                 {(isActive || isDone) && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">ROUND {step.currentRound}</span>}
               </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                     <div className="w-16 h-16 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] animate-pulse italic">CULTIVATING STRATEGY...</p>
                   </div>
                )}
                <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-6">
                    {step.output ? step.output.split('\n').filter(l => l.trim() !== '').map((line, idx) => {
                       const isRoundHeader = line.startsWith('ROUND');
                       return (
                         <div key={idx} className={isRoundHeader ? "mt-8 border-b border-slate-800 pb-2" : ""}>
                           <p className={`${isRoundHeader ? "text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em]" : "text-[14px] text-slate-300 leading-relaxed font-sans border-l-2 border-indigo-500/20 pl-6 italic"}`}>
                              {line.trim()}
                           </p>
                         </div>
                       );
                    }) : (
                      !isActive && <div className="h-full flex items-center justify-center text-slate-800 italic uppercase tracking-widest text-[10px]">Awaiting sequence...</div>
                    )}
                </div>
            </div>
        </div>
    );
};