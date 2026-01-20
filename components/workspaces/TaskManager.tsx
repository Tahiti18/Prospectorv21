
/* =========================================================
   TASK MANAGER – ACTIONABLE MILESTONE SUITE
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { generateTaskMatrix } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface TaskManagerProps {
  lead?: Lead;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ lead }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      if (lead) {
        const data = await generateTaskMatrix(lead);
        setTasks(data);
      } else {
        // High-fidelity fallback for general readiness
        setTasks([
          { id: 't1', task: 'Synchronize Lead Ledger with Regional Node', status: 'complete' },
          { id: 't2', task: 'Establish 4K Visual Branding Directives', status: 'pending' },
          { id: 't3', task: 'Deploy Neural Scribe for Multi-Channel Outreach', status: 'pending' },
          { id: 't4', task: 'Audit Market Density via Heatmap Utility', status: 'pending' },
          { id: 't5', task: 'Initiate Strategic Forge on Primary Target', status: 'pending' }
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Task Engine Uplink Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [lead?.id]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'complete' : 'pending' } : t));
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">ACTION <span className="text-emerald-500 not-italic">ITEMS</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">
            {lead ? `Mission Roadmap for ${lead.businessName}` : 'Global Agency Readiness Checklist'}
          </p>
        </div>
        <button 
          onClick={loadTasks}
          className="px-6 py-2 bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-400 hover:text-white rounded-xl uppercase tracking-widest transition-all"
        >
          RE-SYNC TASKS
        </button>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-12 shadow-2xl relative min-h-[500px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
             <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] animate-pulse italic">Crystallizing Mission Objective Matrix...</p>
          </div>
        ) : (
          <div className="space-y-4">
             {tasks.map((t, i) => (
               <div 
                key={t.id} 
                onClick={() => toggleTask(t.id)}
                className={`p-8 rounded-[32px] border cursor-pointer transition-all flex items-center justify-between group ${
                  t.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/40'
                }`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${
                       t.status === 'complete' ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-800 group-hover:border-emerald-500'
                     }`}>
                        {t.status === 'complete' ? <span className="text-white text-xs">✓</span> : <span className="text-slate-800 text-xs">{i+1}</span>}
                     </div>
                     <span className={`text-[13px] font-black italic uppercase tracking-tight ${t.status === 'complete' ? 'text-slate-600 line-through' : 'text-slate-200 group-hover:text-emerald-400'}`}>
                        {t.task}
                     </span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${t.status === 'complete' ? 'text-emerald-500' : 'text-slate-700'}`}>{t.status.toUpperCase()}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
