
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { toast } from '../../services/toastManager';
import { SonicStudioPlayer } from './SonicStudioPlayer';
import { SonicPromptGuide } from './SonicPromptGuide';
import { saveAsset, SESSION_ASSETS } from '../../services/geminiService';

interface SonicStudioProps {
  lead?: Lead;
}

export const SonicStudio: React.FC<SonicStudioProps> = ({ lead }) => {
  const [prompt, setPrompt] = useState(`Background music for ${lead?.businessName || 'Island Blue Cyprus'}. Professional, high-quality, engaging, suitable for commercial use...`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Controls
  const [duration, setDuration] = useState('30S');
  const [mode, setMode] = useState('INSTRUMENTAL');
  const [exportFormat, setExportFormat] = useState<'MP3' | 'WAV'>('MP3');
  
  // Filtering
  const [selectedIndustry, setSelectedIndustry] = useState('TECH / SAAS');
  const [selectedGenre, setSelectedGenre] = useState('CINEMATIC');
  const [selectedAtmosphere, setSelectedAtmosphere] = useState('UPLIFTING');

  const industries = [
    { id: 'TECH / SAAS', icon: '⚙️' },
    { id: 'LUXURY ESTATE', icon: '🏢' },
    { id: 'MODERN CLINIC', icon: '🏥' },
    { id: 'HIGH PERFORMANCE', icon: '⚡' },
    { id: 'DEEP FOCUS', icon: '🧘' },
    { id: 'CINEMATIC EPIC', icon: '🎬' }
  ];

  const genres = ['CINEMATIC', 'ELECTRONIC', 'ROCK', 'HIP HOP', 'JAZZ', 'AMBIENT', 'CORPORATE', 'POP', 'SYNTHWAVE', 'LO-FI'];
  const atmospheres = ['UPLIFTING', 'MELANCHOLIC', 'ENERGETIC', 'RELAXING', 'SUSPENSEFUL'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.neural("SONIC_CORE: Synthesizing Audio Waveform...");
    setTimeout(() => {
        const audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        saveAsset('AUDIO', `SONIC: ${lead?.businessName || 'Commercial'}`, audioUrl, 'SONIC_STUDIO', lead?.id, { 
            duration, mode, format: exportFormat, industry: selectedIndustry 
        });
        toast.success("SONIC_CORE: Track Generated Successfully.");
        setIsGenerating(false);
    }, 4000);
  };

  const audioAssets = SESSION_ASSETS.filter(a => a.type === 'AUDIO');

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in duration-700 h-full flex flex-col space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-[#0b1021] p-6 border border-slate-800 rounded-3xl shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">S</div>
             <div>
                <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">SONIC <span className="text-emerald-500">STUDIO</span></h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Multi-Vector Audio Architecture Core</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">SIGNAL_STRENGTH: 0x88FF</span>
             </div>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT PANEL: PRESETS */}
        <div className="col-span-3 bg-[#0b1021] border border-slate-800 rounded-[40px] p-8 flex flex-col gap-10 overflow-y-auto no-scrollbar">
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                 INDUSTRY PRESETS
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 {industries.map(ind => (
                   <button 
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${selectedIndustry === ind.id ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                   >
                     <span className="text-xl">{ind.icon}</span>
                     <span className="text-[8px] font-black uppercase text-center leading-tight">{ind.id}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">GENRE DEFINITION</h3>
              <div className="flex flex-wrap gap-2">
                 {genres.map(g => (
                   <button 
                    key={g} 
                    onClick={() => setSelectedGenre(g)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedGenre === g ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'}`}
                   >
                     {g}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ATMOSPHERE</h3>
              <div className="flex flex-col gap-2">
                 {atmospheres.map(a => (
                   <button 
                    key={a}
                    onClick={() => setSelectedAtmosphere(a)}
                    className={`w-full py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest border text-left flex justify-between items-center transition-all ${selectedAtmosphere === a ? 'bg-slate-900 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}
                   >
                     {a}
                     {selectedAtmosphere === a && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* CENTER PANEL: PLAYER & GALLERY */}
        <div className="col-span-6 flex flex-col gap-6 overflow-hidden">
           <div className="flex-1 bg-[#0b1021] border border-slate-800 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col">
              <SonicStudioPlayer assets={audioAssets} />
           </div>
        </div>

        {/* RIGHT PANEL: CONFIGURATION */}
        <div className="col-span-3 bg-[#0b1021] border border-slate-800 rounded-[40px] p-8 flex flex-col gap-8 overflow-y-auto no-scrollbar">
           
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">SONIC PROMPT</h3>
                 <button onClick={() => setShowGuide(true)} className="text-[9px] font-black text-indigo-400 hover:text-white flex items-center gap-1 transition-colors uppercase">
                    ⚡ MAGIC WAND
                 </button>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-3xl p-6 text-sm font-medium text-slate-300 h-48 resize-none focus:border-emerald-500 outline-none shadow-inner custom-scrollbar"
              />
           </div>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">CONFIGURATION</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-600 uppercase">DURATION</label>
                    <div className="flex bg-[#020617] border border-slate-800 rounded-xl p-1">
                       {['30S', '60S'].map(d => (
                         <button key={d} onClick={() => setDuration(d)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${duration === d ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>{d}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-600 uppercase">MODE</label>
                    <button onClick={() => setMode(m => m === 'VOCAL' ? 'INSTRUMENTAL' : 'VOCAL')} className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-inner">
                       {mode}
                    </button>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-600 uppercase">EXPORT FORMAT</label>
                 <div className="flex gap-2">
                    {(['MP3', 'WAV'] as const).map(f => (
                      <button key={f} onClick={() => setExportFormat(f)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${exportFormat === f ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'}`}>{f}</button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">COVER ART</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500 group transition-all">
                    <span className="text-slate-400 group-hover:text-indigo-400 uppercase text-[9px] font-black">AI COVER</span>
                    <span className="text-[8px] text-slate-600 uppercase">Create Art</span>
                 </button>
                 <button className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500 group transition-all">
                    <span className="text-emerald-500 uppercase text-[9px] font-black">UPLOAD</span>
                    <span className="text-[8px] text-slate-600 uppercase">Custom</span>
                 </button>
              </div>
           </div>

           <div className="mt-auto">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-6 rounded-[32px] text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 transition-all"
              >
                {isGenerating ? 'SYNTHESIZING...' : 'GENERATE SONIC PAYLOAD'}
              </button>
           </div>
        </div>

      </div>

      {showGuide && <SonicPromptGuide onClose={() => setShowGuide(false)} onSelect={(t) => { setPrompt(t); setShowGuide(false); }} />}
    </div>
  );
};
