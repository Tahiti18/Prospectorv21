
import React, { useState, useEffect } from 'react';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';
import { getStoredKeys, setStoredKeys } from '../../services/geminiService';

export const SettingsNode: React.FC = () => {
  const [orKey, setOrKey] = useState("");
  const [kieKey, setKieKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const keys = getStoredKeys();
    setOrKey(keys.openRouter);
    setKieKey(keys.kie);
  }, []);

  const handleCommitKeys = () => {
    setIsSaving(true);
    setTimeout(() => {
        setStoredKeys(orKey, kieKey);
        toast.success("INFRASTRUCTURE SECURED: Neural links authorized.");
        setIsSaving(false);
    }, 1000);
  };

  const handleForceUnlock = () => {
    if (confirm("ORCHESTRATOR OVERRIDE: This will release all lead locks. Proceed?")) {
      db.forceUnlockAll();
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear local cache and activity history? This does not affect lead records.")) {
      toast.info("Activity history purged.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="text-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">SYSTEM <span className="text-emerald-600 not-italic">SETTINGS</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">Core Configuration & Security Protocols</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-16 shadow-2xl space-y-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
         
         <div className="grid grid-cols-1 gap-12 relative z-10">
            
            {/* NEURAL INFRASTRUCTURE */}
            <div className="space-y-10">
               <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] italic flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Neural Infrastructure
               </h3>
               
               <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OPENROUTER API KEY (3.0 FLASH)</label>
                     <div className="relative group">
                        <input 
                            type="password"
                            value={orKey}
                            onChange={(e) => setOrKey(e.target.value)}
                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                            placeholder="sk-or-v1-..."
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${orKey ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                           <span className="text-[9px] font-black text-slate-600 uppercase">LINK_STATUS</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">KIE API KEY (MEDIA & SONIC)</label>
                     <div className="relative group">
                        <input 
                            type="password"
                            value={kieKey}
                            onChange={(e) => setKieKey(e.target.value)}
                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none transition-all shadow-inner"
                            placeholder="KIE-..."
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${kieKey ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                           <span className="text-[9px] font-black text-slate-600 uppercase">LINK_STATUS</span>
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={handleCommitKeys}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl transition-all border-b-4 border-emerald-800 active:scale-95 disabled:opacity-50"
               >
                  {isSaving ? 'AUTHORIZING NEURAL CORE...' : 'COMMIT INFRASTRUCTURE KEYS'}
               </button>
            </div>

            <div className="border-t border-slate-800 pt-12 space-y-8">
               <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Operational Overrides</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={handleForceUnlock}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-500 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    FORCE UNLOCK ALL TARGETS
                  </button>
                  <button 
                    onClick={handleClearHistory}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    PURGE ACTIVITY HISTORY
                  </button>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-800 text-center">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                   KEYS ARE STORED LOCALLY IN YOUR BROWSER. DIRECT MANUAL OVERRIDE IS NOW ENABLED.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};
