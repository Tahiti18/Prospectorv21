/* =========================================================
   FORMATTED OUTPUT – EXECUTIVE CLEAN RENDERING V12
   ========================================================= */

import React from 'react';

interface UIBlock {
  type: 'p' | 'bullets' | 'table' | 'callout' | 'scorecard' | 'steps' | 'heading' | 'hero' | 'timeline';
  content?: string | string[] | any;
  label?: string;
  value?: string | number;
}

interface UIBlocks {
  format: 'ui_blocks';
  title?: string;
  subtitle?: string;
  sections: Array<{
    heading: string;
    body: UIBlock[];
  }>;
}

interface FormattedOutputProps {
  content: string | null | undefined;
  className?: string;
}

const executiveSanitize = (text: string): string => {
  if (!text) return "";
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/^```json/gi, '')
    .replace(/^```/gi, '')
    .replace(/```$/gi, '')
    .replace(/#/g, '')    
    .replace(/\*/g, '')   
    .replace(/__/g, '')   
    .replace(/~~/g, '')   
    .replace(/\[|\]/g, '') 
    .replace(/---/g, '')   
    .replace(/\s{2,}/g, ' ') 
    .trim();
};

const promoteToStrategicReport = (input: any): UIBlocks => {
  if (typeof input === 'string') {
    return {
      format: 'ui_blocks',
      title: "Strategic Overview",
      subtitle: "EXECUTIVE SUMMARY",
      sections: [{ heading: "STRATEGIC OVERVIEW", body: [{ type: 'p', content: input }] }]
    };
  }
  return { format: 'ui_blocks', title: "Project Analysis", subtitle: "DATA SYNTHESIS", sections: [] };
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  try {
    let uiData: UIBlocks | null = null;
    const trimmed = content.trim();
    const cleanJsonStr = trimmed.replace(/^```json/, '').replace(/```$/, '').trim();

    if (cleanJsonStr.startsWith('{') || cleanJsonStr.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleanJsonStr);
        if (parsed.sections) uiData = parsed;
        else uiData = promoteToStrategicReport(parsed);
      } catch (e) {
        uiData = promoteToStrategicReport(content);
      }
    } else {
      uiData = promoteToStrategicReport(content);
    }

    const renderBlock = (block: UIBlock, idx: number) => {
      if (!block) return null;
      const cleaned = typeof block.content === 'string' ? executiveSanitize(block.content) : block.content;

      switch (block.type) {
        case 'hero':
          return (
            <div key={idx} className="mb-10 p-10 bg-emerald-600 rounded-[48px] shadow-2xl relative overflow-hidden group border-b-8 border-emerald-800">
              <p className="text-2xl font-black text-white italic tracking-tighter leading-tight relative z-10 font-sans">"{cleaned}"</p>
              <div className="mt-4 flex gap-2 relative z-10 opacity-20 font-black text-[9px] uppercase tracking-widest text-white">STRATEGIC_ANCHOR</div>
            </div>
          );
        case 'p':
          // Strictly no drop-caps or decorative logic
          return <p key={idx} className="text-slate-800 leading-relaxed mb-6 text-base font-medium border-l-4 border-emerald-500/10 pl-8 py-0.5 font-sans">{cleaned}</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex items-start gap-4 hover:border-emerald-500/20 transition-all shadow-sm group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700 text-[12px] leading-snug uppercase tracking-tight font-sans">{executiveSanitize(item)}</span>
                </div>
              ))}
            </div>
          );
        case 'heading':
          // Size matching Executive Dashboard Overview (4xl equivalent)
          return (
            <div key={idx} className="flex items-center gap-4 mb-8 mt-12 first:mt-0">
               <h3 className="text-4xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap font-sans">{cleaned}</h3>
               <div className="h-px bg-emerald-500/10 flex-1 rounded-full"></div>
            </div>
          );
        default:
          return <p key={idx} className="text-slate-700 text-base mb-6 leading-relaxed font-normal font-sans">{String(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-12 animate-in fade-in duration-1000 max-w-6xl mx-auto pb-20 ${className}`}>
        {uiData?.title && (
          <div className="border-b border-slate-100 pb-10 mb-16 text-center">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mb-4 font-sans">{uiData.title}</h1>
            {uiData.subtitle && <p className="text-emerald-600 font-black uppercase tracking-[0.8em] text-[10px] italic font-sans">{uiData.subtitle}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="mb-20">
            <div className="flex items-center gap-6 mb-10">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-xl italic shadow-2xl shrink-0">0{sIdx+1}</div>
                <h2 className="text-4xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap font-sans">{executiveSanitize(section?.heading || "SEGMENT")}</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            <div className="px-4">
              {(section?.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  } catch (fatalError) {
    return (
      <div className="p-16 border-2 border-rose-500/10 rounded-[48px] text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-[0.5em] mb-4 font-sans text-[10px]">PARSING_FAULT</p>
        <div className="bg-black/90 p-10 rounded-[32px] text-slate-400 font-mono text-xs whitespace-pre-wrap text-left shadow-2xl border border-white/5 overflow-auto max-h-96">
          {content}
        </div>
      </div>
    );
  }
};