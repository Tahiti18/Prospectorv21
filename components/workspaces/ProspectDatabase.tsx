
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
  
  // Advanced Grouping & Isolation State
  const [grouping, setGrouping] = useState<GroupBy>('none');
  const [subFilterValue, setSubFilterValue] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. SMART EXTRACTION: Finds all unique cities/niches represented in the 612 leads
  const representedValues = useMemo(() => {
    if (grouping === 'none') return [];
    const values = new Set<string>();
    
    leads.forEach(l => {
        const val = l[grouping as keyof Lead];
        if (typeof val === 'string' && val.trim() !== '') {
            values.add(val.trim());
        }
    });
    return Array.from(values).sort();
  }, [leads, grouping]);

  // 2. Initial Filtering (Pipeline Status)
  const statusFilteredLeads = useMemo(() => {
    let filtered = leads;
    if (statusFilter !== 'ALL') {
        filtered = leads.filter(l => (l.outreachStatus ?? l.status ?? 'cold') === statusFilter);
    }
    return filtered;
  }, [leads, statusFilter]);

  // 3. SECONDARY ISOLATION: Filters the list down to the specific chosen City/Niche
  const isolatedLeads = useMemo(() => {
    if (grouping === 'none' || subFilterValue === 'ALL') return statusFilteredLeads;
    return statusFilteredLeads.filter(l => {
        const val = l[grouping as keyof Lead];
        return typeof val === 'string' && val.trim() === subFilterValue;
    });
  }, [statusFilteredLeads, grouping, subFilterValue]);

  // 4. Numerical and Alpha Sorting (Clean headers, no tooltips)
  const sortedLeads = useMemo(() => {
    return [...isolatedLeads].sort((a, b) => {
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
  }, [isolatedLeads, sortConfig]);

  // 5. Grouping logic for the UI headers
  const groupedData = useMemo(() => {
    if (grouping === 'none' || subFilterValue !== 'ALL') return { 'MASTER DATABASE': sortedLeads };
    
    const groups: Record<string, Lead[]> = {};
    sortedLeads.forEach(lead => {
      const val = lead[grouping as keyof Lead];
      const key = (typeof val === 'string' ? val : 'UNCLASSIFIED') || 'UNCLASSIFIED';
      const displayKey = key.toUpperCase();
      if (!groups[displayKey]) groups[displayKey] = [];
      groups[displayKey].push(lead);
    });
    return groups;
  }, [sortedLeads, grouping, subFilterValue]);

  const handleSort = (key: keyof Lead) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleGroupingChange = (newGrouping: GroupBy) => {
      setGrouping(newGrouping);
      setSubFilterValue('ALL'); 
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedLeads.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(sortedLeads.map(l => l.id)));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently remove this record?")) {
        db.deleteLead(id);
        toast.info("Record purged.");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROSPECTOR_LEADS_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully.");
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
                toast.success(`DEDUP SYNC: Added ${results.added} new, Merged ${results.updated} duplicates.`);
            } else {
                toast.error("Invalid file format. Expected JSON array.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse import file.");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SortIcon = ({ col }: { col: keyof Lead }) => {
    if (sortConfig.key !== col) return <span className="opacity-20 ml-2 text-[10px]">⇅</span>;
    return <span className="text-emerald-500 ml-2 text-[10px] font-bold">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="space-y-6 py-6 max-w-[1600px] mx-auto relative px-6 pb-40 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
            PROSPECT <span className="text-emerald-500">DATABASE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">MASTER REPOSITORY // {leads.length} RECORDS</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* CONTROL HUB: GROUPING AND ISOLATION */}
          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-2xl px-6 py-3 flex items-center shadow-2xl gap-8">
             <div className="flex items-center gap-3 border-r border-slate-800 pr-8">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ORGANIZE BY:</span>
                <div className="flex gap-1">
                    <button onClick={() => handleGroupingChange('none')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'none' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>FLAT LIST</button>
                    <button onClick={() => handleGroupingChange('city')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'city' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>CITY</button>
                    <button onClick={() => handleGroupingChange('niche')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'niche' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>NICHE</button>
                </div>
             </div>

             {/* DYNAMIC ISOLATION DROP-DOWN (Filtered for City or Niche) */}
             {grouping !== 'none' && (
                <div className="flex flex-col animate-in slide-in-from-left-4 duration-300">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">ISOLATE {grouping.toUpperCase()} TARGETS</span>
                    <select 
                        value={subFilterValue}
                        onChange={(e) => setSubFilterValue(e.target.value)}
                        className="bg-[#020617] border-2 border-emerald-500/40 rounded-xl px-4 py-2 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500 cursor-pointer min-w-[220px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    >
                        <option value="ALL">VIEW ALL REPRESENTED {grouping.toUpperCase()}S</option>
                        {representedValues.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                    </select>
                </div>
             )}
          </div>

          <div className="bg-[#0b1021] border-2 border-slate-800 rounded-2xl px-6 py-3 flex items-center shadow-2xl">
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
             <button onClick={() => setShowHyperLaunch(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 border-b-4 border-emerald-800">
               LAUNCH CAMPAIGN ({selectedIds.size})
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
                  onClick={() => handleSort('socialGap')} 
                  className="cursor-pointer px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors group select-none"
                >
                    VULNERABILITY GAP<SortIcon col="socialGap" />
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
                  {/* GROUP HEADERS (Only visible when "VIEW ALL" is active) */}
                  {grouping !== 'none' && subFilterValue === 'ALL' && (
                    <tr className="bg-slate-900/50 border-y border-slate-800/50">
                       <td colSpan={7} className="px-8 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                             <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.2em]">{groupName}</span>
                             <div className="h-px bg-slate-800 flex-1 ml-4 opacity-30"></div>
                             <span className="text-[10px] font-bold text-slate-600 ml-4 tracking-widest">{groupLeads.length} TARGETS FOUND</span>
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
                        DATABASE SEGMENT EMPTY. CHECK FILTERS.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATA MANAGEMENT FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 p-10 bg-[#0b1021]/80 border-2 border-slate-800 rounded-[48px] shadow-2xl">
         <div className="flex gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">IMPORT JSON</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            <button onClick={handleExport} className="px-10 py-5 bg-slate-950 border-2 border-slate-800 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">EXPORT DATABASE</button>
         </div>

         <button 
            onClick={() => { db.saveLeads(leads); toast.success("DATABASE_COMMITTED"); }}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 border-b-4 border-emerald-800 flex items-center gap-4"
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
