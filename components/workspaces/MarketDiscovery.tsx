
import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../../types';
import { generateLeads } from '../../services/geminiService';
import { Loader } from '../../services/Loader';
import { toast } from '../../services/toastManager';
import { db } from '../../services/automation/db';

interface MarketDiscoveryProps {
  market: string;
  onLeadsGenerated: (l: Lead[]) => void;
}

const STRATEGIC_NICHES: Record<string, string[]> = {
  "INFRASTRUCTURE & TRADES": [
    "Roofing & Exterior",
    "HVAC Systems",
    "Solar Energy Solutions",
    "Smart Home Integration",
    "Custom Landscaping",
    "Pool Construction"
  ],
  "AESTHETIC MEDICINE": [
    "Medical Aesthetics (MedSpas)",
    "Plastic Surgery",
    "Hair Restoration",
    "Dental Implants",
    "Fertility Centers",
    "Dermatology Clinics"
  ],
  "LUXURY & LIFESTYLE": [
    "Luxury Real Estate",
    "Yacht Charters",
    "Private Jet Brokerage",
    "Boutique Hotels",
    "Exotic Car Rentals",
    "High-End Interior Design"
  ],
  "PROFESSIONAL SERVICES": [
    "Personal Injury Law",
    "Wealth Management",
    "SaaS Enterprise Solutions",
    "Logistics & Freight",
    "Estate Planning",
    "Corporate Training"
  ],
  "PRODUCTION & INDUSTRIAL": [
    "Luxury Wedding Planning",
    "Content Production Studios",
    "Event Architecture",
    "Fitness Franchises",
    "Commercial Real Estate",
    "Specialized Manufacturing"
  ]
};

export const MarketDiscovery: React.FC<MarketDiscoveryProps> = ({ market, onLeadsGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState('Roofing & Exterior');
  const [volume, setVolume] = useState(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScan = async () => {
    if (!market) {
        toast.error("Please select a target market.");
        return;
    }
    setLoading(true);
    try {
      const result = await generateLeads(market, niche, volume);
      if (!result.leads || !Array.isArray(result.leads)) {
          throw new Error("Invalid response structure from AI.");
      }

      const formatted: Lead[] = result.leads.map((l: any, i: number) => ({
        ...l, 
        id: l.id || `L-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`, 
        status: 'cold', 
        outreachStatus: 'cold', 
        rank: i + 1, 
        city: l.city || market, 
        niche: l.niche || niche,
        leadScore: l.leadScore || 85,
        assetGrade: l.assetGrade || 'A'
      }));

      db.upsertLeads(formatted);
      onLeadsGenerated(formatted);
      toast.success(`${formatted.length} Businesses identified and synchronized with Ledger.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Discovery Interrupted: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const leads = db.getLeads();
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROSPECTOR_LEDGER_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DATABASE_EXPORTED_SUCCESSFULLY");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target?.result as string);
            if (Array.isArray(imported)) {
                // Unified deduplication sync
                const results = db.upsertLeads(imported);
                toast.success(`IMPORT COMPLETE: Added ${results.added} new targets, merged ${results.updated} existing.`);
            } else {
                toast.error("INVALID_FILE_STRUCTURE");
            }
        } catch (err) {
            toast.error("PARSE_FAILURE");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualCommit = () => {
    const currentLeads = db.getLeads();
    db.saveLeads(currentLeads);
    toast.success("DATABASE SYNCHRONIZED AND PERSISTED");
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500 pb-40 px-6">
      <div className="text-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
          LEAD <span className="text-emerald-500 italic">DISCOVERY</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-4">Target Region: {market}</p>
      </div>

      {/* Main Container - Removed overflow-hidden to prevent dropdown clipping */}
      <div className="bg-[#0b1021]/80 border-2 border-slate-800 rounded-[40px] p-10 space-y-10 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        
        {/* Input Grid - Increased Z-Index to ensure it stays above the scan button below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-30">
          
          {/* CUSTOM DROPDOWN WITH VISUAL HIERARCHY */}
          <div className="space-y-4" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Focus Industry</label>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#020617] border-2 border-slate-800 rounded-2xl px-6 py-5 text-sm font-bold text-white text-left focus:outline-none focus:border-emerald-500 transition-all flex justify-between items-center group shadow-inner"
              >
                <span className="uppercase tracking-tight text-emerald-400">{niche}</span>
                <svg className={`w-4 h-4 text-emerald-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-[#0b1021] border-2 border-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100] max-h-[450px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 space-y-2">
                    {Object.entries(STRATEGIC_NICHES).map(([group, items]) => (
                      <div key={group} className="mb-6 last:mb-2">
                        {/* THE PROMINENT HEADER */}
                        <div className="px-3 py-2 text-[13px] font-black text-white uppercase tracking-[0.1em] border-b border-emerald-500/20 mb-2 flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                           {group}
                        </div>
                        
                        {/* THE SUBORDINATE NICHES */}
                        <div className="space-y-0.5">
                          {items.map(item => (
                            <button 
                              key={item}
                              onClick={() => { setNiche(item); setIsDropdownOpen(false); }}
                              className={`w-full text-left px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${niche === item ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Sample Size</label>
            <div className="flex bg-[#020617] border-2 border-slate-800 rounded-2xl p-1.5 h-[64px]">
              {[6, 12, 18, 30].map(v => (
                <button 
                  key={v} 
                  onClick={() => setVolume(v)} 
                  className={`flex-1 rounded-xl text-[10px] font-black transition-all ${volume === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button - Lower Z-index relative to inputs */}
        <button 
          onClick={handleScan} 
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-7 rounded-3xl text-[13px] font-black uppercase tracking-[0.4em] text-white shadow-2xl shadow-emerald-600/20 active:scale-[0.98] border-b-8 border-emerald-800 transition-all relative z-10"
        >
          INITIATE MARKET SCAN
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-10 bg-[#0b1021]/80 border-2 border-slate-800 rounded-[40px] shadow-xl relative z-10">
         <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group"
            >
              <span className="group-hover:-translate-y-0.5 transition-transform">⬆️</span> IMPORT LEDGER
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            <button 
              onClick={handleExport}
              className="px-8 py-4 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group"
            >
              <span className="group-hover:translate-y-0.5 transition-transform">⬇️</span> EXPORT LEDGER
            </button>
         </div>

         <button 
            onClick={handleManualCommit}
            className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 flex items-center gap-3"
         >
            <span>💾</span> COMMIT ALL CHANGES
         </button>
      </div>

      <div className="p-12 border-4 border-dashed border-slate-800/50 rounded-[64px] text-center space-y-6 opacity-30">
          <p className="text-[14px] font-black text-slate-600 uppercase tracking-[0.6em] italic">SYSTEM_READY: TARGET_SCAN_NODE_STANDBY</p>
      </div>
    </div>
  );
};
