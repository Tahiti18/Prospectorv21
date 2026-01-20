
/* =========================================================
   NEXUS GRAPH – ENTITY RELATIONSHIP MATRIX
   ========================================================= */

import React, { useMemo } from 'react';
import { Lead } from '../../types';
import { toast } from '../../services/toastManager';

interface NexusGraphProps {
  leads: Lead[];
}

export const NexusGraph: React.FC<NexusGraphProps> = ({ leads }) => {
  
  const nodes = useMemo(() => {
    if (leads.length === 0) return [];
    
    const clusters: Record<string, Lead[]> = {};
    leads.forEach(l => {
      const key = l.niche || 'General';
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(l);
    });

    const visualNodes: any[] = [];
    const keys = Object.keys(clusters);
    const centerX = 500;
    const centerY = 250;
    const radius = 180;

    keys.forEach((k, i) => {
      const angle = (i / keys.length) * 2 * Math.PI;
      const cx = centerX + radius * Math.cos(angle);
      const cy = centerY + radius * Math.sin(angle);
      
      // Cluster Center
      visualNodes.push({ type: 'hub', x: cx, y: cy, label: k, count: clusters[k].length });

      // Leaf Nodes
      clusters[k].forEach((l, j) => {
        const offsetR = 50 + (l.leadScore / 4);
        const leafAngle = (j / clusters[k].length) * 2 * Math.PI + angle;
        visualNodes.push({
          type: 'lead',
          id: l.id,
          x: cx + offsetR * Math.cos(leafAngle),
          y: cy + offsetR * Math.sin(leafAngle),
          label: l.businessName,
          score: l.leadScore,
          parentX: cx,
          parentY: cy
        });
      });
    });

    return visualNodes;
  }, [leads]);

  const handleNodeClick = (label: string) => {
    toast.info(`ENTITY_LOCATED: ${label.toUpperCase()}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">NEXUS <span className="text-emerald-500 not-italic">GRAPH</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic">Theater Entity Relationship Matrix ({leads.length} Nodes)</p>
        </div>
        <div className="px-5 py-2.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Linkage: 0.04s</span>
        </div>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-4 shadow-2xl relative min-h-[600px] overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#10b981 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }}></div>
         
         {leads.length === 0 ? (
            <div className="text-center opacity-30 animate-pulse">
               <span className="text-8xl mb-8 block">🕸️</span>
               <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.5em]">No Data Points to Cluster</h3>
               <p className="text-[10px] text-slate-700 uppercase tracking-widest mt-4">Generate leads in Market Discovery to populate the Nexus.</p>
            </div>
         ) : (
           <svg className="w-full h-[600px] relative z-10 select-none" viewBox="0 0 1000 500">
              {/* Connections */}
              {nodes.filter(n => n.type === 'lead').map((n, i) => (
                <line 
                  key={`line-${i}`}
                  x1={n.parentX} y1={n.parentY}
                  x2={n.x} y2={n.y}
                  className="stroke-emerald-500/10" 
                  strokeWidth="1.5" 
                />
              ))}

              {/* Nodes */}
              {nodes.map((n, i) => (
                <g key={i} className="group cursor-pointer" onClick={() => handleNodeClick(n.label)}>
                   {n.type === 'hub' ? (
                     <>
                       <circle cx={n.x} cy={n.y} r={25 + (n.count * 3)} className="fill-emerald-900/30 stroke-emerald-500/40 stroke-2 group-hover:fill-emerald-500/20 transition-all" />
                       <text x={n.x} y={n.y} dy="4" textAnchor="middle" className="text-[9px] font-black fill-emerald-400 uppercase tracking-tighter pointer-events-none">{n.label}</text>
                     </>
                   ) : (
                     <>
                       <circle cx={n.x} cy={n.y} r={Math.max(4, n.score / 12)} className={`${n.score > 80 ? 'fill-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'fill-slate-700'} stroke-none group-hover:scale-150 transition-all`} />
                       <text x={n.x + 12} y={n.y + 4} className="text-[8px] font-black fill-slate-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase pointer-events-none whitespace-nowrap">{n.label}</text>
                     </>
                   )}
                </g>
              ))}
           </svg>
         )}

         <div className="absolute bottom-12 right-12 bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl relative z-20">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graph Legend</h4>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-900/50 border border-emerald-500/50"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NICHE HUB</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HIGH VALUE (80+)</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
