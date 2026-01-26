import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { executeNeuralBoardroom, BoardroomStep } from '../../services/ghlArchitectService';
import { ghlAutoBuilder } from '../../services/ghlAutoBuilderService';
import { FormattedOutput } from '../common/FormattedOutput';
import { toast } from '../../services/toastManager';
import { db } from '../../services/automation/db';

interface GHLArchitectProps {
  lead?: Lead;
  leads: Lead[];
  onLockLead: (id: string) => void;
}

export const GHLArchitect: React.FC<GHLArchitectProps> = ({ lead, leads, onLockLead }) => {
  const [steps, setSteps] = useState<BoardroomStep[]>([
    { agentName: 'PLANNER', role: 'Architectural Strategist', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Compliance & Risk Auditor', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'ENGINEER', role: 'Workflow & Logic Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis Executive', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResultRaw, setFinalResultRaw] = useState<string | null>(null);
  const [uiContent, setUiContent] = useState<any>(null);
  const [techBlueprint, setTechBlueprint] = useState<any>(null);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAuth, setIsAuth] = useState(!!db.getGHLCreds());

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
    setFinalResultRaw(null);
    setUiContent(null);
    setTechBlueprint(null);
    setBuildLogs([]);
    try {
      const result = await executeNeuralBoardroom(lead, 1, setSteps);
      const parsed = JSON.parse(result);
      
      setFinalResultRaw(result);
      setUiContent(parsed.ui_blocks);
      setTechBlueprint(parsed.technical_blueprint);
      
      toast.success("INDIGO CONSENSUS ACHIEVED.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDryRun = async () => {
    if (!techBlueprint) return;
    try {
       const logs = await ghlAutoBuilder.dryRun(techBlueprint);
       setBuildLogs(logs);
       toast.info("GHL SIMULATION COMPLETE.");
    } catch (e: any) {
       toast.error(e.message);
    }
  };

  const handleExecuteBuild = async () => {
    if (!techBlueprint) return;
    setIsBuilding(true);
    try {
       await ghlAutoBuilder.executeBuild(techBlueprint, (msg) => {
         setBuildLogs(prev => [...prev, `[BUILD] ${msg}`]);
       });
       toast.success("GHL SUB-ACCOUNT PROVISIONED.");
    } catch (e: any) {
       toast.error(e.message);
    } finally {
       setIsBuilding(false);
    }
  };

  const handleMockAuth = async () => {
     await ghlAutoBuilder.authorizeLocation('mock_code_789');
     setIsAuth(true);
     toast.success("GHL LOCATION NODE AUTHORIZED.");
  };

  return (
    <div className="max-w-[1700px] mx-auto py-12 space-y-16 animate-in fade-in duration-700 pb-96 px-6">
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-emerald-500/20 pb-12 gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
            INDIGO <span className="text-emerald-500 not-italic">GHL PLANNER</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] italic">Neural Boardroom Engine v1.0 // {lead ? `Target: ${lead.businessName}` : 'AWAITING TARGET SELECTION'}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-[#0b1021] p-6 rounded-[32px] border border-slate-800 shadow-2xl">
           {!isAuth && (
             <button onClick={handleMockAuth} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">LINK GHL LOCATION</button>
           )}
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

           {!isExecuting && !uiContent ? (
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
             <button onClick={() => { setUiContent(null); setTechBlueprint(null); setBuildLogs([]); }} className="px-10 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">RE-INITIALIZE</button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {steps.slice(0, 2).map((step, i) => (
          <div key={i} ref={cardRefs[i]}><AgentNode step={step} isLarge={true} /></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.slice(2, 4).map((step, i) => (
          <div key={i+2} ref={cardRefs[i+2]}><AgentNode step={step} isLarge={false} /></div>
        ))}
      </div>

      {uiContent && (
        <div ref={finalRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-20 duration-1000">
           {/* LEFT: VISUAL SCHEMATIC */}
           <div className="lg:col-span-8 bg-black border-4 border-emerald-500/50 rounded-[64px] shadow-2xl p-20 relative overflow-hidden">
              <div className="mb-16 border-b border-slate-800 pb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">GHL MASTER <span className="text-emerald-500">SCHEMATIC</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">VISUAL DEPLOYMENT PREVIEW // {techBlueprint?.meta?.target_business}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">PLAN_HASH</p>
                    <code className="text-[10px] font-black text-emerald-500/60 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10 italic">{techBlueprint?.meta?.plan_hash}</code>
                </div>
              </div>
              <FormattedOutput content={JSON.stringify(uiContent)} />
           </div>

           {/* RIGHT: AUTO-BUILDER CONSOLE */}
           <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-10 shadow-2xl space-y-8 flex flex-col">
                 <div className="space-y-2">
                    <h3 className="text-lg font-black italic text-white uppercase tracking-widest">BUILDER <span className="text-emerald-500">CORE</span></h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em]">MODE 3: AUTOMATED EXECUTION</p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <button 
                       onClick={handleDryRun}
                       className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                       EXECUTE DRY-RUN
                    </button>
                    <button 
                       onClick={handleExecuteBuild}
                       disabled={!isAuth || isBuilding}
                       className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl border-b-4 border-emerald-800 active:scale-95 disabled:opacity-30"
                    >
                       {isBuilding ? 'DEPLOYING...' : 'INITIALIZE AUTO-BUILD'}
                    </button>
                 </div>

                 <div className="flex-1 bg-black border border-slate-800 rounded-3xl p-6 font-mono text-[10px] h-[500px] overflow-y-auto custom-scrollbar space-y-2 shadow-inner">
                    {buildLogs.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-slate-800 italic uppercase">Awaiting Action Node...</div>
                    ) : (
                       buildLogs.map((log, i) => (
                          <div key={i} className={`pb-2 border-b border-white/5 last:border-0 ${log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-rose-400' : 'text-slate-500'}`}>
                             {log}
                          </div>
                       ))
                    )}
                 </div>
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
            isDone ? 'border-slate-800 opacity-100' : 
            isFailed ? 'border-rose-500/50 opacity-100' : 'border-slate-900 opacity-20'
          } ${isLarge ? 'min-h-[600px]' : 'min-h-[400px]'}`}>
            <div className="flex justify-between items-start mb-12 relative z-10">
               <div className="space-y-2">
                  <h3 className={`font-black italic text-white uppercase tracking-tighter ${isLarge ? 'text-3xl' : 'text-xl'}`}>{step.agentName}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">{step.role}</p>
               </div>
               <div className={`px-6 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>{step.status}</div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {isActive && <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6"><div className="w-16 h-16 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div><p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] animate-pulse">THINKING...</p></div>}
                {step.output && (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-6">
                        {step.output.split('\n').filter(l => l.trim() !== '').map((line, idx) => (
                           <p key={idx} className="text-[13px] text-slate-400 leading-relaxed font-sans border-l border-slate-800 pl-4">{line.trim()}</p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
