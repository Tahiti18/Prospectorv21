
import React, { useMemo } from 'react';
import { Lead, AssetRecord } from '../../types';
import { dossierStorage, StrategicDossier } from '../../services/dossierStorage';
import { SESSION_ASSETS } from '../../services/geminiService';

const DossierBlockRenderer: React.FC<{ content: any }> = ({ content }) => {
  if (!content) return null;
  
  // If it's a UI_BLOCKS format
  if (content.format === 'ui_blocks' || (typeof content === 'string' && content.includes('"format":"ui_blocks"'))) {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    return (
      <div className="space-y-10">
        {data.sections?.map((section: any, sIdx: number) => (
          <div key={sIdx} className="space-y-6">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] border-b border-emerald-100 pb-2">{section.heading}</h4>
            <div className="space-y-4">
              {section.body?.map((block: any, bIdx: number) => {
                if (block.type === 'hero') return <div key={bIdx} className="p-8 bg-emerald-600 rounded-3xl text-white text-xl font-black italic uppercase tracking-tighter shadow-lg">"{block.content}"</div>;
                if (block.type === 'p') return <p key={bIdx} className="text-sm text-slate-700 leading-relaxed font-serif italic border-l-4 border-slate-200 pl-6">"{block.content}"</p>;
                if (block.type === 'bullets') return (
                  <ul key={bIdx} className="grid grid-cols-1 gap-3">
                    {block.content?.map((item: string, i: number) => (
                      <li key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold text-slate-800 uppercase tracking-tight">
                        <span className="text-emerald-500">→</span> {item}
                      </li>
                    ))}
                  </ul>
                );
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for simple strings
  if (typeof content === 'string') {
    return <p className="text-sm text-slate-600 leading-relaxed italic">"{content}"</p>;
  }

  return null;
};

export const ExecutiveDossier: React.FC<{ lead: Lead }> = ({ lead }) => {
  const dossier: StrategicDossier | null = useMemo(() => dossierStorage.getByLead(lead.id), [lead.id]);
  const assets: AssetRecord[] = useMemo(() => SESSION_ASSETS.filter(a => a.leadId === lead.id), [lead.id]);

  if (!dossier) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-[#0b1021] border border-slate-800 rounded-[48px] m-10">
        <span className="text-4xl mb-4">📂</span>
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Strategy Manifest Not Found</p>
        <p className="text-xs text-slate-600 mt-2">Initialize 'Campaign Builder' to generate this dossier.</p>
      </div>
    );
  }

  const { data } = dossier;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans selection:bg-emerald-100 dossier-container">
      {/* TOOLBAR (Hidden in Print) */}
      <div className="fixed top-6 right-6 z-[1000] flex gap-3 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-4 border-emerald-800"
        >
          <span>📥</span> EXPORT EXECUTIVE PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .dossier-page { height: 297mm; page-break-after: always; padding: 25mm !important; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start; }
          .print-hidden { display: none !important; }
          .dossier-container { width: 100%; }
        }
        .dossier-page { min-height: 100vh; padding: 4rem; position: relative; border-bottom: 1px solid #f1f5f9; }
        .emerald-accent { color: #059669; }
      `}</style>

      {/* PAGE 1: COVER PAGE */}
      <section className="dossier-page flex flex-col justify-center items-center text-center bg-[#020617] text-white">
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-black">P</div>
          <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">PROSPECTOR_OS // MASTER_MANIFEST</span>
        </div>
        
        <div className="space-y-12">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500">EXECUTIVE STRATEGIC PACKAGE</h4>
            <div className="space-y-4">
                <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-[0.9]">{lead.businessName}</h1>
                <p className="text-2xl font-serif italic text-slate-400 opacity-80">{lead.niche} // {lead.city.toUpperCase()}</p>
            </div>
            <div className="w-24 h-1 bg-emerald-600 mx-auto shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">PREPARED BY AGENT ZERO • {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="absolute bottom-12 right-12 text-[8px] font-mono opacity-20 uppercase tracking-widest">
            ENCRYPTION: AES_256_STRICT // DATA_SYNCED: {new Date(dossier.timestamp).toLocaleTimeString()}
        </div>
      </section>

      {/* PAGE 2: THE EXECUTIVE THESIS */}
      <section className="dossier-page flex flex-col justify-center max-w-4xl mx-auto">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">01 // THE STRATEGIC THESIS</h2>
        <div className="space-y-10">
            <p className="text-4xl font-serif italic leading-relaxed text-slate-800">
               "{data.narrative}"
            </p>
            <div className="grid grid-cols-2 gap-8 pt-12">
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">IDENTIFIED GAP</span>
                    <p className="text-lg font-bold text-slate-900 uppercase italic tracking-tight">{lead.socialGap}</p>
                </div>
                <div className="p-8 bg-emerald-600 rounded-3xl text-white">
                    <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest block mb-2">TRANSFORMATION VECTOR</span>
                    <p className="text-lg font-bold uppercase italic tracking-tight">{lead.bestAngle}</p>
                </div>
            </div>
        </div>
      </section>

      {/* PAGE 3: THE STRATEGY DECK (SLIDES) */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">02 // ARCHITECTURAL BLUEPRINT</h2>
        <div className="grid grid-cols-2 gap-8">
           {data.presentation?.slides?.map((slide: any, idx: number) => (
             <div key={idx} className="p-10 border-2 border-slate-100 rounded-[40px] flex flex-col justify-between hover:border-emerald-200 transition-all">
                <div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-4 block">MODULE_0{idx+1} // {slide.category}</span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6 italic">{slide.title}</h3>
                    <ul className="space-y-3">
                        {slide.bullets?.map((b: string, i: number) => (
                            <li key={i} className="text-xs font-medium text-slate-500 flex gap-3 italic">
                                <span className="text-emerald-500">→</span> {b}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4 italic">"{slide.insight}"</p>
             </div>
           ))}
        </div>
      </section>

      {/* PAGE 4: THE EXECUTIVE PROPOSAL */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">03 // PROPOSAL BLUEPRINT</h2>
        <div className="bg-slate-50 border border-slate-100 p-12 rounded-[56px] shadow-inner overflow-hidden">
            <DossierBlockRenderer content={data.proposal} />
        </div>
      </section>

      {/* PAGE 5: PITCH ARCHITECTURE */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">04 // PSYCHOLOGICAL PITCH SCRIPTS</h2>
        <div className="bg-slate-50 border border-slate-100 p-12 rounded-[56px] shadow-inner overflow-hidden">
            <DossierBlockRenderer content={data.pitch} />
        </div>
      </section>

      {/* PAGE 6: VISUAL DIRECTIVES & MOOD */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">05 // AESTHETIC INDOCTRINATION</h2>
        <div className="space-y-12">
            <div className="p-12 bg-[#020617] text-white rounded-[56px] shadow-2xl flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-6">BRAND_MOOD_BOARD</span>
                <p className="text-3xl font-serif italic max-w-2xl leading-relaxed">"{data.visualDirection?.brandMood}"</p>
                <div className="flex gap-4 mt-12">
                    {data.visualDirection?.colorPalette?.map((c: any, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-lg" style={{ backgroundColor: c.hex }}></div>
                            <span className="text-[8px] font-bold opacity-50 uppercase">{c.color}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {assets.filter(a => a.type === 'IMAGE').slice(0, 4).map((a, i) => (
                    <div key={i} className="aspect-[4/5] bg-slate-100 rounded-[32px] overflow-hidden relative group">
                        <img src={a.data} className="w-full h-full object-cover" alt="Asset" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">{a.module}</span>
                            <h4 className="text-white font-black uppercase italic tracking-tight">{a.title}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* PAGE 7: CONVERSION GEOMETRY (FUNNEL) */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">06 // CONVERSION GEOMETRY</h2>
        <div className="space-y-8 max-w-3xl mx-auto">
            {data.funnel?.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-12 relative">
                    {i < data.funnel.length - 1 && <div className="absolute left-7 top-14 w-px h-12 bg-slate-200"></div>}
                    <div className="w-14 h-14 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center font-black italic text-xl shrink-0 shadow-sm">0{i+1}</div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 p-8 rounded-3xl">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-black uppercase italic text-slate-900">{step.title}</h4>
                            <span className="text-[8px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">{step.conversionGoal}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{step.description}"</p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* PAGE 8: OUTREACH SEQUENCE */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">07 // ENGAGEMENT SEQUENCE</h2>
        <div className="space-y-6">
           {data.outreach?.emailSequence?.map((email: any, i: number) => (
             <div key={i} className="p-8 border border-slate-200 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">DAY {email.day || (i*3+1)} // OUTBOUND</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{email.purpose}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">SUBJECT: <span className="text-slate-900">{email.subject}</span></p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap">{email.body}</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* PAGE 9: CONTENT SWARM */}
      <section className="dossier-page">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-slate-900 pb-4 w-fit">08 // CONTENT SWARM</h2>
        <div className="grid grid-cols-2 gap-8">
            {data.contentPack?.map((item: any, i: number) => (
                <div key={i} className="p-10 bg-slate-50 border border-slate-100 rounded-[40px] flex flex-col gap-6 group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-white border border-emerald-100 rounded-lg">{item.platform} // {item.type}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 italic leading-relaxed border-l-2 border-emerald-500 pl-4">"{item.caption}"</p>
                    <div className="mt-auto pt-6 border-t border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">VISUAL_DIRECTIVE</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase italic">{item.visualDirective}</p>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-auto pt-12 border-t border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">END OF STRATEGIC MANIFEST</p>
             <p className="text-[8px] font-mono text-slate-300 mt-4 uppercase">VERIFIED BY PROSPECTOR OS V3.2 // FOR ARCHIVAL USE ONLY</p>
        </div>
      </section>
    </div>
  );
};
