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
    // Reset outputs for new session
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
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-emerald-500/20 pb-12 gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
            GROWTH <span className="text-emerald-500 not-italic">BOARDROOM</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.7em] italic">Layman Strategic Refinement v1.4 // {lead ? `Client: ${lead.businessName}` : 'AWAITING CLIENT SELECTION'}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[#0b1021] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">DEBATE ROUNDS</span>
              <select 
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-emerald-400 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-emerald-500 cursor-pointer outline-none transition-all"
              >
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} CYCLES PER AGENT</option>)}
              </select>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">SELECT TARGET</span>
              <select 
                value={lead?.id || ''}
                onChange={(e) => onLockLead(e.target.value)}
                disabled={isExecuting}
                className="bg-black border border-slate-800 text-slate-300 text-[10px] font-black uppercase px-6 py-3 rounded-2xl focus:border-emerald-500 cursor-pointer outline-none transition-all max-w-[200px] truncate"
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
                    lead ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 active:scale-95' : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed opacity-50'
                }`}
             >
               {lead ? 'START DEBATE' : 'CLIENT REQUIRED'}
             </button>
           ) : (
             <button onClick={() => { setFinalResult(null); setSteps(prev => prev.map(s => ({ ...s, output: "", status: 'WAITING' }))); }} className="px-10 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">NEW SESSION</button>
           )}
        </div>
      </div>

      {/* FULL WIDTH STACKED AGENTS */}
      <div className="space-y-12">
        {steps.map((step, i) => (
          <div key={i} ref={cardRefs[i]} className="w-full">
            <AgentNode step={step} />
          </div>
        ))}
      </div>

      {finalResult && (
        <div ref={finalRef} className="bg-white border-4 border-emerald-500/50 rounded-[84px] shadow-2xl p-24 animate-in slide-in-from-bottom-20 duration-1000">
           <div className="mb-20 border-b border-slate-200 pb-16 flex justify-between items-end">
             <div>
                <h2 className="text-4xl font-black italic text-slate-900 uppercase tracking-tighter leading-none mb-4">DEFINITIVE <span className="text-emerald-600">SCHEMATIC</span></h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.8em]">STRATEGIC MANIFEST // {lead?.businessName}</p>
             </div>
             <div className="text-right">
                <span className="px-8 py-3 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Certified Layman Standard</span>
             </div>
           </div>
           
           <FormattedOutput content={finalResult} />
        </div>
      )}
    </div>
  );
};

const AgentNode = ({ step }: { step: BoardroomStep }) => {
    const isActive = step.status === 'THINKING';
    const isDone = step.status === 'COMPLETED';
    const isFailed = step.status === 'FAILED';

    return (
        <div className={`bg-[#0b1021] border-4 rounded-[64px] p-16 transition-all duration-1000 relative overflow-hidden flex flex-col min-h-[500px] ${
            isActive ? 'border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.2)] scale-[1.005] z-10' : 
            isDone ? 'border-slate-800 opacity-100 shadow-2xl' : 
            isFailed ? 'border-rose-500/50 opacity-100' : 'border-slate-900 opacity-20'
          }`}>
            
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[200px] font-black italic select-none pointer-events-none">
              {step.agentName.slice(0, 1)}
            </div>

            <div className="flex justify-between items-start mb-16 relative z-10">
               <div className="space-y-4">
                  <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{step.agentName}</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">{step.role}</p>
               </div>
               <div className="flex flex-col items-end gap-3">
                 <div className={`px-10 py-3 rounded-2xl border-2 text-[11px] font-black uppercase tracking-[0.3em] ${isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>{step.status}</div>
                 {(isActive || isDone) && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">ROUND {step.currentRound} STATUS</span>}
               </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-[#0b1021]/90 backdrop-blur-sm rounded-[40px]">
                     <div className="w-20 h-20 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                     <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.8em] animate-pulse italic">PROCESSING ROUND {step.currentRound}...</p>
                   </div>
                )}
                <div className="h-full overflow-y-auto custom-scrollbar pr-10">
                    {step.output ? step.output.split('\n').filter(l => l.trim() !== '').map((line, idx) => {
                       const isRoundHeader = line.startsWith('ROUND');
                       const isHeading = line === line.toUpperCase() && line.length > 5;
                       
                       if (isRoundHeader) {
                          return <div key={idx} className="mt-12 mb-6 border-b border-slate-800 pb-2"><p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em]">{line.trim()}</p></div>;
                       }
                       
                       if (isHeading) {
                          return <h4 key={idx} className="text-lg font-black text-emerald-400 uppercase tracking-widest mt-8 mb-4">{line.trim()}</h4>;
                       }

                       return (
                         <p key={idx} className="text-[16px] text-slate-400 leading-relaxed font-sans border-l-2 border-emerald-500/10 pl-8 mb-6">
                            {line.trim()}
                         </p>
                       );
                    }) : (
                      !isActive && <div className="h-full flex items-center justify-center text-slate-800 italic uppercase tracking-[0.5em] text-sm">Sequence Initiating...</div>
                    )}
                </div>
            </div>
        </div>
    );
};
