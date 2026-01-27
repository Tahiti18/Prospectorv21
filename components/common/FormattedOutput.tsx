/* =========================================================
   FORMATTED OUTPUT – FRIENDLY PROFESSIONAL V11
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

const professionalSanitize = (text: string): string => {
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

const deconstructJsonToBlocks = (data: any, depth = 0): UIBlock[] => {
  const blocks: UIBlock[] = [];
  if (typeof data === 'string') {
    blocks.push({ type: 'p', content: data });
  } else if (Array.isArray(data)) {
    if (data.every(i => typeof i === 'string')) {
      blocks.push({ type: 'bullets', content: data });
    } else {
      data.forEach(item => blocks.push(...deconstructJsonToBlocks(item, depth + 1)));
    }
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, val]) => {
      const heading = key.replace(/_/g, ' ').toUpperCase();
      blocks.push({ type: 'heading', content: heading });
      blocks.push(...deconstructJsonToBlocks(val, depth + 1));
    });
  }
  return blocks;
};

const promoteToStrategicReport = (input: any): UIBlocks => {
  if (typeof input === 'string') {
    return {
      format: 'ui_blocks',
      title: "Strategy Overview",
      subtitle: "EXECUTIVE SUMMARY",
      sections: [{ heading: "STRATEGIC OVERVIEW", body: [{ type: 'p', content: input }] }]
    };
  }
  const sections = Object.entries(input).map(([key, val]) => ({
    heading: key.replace(/_/g, ' ').toUpperCase(),
    body: deconstructJsonToBlocks(val)
  }));
  return { format: 'ui_blocks', title: "Project Analysis", subtitle: "DATA SYNTHESIS", sections };
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
      const cleaned = typeof block.content === 'string' ? professionalSanitize(block.content) : block.content;

      switch (block.type) {
        case 'hero':
          return (
            <div key={idx} className="mb-8 p-6 bg-emerald-600 rounded-[28px] shadow-xl relative overflow-hidden group border-b-4 border-emerald-800">
              <p className="text-lg font-bold text-white tracking-tight leading-snug relative z-10 font-sans">"{cleaned}"</p>
              <div className="mt-2 flex gap-2 relative z-10 opacity-20 font-black text-[8px] uppercase tracking-widest text-white">STRATEGIC_HIGHLIGHT</div>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-800 leading-relaxed mb-4 text-sm font-normal border-l-2 border-emerald-500/20 pl-4 py-0.5 font-sans">{cleaned}</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3 hover:border-emerald-500/20 transition-all shadow-sm group">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700 text-[11px] leading-tight uppercase tracking-tight font-sans">{professionalSanitize(item)}</span>
                </div>
              ))}
            </div>
          );
        case 'heading':
          return (
            <div key={idx} className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
               <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap font-sans">{cleaned}</h3>
               <div className="h-px bg-emerald-500/10 flex-1 rounded-full"></div>
            </div>
          );
        default:
          return <p key={idx} className="text-slate-700 text-sm mb-4 leading-relaxed font-normal font-sans">{String(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-8 animate-in fade-in duration-1000 max-w-5xl mx-auto pb-10 ${className}`}>
        {uiData?.title && (
          <div className="border-b border-slate-100 pb-6 mb-8 text-center">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mb-2 font-sans">{uiData.title}</h1>
            {uiData.subtitle && <p className="text-emerald-600 font-black uppercase tracking-[0.6em] text-[9px] font-sans">{uiData.subtitle}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-black text-white text-xs italic shadow-md shrink-0">0{sIdx+1}</div>
                <h2 className="text-2xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap font-sans">{professionalSanitize(section?.heading || "SECTION")}</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            <div className="px-2">
              {(section?.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
      </div>
    );
  } catch (fatalError) {
    return (
      <div className="p-8 border-2 border-rose-500/10 rounded-2xl text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-[0.4em] mb-4 font-sans text-[9px]">DATA_LOAD_ERROR</p>
        <div className="bg-black/90 p-6 rounded-xl text-slate-400 font-mono text-xs whitespace-pre-wrap text-left shadow-xl border border-white/5 overflow-auto max-h-64">
          {content}
        </div>
      </div>
    );
  }
};
