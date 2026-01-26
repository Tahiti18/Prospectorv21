
import React, { useState, useMemo, useRef } from 'react';
import { Lead, OutreachStatus } from '../../types';
import { AutomationOrchestrator } from '../../services/automation/orchestrator';
import { RunStatus } from '../automation/RunStatus';
import { HyperLaunchModal } from '../automation/HyperLaunchModal';
import { db } from '../../services/automation/db';
import { toast } from '../../services/toastManager';

const STATUS_FILTER_OPTIONS: (OutreachStatus | 'ALL')[] = ['ALL', 'cold', 'queued', 'sent', 'opened', 'replied', 'booked', 'won', 'lost', 'paused'];

type GroupBy = 'none' | 'city' | 'niche';

export const ProspectDatabase: React.FC<{ leads: Lead[], lockedLeadId: string | null, onLockLead: (id: string) => void, onInspect: (id: string) => void }> = ({ leads, lockedLeadId, onLockLead, onInspect }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHyperLaunch, setShowHyperLaunch] = useState(false);
  
  // Persistent Multi-Vector Isolation State
  const [grouping, setGrouping] = useState<GroupBy>('none');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [nicheFilter, setNicheFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Helper: Atomic Extraction
   * Ensures data consistency for dropdowns and headers
   */
  const getAtomicValue = (val: any, mode: 'city' | 'niche'): string => {
    if (typeof val !== 'string' || val.trim() === '') return 'UNCLASSIFIED';
    if (mode === 'city') return val.split(',')[0].trim().toUpperCase();
    return val.trim().toUpperCase();
  };

  // 1. CONTEXTUAL OPTION DISCOVERY (Cascading logic)
  // Get cities available based on current Niche selection
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      const matchNiche = nicheFilter === 'ALL' || getAtomicValue(l.niche, 'niche') === nicheFilter;
      if (matchNiche) set.add(getAtomicValue(l.city, 'city'));
    });
    return Array.from(set).sort();
  }, [leads, nicheFilter]);

  // Get niches available based on current City selection
  const availableNiches = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      const matchCity = cityFilter === 'ALL' || getAtomicValue(l.city, 'city') === cityFilter;
      if (matchCity) set.add(getAtomicValue(l.niche, 'niche'));
    });
    return Array.from(set).sort();
  }, [leads, cityFilter]);

  // 2. STRIKE-READY FILTER CHAIN: Cumulative filtering
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchStatus = statusFilter === 'ALL' || (l.outreachStatus ?? l.status ?? 'cold') === statusFilter;
      const matchCity = cityFilter === 'ALL' || getAtomicValue(l.city, 'city') === cityFilter;
      const matchNiche = nicheFilter === 'ALL' || getAtomicValue(l.niche, 'niche') === nicheFilter;
      const matchSearch = searchQuery.trim() === '' || l.businessName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchCity && matchNiche && matchSearch;
    });
  }, [leads, statusFilter, cityFilter, nicheFilter, searchQuery]);

  // 3. SORTING ENGINE
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      // @ts-ignore
      let aVal = a[sortConfig.key];
      // @ts-ignore
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr === bStr) return 0;
      const comparison = aStr > bStr ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredLeads, sortConfig]);

  // 4. VIEW COMPILER: Decides grouping headers
  const groupedData = useMemo(() => {
    if (grouping === 'none') return { 'MASTER DATABASE': sortedLeads };
    
    const groups: Record<string, Lead[]> = {};
    sortedLeads.forEach(lead => {
      const rawVal = lead[grouping as keyof Lead];
      const displayKey = getAtomicValue(rawVal, grouping as 'city' | 'niche');
      if (!groups[displayKey]) groups[displayKey] = [];
      groups[displayKey].push(lead);
    });
    return groups;
  }, [sortedLeads, grouping]);

  const handleSort = (key: keyof Lead) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedLeads.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(sortedLeads.map(l => l.id)));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this target from the ledger?")) {
        db.deleteLead(id);
        toast.info("Target purged.");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROSPECTOR_LEDGER_EXPORT_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DATABASE_EXPORT_COMPLETE");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target?.result as string);
            if (Array.isArray(imported)) {
                const results = db.upsertLeads(imported);
                toast.success(`DEDUP_SYNC: +${results.added} NEW TARGETS.`);
            } else {
                toast.error("INVALID_JSON_ARRAY");
            }
        } catch (err) {
            toast.error("PARSE_FAILURE");
        }
    };
    reader.readAsText(file);
  };

  const SortIcon = ({ col }: { col: keyof Lead }) => {
    if (sortConfig.key !== col) return <span className="opacity-10 ml-2 text-[10px]">⇅</span>;
    return <span className="text-emerald-500 ml-2 text-[10px] font-black">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  // Helper to generate a clean intersection label for the header
  const getStrikeZoneLabel = () => {
    const parts = [];
    if (searchQuery.trim() !== '') parts.push(`"${searchQuery.toUpperCase()}"`);
    if (cityFilter !== 'ALL') parts.push(cityFilter);
    if (nicheFilter !== 'ALL') parts.push(nicheFilter);
    if (statusFilter !== 'ALL') parts.push(statusFilter.toUpperCase());
    
    if (parts.length === 0) return "FULL DATABASE";
    return parts.join(" + ");
  };

  return (
    <div className="space-y-6 py-6 max-w-[1600px] mx-auto relative px-6 pb-40 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
            PROSPECT <span className="text-emerald-500">DATABASE</span>
          </h1>
          {/* PRECISION COUNTER HEADER */}
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic flex flex-wrap items-center gap-3">
            MASTER REPOSITORY // {leads.length} RECORDS
            {(cityFilter !== 'ALL' || nicheFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery.trim() !== '') && (
              <span className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                <span className="text-slate-800">|</span>
                <span className="text-emerald-500 bg-emerald-500/5 px-3 py-0.5 rounded border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                   {getStrikeZoneLabel()}: {filteredLeads.length} TARGETS
                </span>
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* ISOLATION MATRIX BAR */}
          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-3xl px-6 py-3 flex flex-wrap items-center shadow-2xl gap-8">
             {/* SEARCH ENTITY */}
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SEARCH IDENTITY</span>
                <div className="relative group">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="BUSINESS NAME..."
                    className="bg-[#020617] border-2 border-slate-800 rounded-xl px-4 py-1.5 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500 min-w-[200px] shadow-inner transition-all placeholder:text-slate-700"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round"/></svg>
                </div>
             </div>

             <div className="h-10 w-px bg-slate-800"></div>

             {/* ISOLATE CITY */}
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">ISOLATE CITY</span>
                <select 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="bg-[#020617] border-2 border-slate-800 rounded-xl px-4 py-1.5 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500 cursor-pointer min-w-[160px] shadow-inner"
                >
                    <option value="ALL">ALL CITIES ({leads.length})</option>
                    {availableCities.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
             </div>

             {/* ISOLATE NICHE - Now dynamically filtered by city selection */}
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">ISOLATE NICHE</span>
                <select 
                    value={nicheFilter}
                    onChange={(e) => setNicheFilter(e.target.value)}
                    className="bg-[#020617] border-2 border-slate-800 rounded-xl px-4 py-1.5 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500 cursor-pointer min-w-[160px] shadow-inner"
                >
                    <option value="ALL">ALL NICHES</option>
                    {availableNiches.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
             </div>

             <div className="h-10 w-px bg-slate-800"></div>

             {/* ORGANIZE BUTTONS */}
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 animate-pulse italic">ORGANIZE VIEW</span>
                <div className="flex gap-1">
                    <button onClick={() => setGrouping('none')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'none' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>FLAT</button>
                    <button onClick={() => setGrouping('city')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'city' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>CITY</button>
                    <button onClick={() => setGrouping('niche')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'niche' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>NICHE</button>
                </div>
             </div>
          </div>

          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-3xl px-6 py-4 flex items-center shadow-2xl h-[64px]">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-3">PIPELINE:</span>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="bg-transparent text-[10px] font-bold text-white uppercase focus:outline-none cursor-pointer"
             >
               {STATUS_FILTER_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
             </select>
          </div>

          {selectedIds.size > 0 && (
             <button onClick={() => setShowHyperLaunch(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 border-b-4 border-emerald-800 h-[64px]">
               LAUNCH SWARM ({selectedIds.size})
             </button>
          )}
        </div>
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-[#05091a]">
                <th className="px-8 py-6 w-12 text-center">
                    <input type="checkbox" checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} onChange={toggleSelectAll} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                </th>
                <th 
                  onClick={() => handleSort('rank')} 
                  className="cursor-pointer px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors group select-none whitespace-nowrap"
                >
                    RANK<SortIcon col="rank" />
                </th>
                <th 
                  onClick={() => handleSort('businessName')} 
                  className="cursor-pointer px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors group select-none"
                >
                    BUSINESS IDENTITY<SortIcon col="businessName" />
                </th>
                <th 
                  onClick={() => handleSort('status')} 
                  className="cursor-pointer px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center hover:text-white transition-colors group select-none"
                >
                    STATUS<SortIcon col="status" />
                </th>
                <th 
                  className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] select-none"
                >
                    VULNERABILITY SIGNAL
                </th>
                <th 
                  onClick={() => handleSort('leadScore')} 
                  className="cursor-pointer px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white text-right group select-none"
                >
                    SCORE<SortIcon col="leadScore" />
                </th>
                <th className="w-48 px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800/50">
              {(Object.entries(groupedData) as [string, Lead[]][]).map(([groupName, groupLeads]) => (
                <React.Fragment key={groupName}>
                  {/* DYNAMIC GROUP HEADERS */}
                  {grouping !== 'none' && (
                    <tr className="bg-slate-900/50 border-y border-slate-800/50">
                       <td colSpan={7} className="px-8 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                             <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.2em]">{groupName}</span>
                             <div className="h-px bg-slate-800 flex-1 ml-4 opacity-30"></div>
                             <span className="text-[10px] font-bold text-slate-600 ml-4 tracking-widest">{groupLeads.length} SEGMENT TARGETS</span>
                          </div>
                       </td>
                    </tr>
                  )}
                  {groupLeads.map((lead) => {
                    const displayStatus = lead.outreachStatus ?? lead.status ?? 'cold';
                    return (
                      <tr key={lead.id} className={`group hover:bg-white/5 transition-all ${selectedIds.has(lead.id) ? 'bg-emerald-900/10' : ''}`}>
                        <td className="px-8 py-6 text-center">
                            <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => {
                                const next = new Set(selectedIds);
                                if (next.has(lead.id)) next.delete(lead.id); else next.add(lead.id);
                                setSelectedIds(next);
                            }} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                        </td>
                        <td className="px-6 py-6"><span className="text-2xl font-black text-slate-700 italic group-hover:text-emerald-500 transition-colors leading-none tracking-tighter">#{lead.rank}</span></td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span onClick={() => onInspect(lead.id)} className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors cursor-pointer">{lead.businessName}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded">{lead.city}</span>
                              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{lead.niche}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${displayStatus === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-6 max-w-sm"><p className="text-[11px] font-medium text-slate-400 line-clamp-1 italic">"{lead.socialGap}"</p></td>
                        <td className="px-6 py-6 text-right"><span className={`text-3xl font-black italic tracking-tighter ${lead.leadScore > 80 ? 'text-emerald-500' : 'text-slate-600'}`}>{lead.leadScore}</span></td>
                        <td className="px-8 py-6 text-right flex items-center justify-end gap-3">
                            <button onClick={() => onInspect(lead.id)} className="px-5 py-2.5 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">STRATEGY</button>
                            <button onClick={() => handleDelete(lead.id)} className="p-2 text-slate-800 hover:text-rose-500 transition-colors text-xl">×</button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {sortedLeads.length === 0 && (
                <tr>
                    <td colSpan={7} className="py-32 text-center text-slate-700 italic uppercase tracking-widest text-xs">
                        NO ENTITIES MATCH THIS FILTER COMBINATION.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATA CONTROLS FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 p-10 bg-[#0b1021]/80 border-2 border-slate-800 rounded-[48px] shadow-2xl">
         <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-10 py-5 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group"
            >
              <span className="group-hover:-translate-y-0.5 transition-transform text-lg">↑</span> IMPORT JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            <button 
              onClick={handleExport}
              className="px-10 py-5 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group"
            >
              <span className="group-hover:translate-y-0.5 transition-transform text-lg">↓</span> EXPORT DATABASE
            </button>
         </div>

         <button 
            onClick={() => { db.saveLeads(leads); toast.success("DATABASE_COMMITTED"); }}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 active:scale-95 border-b-4 border-emerald-800 flex items-center gap-4"
         >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            FORCE COMMIT ALL
         </button>
      </div>

      {activeRunId && <RunStatus runId={activeRunId} onClose={() => setActiveRunId(null)} />}
      <HyperLaunchModal isOpen={showHyperLaunch} onClose={() => setShowHyperLaunch(false)} selectedLeads={leads.filter(l => selectedIds.has(l.id))} onComplete={() => setShowHyperLaunch(false)} />
    </div>
  );
};
