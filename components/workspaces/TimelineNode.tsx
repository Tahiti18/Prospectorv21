
/* =========================================================
   CHRONOS TIMELINE – OPERATIONAL EVENT STREAM
   ========================================================= */

import React, { useState, useEffect } from 'react';
import { subscribeToLogs } from '../../services/geminiService';

export const TimelineNode: React.FC = () => {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToLogs(setEvents);
    return () => unsub();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">OPERATIONAL <span className="text-emerald-500 not-italic">TIMELINE</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.8em] mt-2 italic">Historical Event Sequence // Chronos Node</p>
        </div>
        <div className="bg-emerald-600/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE_CAPTURE_ON</span>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
         <div className="absolute top-0 left-0 w-1 h-full bg-slate-800/30 ml-20"></div>
         
         <div className="flex-1 space-y-10 relative z-10 overflow-y-auto custom-scrollbar pr-4">
            {events.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-6">
                  <span className="text-7xl">🕰️</span>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">No Temporal Data Recorded</p>
               </div>
            ) : (
               events.map((e, i) => {
                 const [time, ...msgParts] = e.split('] ');
                 const msg = msgParts.join('] ');
                 const isError = msg.includes('FAULT') || msg.includes('ERROR');
                 const isSuccess = msg.includes('SUCCESS') || msg.includes('COMPLETE');

                 return (
                   <div key={i} className="flex gap-14 group animate-in slide-in-from-left-4 duration-500">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center relative z-20 group-hover:border-emerald-500 transition-all shrink-0 group-hover:rotate-12 group-hover:scale-110 shadow-xl">
                         <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : isSuccess ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]'}`}></div>
                      </div>
                      <div className={`flex-1 p-8 rounded-[32px] border transition-all ${isError ? 'bg-rose-950/10 border-rose-500/20' : isSuccess ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-slate-900/40 border-slate-800/80 group-hover:border-emerald-500/30'}`}>
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest uppercase">{time.replace('[', '')}</span>
                            <span className={`text-[8px] font-black px-3 py-1 rounded-full border ${isError ? 'text-rose-400 border-rose-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>
                              {isError ? 'ALERT' : isSuccess ? 'SUCCEEDED' : 'LOGGED'}
                            </span>
                         </div>
                         <p className="text-[12px] text-slate-200 font-bold uppercase tracking-wide font-mono leading-relaxed group-hover:text-white transition-colors">{msg}</p>
                      </div>
                   </div>
                 );
               })
            )}
         </div>
         
         <div className="absolute bottom-8 left-10 text-[9px] font-black text-slate-800 uppercase tracking-widest pointer-events-none select-none">SYSTEM_CHRONOS_V3.2</div>
      </div>
    </div>
  );
};
