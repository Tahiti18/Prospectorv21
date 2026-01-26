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
    { agentName: 'BRAND STRATEGIST', role: 'Brand & Experience Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'REVENUE ANALYST', role: 'Financial Optimization Expert', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'SYSTEMS DIRECTOR', role: 'Operations Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'EXECUTIVE SUMMARY', role: 'Managing Director', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" }
  ]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  const cardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const finalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIdx = steps.findIndex(s => s.status === 'ANALYZING');
    if (activeIdx !== -1 && cardRefs[activeIdx].current) {
      cardRefs[activeIdx].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [steps]);

  const handleLaunch = async () => {
    if (!lead) {
      toast.error("Prospect selection required.");
      return;
    }
    setIsExecuting(true);
    setFinalResult(null);
    setSteps(prev => prev.map(s => ({ ...s, output: "", status: 'WAITING', currentRound: 1 })));
    
    try {
      const result = await executeGrowthBoardroom(lead, rounds, setSteps);
      setFinalResult(result);
      toast.success("Strategic Consensus Achieved.");
      setTimeout(() => finalRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto py-8 space-y-12 animate-in fade-in duration-700 pb-96 px-6">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-emerald-500/20 pb-8 gap-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
            GROWTH <span className="text-emerald-500 italic">ADVISORY</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em]">STRATEGIC REFINEMENT V1.7 // {lead ? `CLIENT: ${lead.businessName}` : 'AWAITING SELECTION'}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0b1021] p-5 rounded-[28px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">REFINEMENT CYCLES</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-emerald-400 text-[9px] font-black uppercase px-4 py-2 rounded-xl focus:border-emerald-500 cursor-pointer outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ROUNDS</option>)}
              </select>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">SELECT PROSPECT</span>
              <select 
                value={lead?.id || ''}
                onChange={(e) => onLockLead(e.target.value)}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-slate-300 text-[9px] font-black uppercase px-4 py-2 rounded-xl focus:border-emerald-500 cursor-pointer outline-none transition-all max-w-[180px] truncate"
              >
                <option value="">-- NO SELECTION --</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
              </select>
           </div>

           {!isExecuting && !finalResult ? (
             <button 
                onClick={handleLaunch} 
                disabled={!lead}
                className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all border-b-4 ${
                    lead ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 active:scale-95' : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed opacity-50'
                }`}
             >
               {lead ? 'CONVENE ADVISORY' : 'CLIENT REQUIRED'}
             </button>
           ) : (
             <button onClick={() => { setFinalResult(null); setSteps(prev => prev.map(s => ({ ...s, output: "", status: 'WAITING' }))); }} className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">NEW SESSION</button>
           )}
        </div>
      </div>

      <div className="space-y-8">
        {steps.map((step, i) => (
          <div key={i} ref={cardRefs[i]} className="w-full">
            <AgentNode step={step} />
          </div>
        ))}
      </div>

      {finalResult && (
        <div ref={finalRef} className="bg-white border-4 border-emerald-500/50 rounded-[64px] shadow-2xl p-20 animate-in slide-in-from-bottom-10 duration-1000">
           <div className="mb-16 border-b border-slate-200 pb-12 flex justify-between items-end">
             <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">DEFINITIVE <span className="text-emerald-600 italic">PLAN</span></h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">STRATEGIC MANIFEST // {lead?.businessName}</p>
             </div>
             <div className="text-right">
                <span className="px-6 py-2 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest">Verified Standard</span>
             </div>
           </div>
           <FormattedOutput content={finalResult} />
        </div>
      )}
    </div>
  );
};

const AgentNode = ({ step }: { step: BoardroomStep }) => {
    const isActive = step.status === 'ANALYZING';
    const isDone = step.status === 'COMPLETED';
    const isFailed = step.status === 'FAILED';

    return (
        <div className={`bg-[#0b1021] border-4 rounded-[48px] p-10 transition-all duration-700 relative overflow-hidden flex flex-col min-h-[400px] w-full ${
            isActive ? 'border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.15)] scale-[1.002] z-10' : 
            isDone ? 'border-slate-800 opacity-100 shadow-xl' : 
            isFailed ? 'border-rose-500/50 opacity-100' : 'border-slate-900 opacity-20'
          }`}>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{step.agentName}</h3>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">{step.role}</p>
               </div>
               <div className="flex flex-col items-end gap-2">
                 <div className={`px-6 py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>{step.status}</div>
                 {(isActive || isDone) && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">CYCLE {step.currentRound}</span>}
               </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-[#0b1021]/60 backdrop-blur-sm rounded-[32px]">
                     <div className="w-16 h-16 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] animate-pulse italic">Active Analysis...</p>
                   </div>
                )}
                <div className="h-full overflow-y-auto custom-scrollbar pr-8">
                    {step.output ? step.output.split('\n').filter(l => l.trim() !== '').map((line, idx) => {
                       const isHeading = line === line.toUpperCase() && line.length > 5;
                       
                       if (isHeading) {
                          return <h4 key={idx} className="text-lg font-black text-emerald-400 uppercase tracking-widest mt-8 mb-4">{line.trim()}</h4>;
                       }

                       return (
                         <p key={idx} className="text-[15px] text-slate-400 leading-relaxed font-sans border-l-2 border-emerald-500/10 pl-8 mb-6 italic">
                            {line.trim()}
                         </p>
                       );
                    }) : (
                      !isActive && <div className="h-full flex items-center justify-center text-slate-800 italic uppercase tracking-[0.4em] text-[10px]">Awaiting Signal...</div>
                    )}
                </div>
            </div>
        </div>
    );
};
