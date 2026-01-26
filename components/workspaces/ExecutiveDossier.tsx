
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
      return <p className="text-[11px] text-slate-700 leading-relaxed font-serif border-l-2 border-slate-200 pl-4 mb-4">"{content}"</p>;
    }
  }

  if (data && data.sections) {
    return (
      <div className="space-y-6">
        {data.sections.map((section: any, sIdx: number) => (
          <div key={sIdx} className="space-y-3 break-inside-avoid">
            <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1">{section.heading}</h4>
            <div className="space-y-2">
              {section.body?.map((block: any, bIdx: number) => {
                if (block.type === 'hero') return <div key={bIdx} className="p-4 bg-slate-50 border-l-4 border-emerald-500 rounded-r-xl text-slate-900 text-sm font-black italic uppercase tracking-tight">"{block.content}"</div>;
                if (block.type === 'p') return <p key={bIdx} className="text-[10px] text-slate-700 leading-relaxed font-serif italic border-l border-slate-100 pl-4 py-0.5">"{block.content}"</p>;
                if (block.type === 'bullets') return (
                  <ul key={bIdx} className="space-y-1.5">
                    {block.content?.map((item: string, i: number) => (
                      <li key={i} className="bg-white border border-slate-100 p-2 rounded-lg flex items-start gap-2 text-[9px] font-bold text-slate-800 uppercase tracking-tight break-inside-avoid">
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

  return <p className="text-[10px] text-slate-700 leading-relaxed font-serif italic border-l border-slate-100 pl-4">"{String(data)}"</p>;
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
      
      {/* GLOBAL PDF ACTION BAR */}
      <div className="fixed bottom-8 right-8 z-[9999] print:hidden flex flex-col items-end gap-3">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-2xl max-w-[240px]">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PDF GENERATION READY
            </p>
            <p className="text-[8px] text-slate-400 leading-relaxed uppercase font-bold">
              Tip: Pinch to zoom OUT on the print preview thumbnails to convert this document to a digital PDF file.
            </p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-4 border-emerald-800"
        >
          <span className="text-lg">📥</span> SAVE DIGITAL PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 10mm; 
          }
          
          html, body, .dossier-container {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .print-hidden { display: none !important; }
          
          .dossier-page { 
            page-break-after: auto; 
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            display: block !important;
            width: 100% !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            border-bottom: none !important;
          }

          /* Force Cover to be exactly one page */
          .dossier-cover {
            page-break-after: always !important;
            height: 277mm !important; 
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: #020617 !important;
            color: white !important;
          }

          .break-inside-avoid { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
          }

          /* Reset all scaling fonts to standard point sizes for print */
          h1 { font-size: 32pt !important; line-height: 1.1 !important; margin-bottom: 20pt !important; }
          h2 { font-size: 14pt !important; line-height: 1.2 !important; margin-bottom: 12pt !important; margin-top: 24pt !important; border-bottom: 1px solid #000 !important; width: 100% !important; display: block !important; }
          h3 { font-size: 11pt !important; margin-bottom: 8pt !important; }
          p, li { font-size: 9pt !important; line-height: 1.3 !important; }
          
          /* Forced colors for Safari/Chrome */
          .bg-[#020617] { background: #020617 !important; -webkit-print-color-adjust: exact; color: white !important; }
          .bg-emerald-600 { background: #059669 !important; -webkit-print-color-adjust: exact; color: white !important; }
          .bg-slate-50 { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .text-emerald-500 { color: #059669 !important; }
          .text-emerald-400 { color: #10b981 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          
          /* Reset margins for content blocks */
          .max-w-4xl { max-width: 100% !important; padding: 0 10pt !important; margin: 0 !important; }
          .space-y-16 > :not([hidden]) ~ :not([hidden]) { margin-top: 20pt !important; }
          .grid { display: block !important; }
          .grid-cols-1, .grid-cols-2 { display: block !important; }
          .grid > *, .grid-cols-2 > * { width: 100% !important; margin-bottom: 8pt !important; }
        }

        .dossier-page { min-height: 100vh; padding: 4rem; position: relative; border-bottom: 1px solid #f1f5f9; }
      `}</style>

      {/* PAGE 1: MASTER COVER */}
      <section className="dossier-page dossier-cover flex flex-col justify-center items-center text-center bg-[#020617] text-white">
        <div className="absolute top-12 left-12 flex items-center gap-3 print:top-10 print:left-10">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-black text-lg">P</div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">PROSPECTOR_OS // MASTER_MANIFEST</span>
        </div>
        
        <div className="space-y-12 print:space-y-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500">CONFIDENTIAL STRATEGIC ARCHITECTURE</h4>
            <div className="space-y-4">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-tight text-white">{lead.businessName}</h1>
                <p className="text-xl font-serif italic text-slate-400 opacity-80">{lead.niche} // {lead.city.toUpperCase()}</p>
            </div>
            <div className="w-24 h-1 bg-emerald-600 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">PRODUCED BY THE NEURAL FORGE</p>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
        </div>
      </section>

      {/* FLOWABLE CONTENT */}
      <div className="max-w-4xl mx-auto space-y-16 py-12 px-6 print:space-y-8 print:py-4">
        
        {/* SECTION 01: THESIS */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">01 // THE STRATEGIC THESIS</h2>
          <div className="space-y-8 print:space-y-4">
              <p className="text-2xl font-serif italic leading-snug text-slate-900 print:text-xl">
                 "{data.narrative}"
              </p>
              <div className="grid grid-cols-1 gap-6 pt-6 print:pt-2">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl break-inside-avoid print:p-4 print:rounded-xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">IDENTIFIED MARKET GAP</span>
                      <p className="text-base font-bold text-slate-900 uppercase italic tracking-tight print:text-sm">{lead.socialGap}</p>
                  </div>
                  <div className="p-6 bg-emerald-600 rounded-3xl text-white shadow-xl break-inside-avoid print:p-4 print:rounded-xl">
                      <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest block mb-1">TRANSFORMATION VECTOR</span>
                      <p className="text-base font-bold uppercase italic tracking-tight print:text-sm">{lead.bestAngle}</p>
                  </div>
              </div>
          </div>
        </section>

        {/* SECTION 02: CAMPAIGN ARCHITECT */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">02 // CAMPAIGN ARCHITECT</h2>
          <div className="space-y-8 print:space-y-4">
              <div className="p-8 bg-[#020617] text-white rounded-[40px] shadow-xl flex flex-col items-center text-center break-inside-avoid print:p-6 print:rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 print:mb-3">VISUAL DNA & BRAND MOOD</span>
                  <p className="text-xl font-serif italic max-w-2xl leading-relaxed mb-6 print:text-lg print:mb-4">"{data.visualDirection?.brandMood}"</p>
                  <div className="flex gap-3">
                      {data.visualDirection?.colorPalette?.slice(0, 4).map((c: any, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                              <div className="w-10 h-10 rounded-xl border border-white/10 print:w-8 print:h-8" style={{ backgroundColor: c.hex }}></div>
                              <span className="text-[7px] font-black opacity-50 uppercase tracking-tighter">{c.color}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                  {data.contentPack?.slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 break-inside-avoid print:p-3 print:rounded-lg">
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-white border border-emerald-100 rounded-lg w-fit">{item.platform} // {item.type}</span>
                          <p className="text-xs font-medium text-slate-800 italic leading-relaxed border-l-2 border-emerald-500 pl-4 print:text-[10px]">"{item.caption}"</p>
                      </div>
                  ))}
              </div>
          </div>
        </section>

        {/* SECTION 03: DECK ARCHITECT */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">03 // DECK ARCHITECT</h2>
          <div className="space-y-4 print:space-y-2">
             {data.presentation?.slides?.map((slide: any, idx: number) => (
               <div key={idx} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 break-inside-avoid print:p-4 print:rounded-xl">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">SLIDE_0{idx+1} // {slide.category}</span>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900 mb-2 italic print:text-sm">{slide.title}</h3>
                  <ul className="space-y-1.5">
                      {slide.bullets?.map((b: string, i: number) => (
                          <li key={i} className="text-[10px] font-bold text-slate-600 flex gap-2 italic print:text-[9px]">
                              <span className="text-emerald-500">•</span> {b}
                          </li>
                      ))}
                  </ul>
               </div>
             ))}
          </div>
        </section>

        {/* SECTION 04: JOURNEY MAPPER */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">04 // JOURNEY MAPPER</h2>
          <div className="space-y-4 print:space-y-2">
              {data.funnel?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4 break-inside-avoid">
                      <div className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-white flex items-center justify-center font-black italic text-base shrink-0 print:w-6 print:h-6 print:text-sm">0{i+1}</div>
                      <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-sm print:p-3 print:rounded-xl">
                          <div className="flex justify-between items-center mb-1.5">
                              <h4 className="text-sm font-black uppercase italic text-slate-900 print:text-xs">{step.title}</h4>
                              <span className="text-[7px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">GOAL: {step.conversionGoal}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed print:text-[9px]">"{step.description}"</p>
                      </div>
                  </div>
              ))}
          </div>
        </section>

        {/* SECTION 05: PROPOSAL BUILDER */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">05 // PROPOSAL BUILDER</h2>
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] print:p-6 print:rounded-2xl">
              <DossierBlockRenderer content={data.proposal} />
          </div>
        </section>

        {/* SECTION 06: ENGAGEMENT SEQUENCE */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">06 // ENGAGEMENT SEQUENCE</h2>
          <div className="space-y-3 print:space-y-2">
             {data.outreach?.emailSequence?.slice(0, 7).map((email: any, i: number) => (
               <div key={i} className="p-5 border border-slate-100 rounded-2xl space-y-2 bg-slate-50/30 break-inside-avoid print:p-3 print:rounded-xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DAY {email.day || (i*3+1)} // {email.purpose}</span>
                  </div>
                  <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-900 uppercase italic print:text-[8px]"><span className="text-slate-400 not-italic">RE:</span> {email.subject}</p>
                      <p className="text-[9px] text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap font-serif border-l border-slate-200 pl-4 print:text-[8px] print:pl-2">"{email.body}"</p>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* SECTION 07: PITCH GENERATOR */}
        <section className="dossier-page">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-10 border-b-2 border-slate-900 pb-2 w-fit italic">07 // PITCH GENERATOR</h2>
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] print:p-6 print:rounded-2xl">
              <DossierBlockRenderer content={data.pitch} />
          </div>
        </section>

        {/* FOOTER */}
        <section className="dossier-page flex flex-col items-center justify-center text-center py-20 break-inside-avoid print:py-10">
               <div className="w-12 h-12 bg-[#020617] rounded-2xl flex items-center justify-center text-xl mb-6 print:w-8 print:h-8 print:text-sm">P</div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">END OF STRATEGIC MANIFEST</p>
               <p className="text-[7px] font-mono text-slate-300 mt-2 uppercase tracking-widest italic">ARCHIVED SECURELY BY PROSPECTOR OS V3.2</p>
        </section>
      </div>
    </div>
  );
};
