
import React, { useState, useRef, useEffect } from 'react';
import { AssetRecord } from '../../services/geminiService';

interface SonicStudioPlayerProps {
  assets: AssetRecord[];
}

export const SonicStudioPlayer: React.FC<SonicStudioPlayerProps> = ({ assets }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentAsset = assets[currentIndex] || { title: 'NO TRACK SELECTED', data: '' };

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
        else audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col h-full">
        {/* PLAYER CANVAS */}
        <div className="p-12 space-y-12 relative flex-none">
            <div className="flex items-center gap-12">
                <div className="w-56 h-56 rounded-[40px] bg-slate-900 border-4 border-slate-800 shadow-2xl relative overflow-hidden shrink-0 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform">🎵</div>
                </div>

                <div className="flex-1 space-y-8 min-w-0">
                    <div className="space-y-3">
                        <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter truncate">{currentAsset.title}</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">SONIC STUDIO // 10/01/2026</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                    </div>

                    {/* FREQ ANALYZER BARS */}
                    <div className="h-24 flex items-end justify-between gap-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-2 left-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">FREQ ANALYZER</div>
                        {[...Array(32)].map((_, i) => (
                           <div 
                             key={i} 
                             className={`w-2 rounded-full transition-all duration-200 ${isPlaying ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}
                             style={{ height: isPlaying ? `${Math.random() * 80 + 20}%` : '10%' }}
                           ></div>
                        ))}
                    </div>

                    {/* STEMS CONTROL */}
                    <div className="flex gap-4 p-2 bg-slate-950 border border-slate-800 rounded-2xl inline-flex">
                        {['DRUMS', 'BASS', 'VOCALS', 'OTHER'].map(s => (
                            <button key={s} className="px-6 py-2 rounded-xl text-[9px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest">{s}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TRANSPORT CONTROLS */}
            <div className="space-y-6">
                <div className="relative h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden cursor-pointer group">
                    <div className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex items-center justify-center gap-12">
                    <button className="text-slate-600 hover:text-white transition-colors"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[28px] shadow-2xl shadow-emerald-600/30 flex items-center justify-center active:scale-90 transition-all border-b-4 border-emerald-800"
                    >
                        {isPlaying ? <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                    </button>
                    <button className="text-slate-600 hover:text-white transition-colors"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
                </div>
            </div>
        </div>

        {/* GALLERY SECTION */}
        <div className="flex-1 bg-[#05091a] p-10 border-t border-slate-800 overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">ASSET GALLERY</h4>
                <div className="flex gap-4">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{assets.length} AUDIO</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">0 VISUAL</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {assets.map((a, i) => (
                    <div 
                        key={a.id}
                        onClick={() => { setCurrentIndex(i); setIsPlaying(true); }}
                        className={`aspect-square rounded-3xl p-1 transition-all cursor-pointer border-2 ${currentIndex === i ? 'border-emerald-500 bg-emerald-600/10' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                        <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center p-4 text-center group">
                            <span className="text-3xl mb-3 transition-transform group-hover:scale-110">🎵</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight truncate w-full">{a.title}</span>
                        </div>
                    </div>
                ))}
                {assets.length === 0 && (
                    <div className="col-span-4 py-20 text-center opacity-10 flex flex-col items-center gap-4">
                        <span className="text-5xl">🎧</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Audio Generated</p>
                    </div>
                )}
            </div>
        </div>

        <audio ref={audioRef} src={currentAsset.data} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
    </div>
  );
};
