
import React, { useState, useEffect } from 'react';
import { generateAgencyIdentity } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

export const IdentityNode: React.FC = () => {
  const [niche, setNiche] = useState('AI Automation & Multi-Modal Content Studio');
  const [region, setRegion] = useState('Global Operations');
  const [identity, setIdentity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Persistence check
  useEffect(() => {
    const saved = localStorage.getItem('pomelli_agency_identity');
    if (saved) setIdentity(JSON.parse(saved));
  }, []);

  const handleForge = async () => {
    if (!niche || !region) {
      toast.error("Parameter violation: Sector and Territory required.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await generateAgencyIdentity(niche, region);
      setIdentity(data);
      localStorage.setItem('pomelli_agency_identity', JSON.stringify(data));
      toast.success("AGENCY IDENTITY MESH SYNCHRONIZED.");
    } catch (e: any) {
      console.error(e);
      toast.error(`FORGE FAILURE: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Permanently wipe current agency credentials?")) {
        setIdentity(null);
        localStorage.removeItem('pomelli_agency_identity');
        toast.info("IDENTITY NODE PURGED.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-16 animate-in fade-in duration-1000 pb-40">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Agency Credentials</span>
        </div>
        <h1 className="text-6xl font-black italic text-white uppercase tracking-tighter leading-none transition-all">AGENCY <span className="text-emerald-500 not-italic">IDENTITY</span></h1>
        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.7em] italic">Credentials & Brand Matrix Forge</p>
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[84px] p-24 shadow-2xl space-y-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
         
         {!identity && !isLoading && (
           <div className="space-y-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">CORE AGENCY NICHE</label>
                    <input 
                      value={niche} onChange={(e) => setNiche(e.target.value)}
                      className="w-full bg-[#020617] border-2 border-slate-800 rounded-3xl px-8 py-6 text-white text-lg font-bold focus:border-emerald-500 outline-none transition-all shadow-inner"
                      placeholder="e.g. AI Content Studio..."
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">OPERATIONAL THEATER</label>
                    <input 
                      value={region} onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#020617] border-2 border-slate-800 rounded-3xl px-8 py-6 text-white text-lg font-bold focus:border-emerald-500 outline-none transition-all shadow-inner"
                      placeholder="e.g. Global/Europe..."
                    />
                 </div>
              </div>
              <button 
                onClick={handleForge}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-8 rounded-[40px] text-[14px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 border-b-8 border-emerald-800"
              >
                INITIALIZE BRAND FORGE
              </button>
           </div>
         )}

         {isLoading && (
            <div className="py-40 flex flex-col items-center justify-center space-y-10">
               <div className="relative">
                  <div className="w-24 h-24 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🧬</div>
               </div>
               <div className="text-center space-y-3">
                   <p className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.4em] animate-pulse">Architecting Corporate Persona...</p>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">SYNTHESIZING MULTI-MODAL CREDENTIALS</p>
               </div>
            </div>
         )}

         {identity && !isLoading && (
           <div className="flex flex-col items-center text-center space-y-16 animate-in zoom-in-95 duration-1000 relative z-10">
              <div className="relative group">
                  <div className="w-56 h-56 bg-emerald-600 rounded-[64px] flex items-center justify-center text-white text-9xl font-black shadow-[0_0_100px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                     {identity.name?.charAt(0) || 'P'}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-slate-950 border-4 border-emerald-500 rounded-3xl flex items-center justify-center text-emerald-500 text-xl font-black shadow-2xl">OS</div>
              </div>
              
              <div className="space-y-6">
                 <h3 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-none">{identity.name}</h3>
                 <p className="text-2xl font-bold text-emerald-400 italic tracking-tight opacity-90 max-w-2xl mx-auto leading-relaxed">"{identity.tagline}"</p>
              </div>

              <div className="bg-slate-950/80 border-2 border-slate-800 p-16 rounded-[64px] w-full shadow-inner relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
                 <p className="text-xl font-medium text-slate-300 leading-relaxed italic font-serif">
                   {identity.manifesto}
                 </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
                 {identity.colors?.map((c: string, i: number) => (
                   <div key={i} className="space-y-4 group">
                      <div className="h-24 w-full rounded-3xl border-2 border-white/5 shadow-2xl transition-transform group-hover:scale-105" style={{ backgroundColor: c }}></div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[11px] font-black text-slate-500 font-mono uppercase">{c}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-emerald-500 transition-colors"></div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="flex flex-col md:flex-row gap-8 w-full pt-16 border-t-2 border-slate-800">
                  <button className="flex-1 py-6 bg-slate-900 hover:bg-slate-800 rounded-3xl border-2 border-slate-800 text-[11px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] transition-all shadow-xl">EXPORT BRAND PACKAGE</button>
                  <button onClick={handleReset} className="flex-1 py-6 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-3xl border-2 border-rose-600/20 text-[11px] font-black uppercase tracking-[0.3em] transition-all">RESET CREDENTIALS</button>
              </div>
           </div>
         )}
      </div>
      
      <div className="bg-slate-950/40 border-4 border-slate-800 border-dashed rounded-[64px] p-20 text-center space-y-6">
         <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.6em] leading-relaxed max-w-3xl mx-auto italic">
           IDENTITIES SYNTHESIZED IN THIS HUB ARE AUTOMATICALLY PROPAGATED ACROSS ALL OUTREACH CHANNELS AND PROPOSAL BLUEPRINTS.
         </p>
         <div className="flex justify-center gap-10 opacity-30">
            {['ENCRYPTION_AES_256', 'STATE_LOCKED', 'VERSION_3.2.0'].map(t => <span key={t} className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">{t}</span>)}
         </div>
      </div>
    </div>
  );
};
