
import React, { useMemo } from 'react';
import { Lead, AssetRecord } from '../../types';
import { dossierStorage, StrategicDossier } from '../../services/dossierStorage';
import { SESSION_ASSETS } from '../../services/geminiService';

const DossierBlockRenderer: React.FC<{ content: any }> = ({ content }) => {
  if (!content) return null;
  
  let data = content;
  if (typeof content === 'string') {
    try {
      if (content.includes('"format":"ui_blocks"') || content.includes('"sections":')) {
        data = JSON.parse(content);
      }
    } catch (e) {
      return <p className="text-sm text-slate-700 leading-relaxed font-serif italic border-l-4 border-slate-200 pl-6 mb-4">"{content}"</p>;
    }
  }

  if (data && data.sections) {
    return (
      <div className="space-y-12">
        {data.sections.map((section: any, sIdx: number) => (
          <div key={sIdx} className="space-y-6">
            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] border-b-2 border-emerald-100 pb-2">{section.heading}</h4>
            <div className="space-y-6">
              {section.body?.map((block: any, bIdx: number) => {
                if (block.type === 'hero') return <div key={bIdx} className="p-10 bg-emerald-600 rounded-[32px] text-white text-2xl font-black italic uppercase tracking-tighter shadow-xl">"{block.content}"</div>;
                if (block.type === 'p') return <p key={bIdx} className="text-sm text-slate-700 leading-relaxed font-serif italic border-l-4 border-slate-200 pl-8 py-2">"{block.content}"</p>;
                if (block.type === 'bullets') return (
                  <ul key={bIdx} className="grid grid-cols-1 gap-4">
                    {block.content?.map((item: string, i: number) => (
                      <li key={i} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-start gap-4 text-xs font-bold text-slate-800 uppercase tracking-tight shadow-sm">
                        <span className="text-emerald-500 text-lg">→</span> {item}
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

  if (typeof data === 'string') {
    return <p className="text-sm text-slate-700 leading-relaxed font-serif italic border-l-4 border-slate-200 pl-6">"{data}"</p>;
  }

  return null;
};

export const ExecutiveDossier: React.FC<{ lead: Lead }> = ({ lead }) => {
  const dossier: StrategicDossier | null = useMemo(() => dossierStorage.getByLead(lead.id), [lead.id]);
  const assets: AssetRecord[] = useMemo(() => SESSION_ASSETS.filter(a => a.leadId === lead.id), [lead.id]);

  if (!dossier) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-[#0b1021] border border-slate-800 rounded-[48px] m-10">
        <span className="text-5xl mb-6">📂</span>
        <p className="text-[12px] font-black uppercase tracking-[0.5em]">Strategy Manifest Not Found</p>
        <p className="text-xs text-slate-600 mt-3">Initialize 'Campaign Builder' to generate this dossier.</p>
      </div>
    );
  }

  const { data } = dossier;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans selection:bg-emerald-100 dossier-container">
      
      {/* GLOBAL PDF ACTION BAR - Recalibrated Z-Index */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 rounded-[32px] text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center gap-4 border-b-8 border-emerald-800"
        >
          <span className="text-xl">📥</span> SAVE AS MASTER EXECUTIVE PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            overflow: visible !important;
            height: auto !important;
          }
          .dossier-container { 
            width: 100% !important;
            overflow: visible !important;
            height: auto !important;
          }
          .dossier-page { 
            page-break-after: always; 
            padding: 20mm 0 !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-hidden { display: none !important; }
          .section-title { page-break-before: always; }
          h2, h3 { page-break-after: avoid; }
        }
        .dossier-page { min-height: 100vh; padding: 5rem; position: relative; border-bottom: 1px solid #f1f5f9; }
        .emerald-accent { color: #059669; }
      `}</style>

      {/* PAGE 1: MASTER COVER */}
      <section className="dossier-page flex flex-col justify-center items-center text-center bg-[#020617] text-white">
        <div className="absolute top-16 left-16 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-xl">P</div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">PROSPECTOR_OS // GLOBAL_MANIFEST_V3</span>
        </div>
        
        <div className="space-y-16">
            <h4 className="text-[12px] font-black uppercase tracking-[0.8em] text-emerald-500 animate-pulse">CONFIDENTIAL STRATEGIC ARCHITECTURE</h4>
            <div className="space-y-6">
                <h1 className="text-9xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">{lead.businessName}</h1>
                <p className="text-3xl font-serif italic text-slate-400 opacity-80">{lead.niche} // {lead.city.toUpperCase()}</p>
            </div>
            <div className="w-32 h-1.5 bg-emerald-600 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.8)]"></div>
            <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-500">PRODUCED BY THE NEURAL FORGE</p>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
        </div>
      </section>

      {/* PAGE 2: THE EXECUTIVE THESIS */}
      <section className="dossier-page flex flex-col justify-center max-w-5xl mx-auto">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">01 // THE STRATEGIC THESIS</h2>
        <div className="space-y-12">
            <p className="text-5xl font-serif italic leading-tight text-slate-900">
               "{data.narrative}"
            </p>
            <div className="grid grid-cols-2 gap-10 pt-16">
                <div className="p-10 bg-slate-50 border-2 border-slate-100 rounded-[40px] shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">IDENTIFIED MARKET GAP</span>
                    <p className="text-xl font-bold text-slate-900 uppercase italic tracking-tight leading-relaxed">{lead.socialGap}</p>
                </div>
                <div className="p-10 bg-emerald-600 rounded-[40px] text-white shadow-2xl">
                    <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest block mb-4">TRANSFORMATION VECTOR</span>
                    <p className="text-xl font-bold uppercase italic tracking-tight leading-relaxed">{lead.bestAngle}</p>
                </div>
            </div>
        </div>
      </section>

      {/* MASTER ASSETS HUB HEADER */}
      <section className="dossier-page flex flex-col justify-center items-center text-center bg-slate-50">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter text-slate-900">MASTER ASSET <span className="text-emerald-600">INDEX</span></h1>
        <p className="text-sm font-black uppercase tracking-[0.8em] text-slate-400 mt-6 italic">Verbatim Multi-Module Repository</p>
      </section>

      {/* SECTION: CAMPAIGN ARCHITECT */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">02 // CAMPAIGN ARCHITECT</h2>
        <div className="space-y-12">
            <div className="p-12 bg-[#020617] text-white rounded-[56px] shadow-2xl flex flex-col items-center text-center">
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-8">VISUAL DNA & BRAND MOOD</span>
                <p className="text-3xl font-serif italic max-w-3xl leading-relaxed mb-10">"{data.visualDirection?.brandMood}"</p>
                <div className="flex gap-6">
                    {data.visualDirection?.colorPalette?.map((c: any, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-3xl border-4 border-white/10 shadow-2xl" style={{ backgroundColor: c.hex }}></div>
                            <span className="text-[9px] font-black opacity-50 uppercase tracking-widest">{c.color}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                {data.contentPack?.map((item: any, i: number) => (
                    <div key={i} className="p-10 bg-slate-50 border-2 border-slate-100 rounded-[40px] flex flex-col gap-6 shadow-sm">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-4 py-1.5 bg-white border-2 border-emerald-100 rounded-xl w-fit">{item.platform} // {item.type}</span>
                        <p className="text-sm font-medium text-slate-800 italic leading-relaxed border-l-4 border-emerald-500 pl-6">"{item.caption}"</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* SECTION: DECK ARCHITECT */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">03 // DECK ARCHITECT</h2>
        <div className="grid grid-cols-2 gap-8">
           {data.presentation?.slides?.map((slide: any, idx: number) => (
             <div key={idx} className="p-10 border-2 border-slate-100 rounded-[40px] flex flex-col justify-between hover:border-emerald-200 transition-all bg-slate-50/50">
                <div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4 block">SLIDE_0{idx+1} // {slide.category}</span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6 italic">{slide.title}</h3>
                    <ul className="space-y-4">
                        {slide.bullets?.map((b: string, i: number) => (
                            <li key={i} className="text-xs font-bold text-slate-600 flex gap-3 italic">
                                <span className="text-emerald-500 font-black">→</span> {b}
                            </li>
                        ))}
                    </ul>
                </div>
                {slide.insight && (
                  <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-4 italic">"{slide.insight}"</p>
                )}
             </div>
           ))}
        </div>
      </section>

      {/* SECTION: JOURNEY MAPPER */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">04 // JOURNEY MAPPER</h2>
        <div className="space-y-10 max-w-4xl mx-auto">
            {data.funnel?.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-14 relative">
                    {i < data.funnel.length - 1 && <div className="absolute left-8 top-16 w-1 h-14 bg-slate-100"></div>}
                    <div className="w-16 h-16 rounded-[24px] border-4 border-slate-900 bg-white flex items-center justify-center font-black italic text-2xl shrink-0 shadow-lg">0{i+1}</div>
                    <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-10 rounded-[40px] shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">{step.title}</h4>
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-md">GOAL: {step.conversionGoal}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium italic leading-relaxed">"{step.description}"</p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* SECTION: PROPOSAL BUILDER */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">05 // PROPOSAL BUILDER</h2>
        <div className="bg-slate-50 border-2 border-slate-100 p-16 rounded-[64px] shadow-inner">
            <DossierBlockRenderer content={data.proposal} />
        </div>
      </section>

      {/* SECTION: ENGAGEMENT SEQUENCE */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">06 // ENGAGEMENT SEQUENCE</h2>
        <div className="space-y-8">
           {data.outreach?.emailSequence?.map((email: any, i: number) => (
             <div key={i} className="p-10 border-2 border-slate-100 rounded-[40px] space-y-5 bg-slate-50/30">
                <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">DAY {email.day || (i*3+1)} // OUTBOUND</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">{email.purpose}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase">SUBJECT:</span>
                       <p className="text-xs font-black text-slate-900 uppercase italic">{email.subject}</p>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap font-serif border-l-2 border-slate-200 pl-6">"{email.body}"</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* SECTION: PITCH GENERATOR */}
      <section className="dossier-page">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] mb-16 border-b-4 border-slate-900 pb-4 w-fit italic">07 // PITCH GENERATOR</h2>
        <div className="bg-slate-50 border-2 border-slate-100 p-16 rounded-[64px] shadow-inner">
            <DossierBlockRenderer content={data.pitch} />
        </div>
      </section>

      <section className="dossier-page flex flex-col items-center justify-center text-center">
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[1em]">END OF STRATEGIC MANIFEST</p>
             <p className="text-[9px] font-mono text-slate-300 mt-6 uppercase tracking-widest italic">VERIFIED BY PROSPECTOR OS V3.2 // SECURE ARCHIVAL NODE</p>
      </section>
    </div>
  );
};
