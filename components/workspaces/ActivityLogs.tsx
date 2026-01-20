
/* =========================================================
   ACTIVITY LOGS – SYSTEM TRACE CONSOLE
   ========================================================= */

import React, { useState, useEffect, useRef } from 'react';
import { subscribeToLogs } from '../../services/geminiService';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToLogs(setLogs);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0; // Keep newest at top for Zenith UI
  }, [logs]);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">ACTIVITY <span className="text-emerald-500 not-italic">TRACE</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Real-Time Operational Buffer Console</p>
        </div>
      </div>

      <div className="bg-black border border-slate-800 rounded-[48px] p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
         <div className="flex justify-between items-center mb-6 px-4">
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 opacity-50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500 opacity-50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-50"></div>
            </div>
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">CONSOLE_V15_TRACE</div>
         </div>

         <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-[32px] p-10 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2.5 shadow-inner">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-800 italic uppercase">
                <p className="animate-pulse">Awaiting Operative Handshake...</p>
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex gap-6 group hover:bg-emerald-500/5 py-1 px-3 rounded-lg transition-all border-l-2 border-transparent hover:border-emerald-500">
                   <span className="text-slate-800 font-black select-none opacity-40 group-hover:opacity-100 group-hover:text-emerald-900">{String(logs.length - i).padStart(4, '0')}</span>
                   <span className={`transition-colors truncate ${l.includes('NEURAL_FAULT') ? 'text-rose-500' : l.includes('COMPLETE') || l.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-200'}`}>
                      {l}
                   </span>
                </div>
              ))
            )}
            <div ref={scrollRef}></div>
         </div>
         
         <div className="mt-6 flex justify-between items-center px-4">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">0x88FF_TERMINAL_SYNC</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">TERMINAL_ACTIVE</span>
         </div>
      </div>
    </div>
  );
};
