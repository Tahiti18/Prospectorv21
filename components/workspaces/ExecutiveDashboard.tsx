import React, { useEffect, useState } from 'react';
import { Lead, MainMode, SubModule } from '../../types';
import { Tooltip } from './Tooltip';
import { outreachService } from '../../services/outreachService';
import { db } from '../../services/automation/db';
import { subscribeToCompute, getBalance } from '../../services/computeTracker';

interface DashboardProps {
  leads: Lead[];
  market: string;
  onNavigate: (mode: MainMode, mod: SubModule) => void;
}

const DashboardIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'WORKFLOWS': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>;
    case 'RECORDS': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7M4 7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2" /></svg>;
    case 'SENT': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'COST': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>;
    case 'BLUEPRINT': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" /></svg>;
    // Fix: Corrected 'cy1' to 'y1' in SVG line element
    case 'DISCOVERY': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'LEDGER': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5z" /></svg>;
    default: return null;
  }
};

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ leads, market, onNavigate }) => {
  const [activeWorkflows, setActiveWorkflows] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  useEffect(() => {
    const refresh = () => {
      const runs = db.listRuns();
      setActiveWorkflows(runs.filter(r => r.status === 'running' || r.status === 'queued').length);
      const logs = outreachService.getHistory();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      setOutreachCount(logs.filter(l => l.timestamp > oneDayAgo).length);

      const merged = [...runs.slice(0, 5).map(r => ({ type: 'PROCESS', msg: `WORKFLOW ${r.status}: ${r.leadName}`, time: r.createdAt })),
                      ...logs.slice(0, 5).map(l => ({ type: 'ACTION', msg: `${l.channel.toUpperCase()} SENT: ${l.to || 'Unknown'}`, time: l.timestamp }))]
                      .sort((a,b) => b.time - a.time).slice(0, 6);
      setRecentLogs(merged);
    };

    refresh();
    const interval = setInterval(refresh, 2000);
    setBalance(getBalance());
    const unsub = subscribeToCompute((s, user) => { setSessionCost(s.sessionCostUsd); setBalance(user.credits || 0); });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  const stats = [
    { label: 'ACTIVE WORKFLOWS', status: activeWorkflows > 0 ? `${activeWorkflows} RUNNING` : 'IDLE', icon: 'WORKFLOWS', desc: "Ongoing automated agency tasks." },
    { label: 'SAVED PROSPECTS', status: `${leads.length} RECORDS`, icon: 'RECORDS', desc: "Total database volume." },
    { label: 'MESSAGES (24H)', status: `${outreachCount} SENT`, icon: 'SENT', desc: "Outreach activity." },
    { label: 'OPERATING COST', status: `$${sessionCost.toFixed(2)}`, icon: 'COST', desc: "Current session expenses." },
  ];

  const actions = [
    { id: 'SYSTEM_CAPABILITIES', mode: 'RESEARCH' as MainMode, title: 'VIEW BLUEPRINT', desc: 'SYSTEM CAPABILITIES', icon: 'BLUEPRINT' },
    { id: 'MARKET_DISCOVERY', mode: 'RESEARCH' as MainMode, title: 'SEARCH REGION', desc: 'FIND NEW CLIENTS', icon: 'DISCOVERY' },
    { id: 'PROSPECT_DATABASE', mode: 'RESEARCH' as MainMode, title: 'VIEW LEDGER', desc: 'MASTER PROSPECT LIST', icon: 'LEDGER' },
  ];

  return (
    <div className="space-y-12 py-4 max-w-6xl mx-auto animate-in fade-in duration-700 relative pb-20">
      <div className="absolute top-0 right-0 z-20">
          <div className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-950/20 shadow-md">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">WALLET: ${balance.toFixed(2)}</span>
          </div>
      </div>

      <div className="text-center relative py-6">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">AGENCY SYSTEMS SYNCHRONIZED</span>
        </div>
        
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
          AGENCY <span className="text-emerald-500 italic">OVERVIEW</span>
        </h1>
        <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">ACTIVE MARKET: <span className="text-emerald-400 italic">{market}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((node, i) => (
          <Tooltip key={i} content={node.desc} side="bottom">
            <div className="bg-[#0b1021] border border-slate-800 p-8 rounded-[32px] flex flex-col items-center group hover:border-emerald-500/50 transition-all cursor-default w-full shadow-xl relative overflow-hidden">
              <div className="text-emerald-500 mb-6 opacity-80 group-hover:scale-110 transition-transform">
                <DashboardIcon type={node.icon} />
              </div>
              <span className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase mb-2">{node.label}</span>
              <span className="text-lg font-black text-white uppercase italic tracking-tighter">{node.status}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-[#0b1021] border border-slate-800 rounded-[40px] p-10 shadow-2xl flex flex-col">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               LIVE OPERATIONAL FEED
            </h3>
            <div className="flex-1 space-y-4">
               {recentLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">SYSTEM_IDLE: NO RECENT ACTIVITY</div>
               ) : (
                  recentLogs.map((log, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all group">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${log.type === 'PROCESS' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'}`}>{log.type}</span>
                        <span className="text-[10px] font-bold text-slate-300 truncate flex-1 uppercase tracking-tight">{log.msg}</span>
                        <span className="text-[8px] font-black text-slate-600 uppercase italic">{new Date(log.time).toLocaleTimeString()}</span>
                     </div>
                  ))
               )}
            </div>
         </div>

         <div className="flex flex-col gap-4">
            {actions.map((action, i) => (
              <div key={i} onClick={() => onNavigate(action.mode, action.id as SubModule)} className="flex-1 bg-[#0b1021] border border-slate-800 p-6 rounded-[28px] group hover:border-emerald-500/60 transition-all cursor-pointer flex items-center gap-5 shadow-xl relative overflow-hidden">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <DashboardIcon type={action.icon} />
                </div>
                <div className="relative z-10">
                   <h2 className="text-xs font-black uppercase tracking-widest text-white mb-1 group-hover:text-emerald-400 transition-colors">{action.title}</h2>
                   <p className="text-[8px] font-bold text-slate-600 uppercase italic">{action.desc}</p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">→</div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};