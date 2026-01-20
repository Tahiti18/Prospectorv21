
import React, { useState, useEffect } from 'react';
import { toast } from '../../services/toastManager';

export const SystemConfig: React.FC = () => {
  const [protocol, setProtocol] = useState(() => localStorage.getItem('pomelli_protocol_id') || 'PROSPECT_CORE_V15_FINAL');
  const [model, setModel] = useState(() => localStorage.getItem('pomelli_neural_engine') || 'gemini-3-flash-preview');
  const [latencyMode, setLatencyMode] = useState<'LOW' | 'HIGH'>(() => (localStorage.getItem('pomelli_latency') as any) || 'LOW');

  useEffect(() => {
    localStorage.setItem('pomelli_protocol_id', protocol);
    localStorage.setItem('pomelli_neural_engine', model);
    localStorage.setItem('pomelli_latency', latencyMode);
  }, [protocol, model, latencyMode]);

  const handleSave = () => {
    toast.success("SYSTEM PARAMETERS COMMITTED TO FORGE.");
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 space-y-16 animate-in fade-in duration-500 pb-60">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Core Technical Configuration</span>
        </div>
        <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none transition-all">CORE <span className="text-emerald-500">CONFIG</span></h1>
        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.7em] italic">Meta-Operational Protocol Parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Directives */}
        <div className="lg:col-span-8 bg-[#0b1021] border-2 border-slate-800 rounded-[72px] p-20 shadow-2xl space-y-16 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
           
           <div className="space-y-12 relative z-10">
              <div className="space-y-4">
                 <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">OPERATIONAL PROTOCOL ID</label>
                 <input 
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full bg-[#020617] border-2 border-slate-800 rounded-[40px] px-10 py-8 text-emerald-400 font-black text-3xl focus:border-emerald-500 outline-none transition-all uppercase italic tracking-tighter shadow-inner"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">NEURAL ENGINE</label>
                    <div className="relative group">
                        <select 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-[#020617] border-2 border-slate-800 rounded-[32px] px-8 py-6 text-white text-[12px] font-black uppercase tracking-widest focus:border-emerald-500 outline-none cursor-pointer appearance-none group-hover:border-slate-600 transition-colors"
                        >
                        <option value="gemini-3-flash-preview">GEMINI 3 FLASH (OPTIMAL)</option>
                        <option value="gemini-3-pro-preview">GEMINI 3 PRO (REASONING)</option>
                        <option value="gemini-2.5-flash-image">GEMINI 2.5 VISION</option>
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">▼</div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">INFERENCE LATENCY</label>
                    <div className="flex bg-[#020617] rounded-[32px] p-2 border-2 border-slate-800 h-[76px]">
                       {[
                         { id: 'LOW', label: 'ECO_FLASH' },
                         { id: 'HIGH', label: 'HI_FIDELITY' }
                       ].map(m => (
                         <button 
                           key={m.id} 
                           onClick={() => setLatencyMode(m.id as any)}
                           className={`flex-1 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${latencyMode === m.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}
                         >
                           {m.label}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t-2 border-slate-800">
                 <button 
                   onClick={handleSave}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-8 rounded-[40px] text-[14px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl shadow-emerald-600/30 active:scale-95 border-b-8 border-emerald-800"
                 >
                   COMMIT SYSTEM PARAMETERS
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column: Live Telemetry */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[56px] p-12 shadow-2xl space-y-10">
              <h3 className="text-sm font-black italic text-white uppercase tracking-widest border-b-2 border-slate-800 pb-6 flex items-center justify-between">
                 LIVE TELEMETRY
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </h3>
              <div className="space-y-10">
                 {[
                   { l: 'Core Temp', v: 'OPTIMAL', c: 'text-emerald-400' },
                   { l: 'Encryption', v: 'AES_256', c: 'text-emerald-400' },
                   { l: 'Buffer Depth', v: '0x88FF', c: 'text-emerald-500' },
                   { l: 'Uptime', v: '99.99%', c: 'text-emerald-500' },
                   { l: 'Last Sync', v: new Date().toLocaleTimeString(), c: 'text-slate-500' }
                 ].map((d, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">{d.l}</span>
                      <span className={`text-[11px] font-black uppercase italic tracking-widest ${d.c}`}>{d.v}</span>
                   </div>
                 ))}
              </div>
              <div className="pt-10 border-t-2 border-slate-800/50">
                 <div className="p-8 bg-slate-900/50 rounded-[32px] border-2 border-slate-800 flex items-center justify-between shadow-inner">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SYSTEM STATUS</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-black text-emerald-500 uppercase italic">READY_FOR_ENGAGEMENT</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
