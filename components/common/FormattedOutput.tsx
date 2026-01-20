/* =========================================================
   FORMATTED OUTPUT – EXECUTIVE RENDERING V2
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
    .replace(/```json/gi, '')
    .replace(/```/gi, '')
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
      title: "Intelligence Briefing",
      subtitle: "NEURAL SYNTHESIS",
      sections: [{ heading: "STRATEGIC OVERVIEW", body: [{ type: 'p', content: input }] }]
    };
  }

  // Deconstruct object keys into sections
  const sections = Object.entries(input).map(([key, val]) => ({
    heading: key.replace(/_/g, ' ').toUpperCase(),
    body: deconstructJsonToBlocks(val)
  }));

  return {
    format: 'ui_blocks',
    title: "Project Analysis",
    subtitle: "STRUCTURAL DECONSTRUCTION",
    sections
  };
};

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, className = "" }) => {
  if (!content) return null;

  try {
    let uiData: UIBlocks | null = null;
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
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
            <div key={idx} className="mb-12 p-12 bg-emerald-600 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000"></div>
              <p className="text-3xl font-black text-white italic tracking-tight leading-none relative z-10 uppercase">"{cleaned}"</p>
              <div className="mt-4 flex gap-2 relative z-10 opacity-60">
                <div className="w-1 h-1 rounded-full bg-white"></div>
                <div className="w-1 h-1 rounded-full bg-white"></div>
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-300 leading-relaxed mb-8 text-lg font-medium opacity-90 border-l-4 border-slate-800 pl-8 py-2 italic font-serif">"{cleaned}"</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 gap-4 mb-12">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] flex items-start gap-4 hover:border-emerald-500/30 transition-all shadow-sm">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="font-bold text-slate-200 uppercase tracking-wide text-xs">{item}</span>
                </div>
              ))}
            </div>
          );
        case 'heading':
          return <h3 key={idx} className="text-xl font-black text-emerald-500 uppercase tracking-tighter italic mb-6 mt-12 border-b border-emerald-900/30 pb-3 flex items-center gap-4">
            <span className="w-8 h-[2px] bg-emerald-500/30"></span>
            {cleaned}
          </h3>;
        default:
          return <p key={idx} className="text-slate-400 text-sm mb-4 leading-relaxed italic">{String(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-12 animate-in fade-in duration-700 max-w-4xl mx-auto ${className}`}>
        {uiData?.title && (
          <div className="border-b-2 border-slate-800 pb-8 mb-12">
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none mb-3">{uiData.title}</h1>
            {uiData.subtitle && <p className="text-emerald-500 font-black uppercase tracking-[0.5em] text-[9px] italic">{uiData.subtitle}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="mb-20">
            <div className="flex items-center gap-6 mb-10">
                <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.5em] italic whitespace-nowrap bg-emerald-900/10 px-4 py-1.5 rounded-lg border border-emerald-500/20">{section?.heading || "SEGMENT"}</h2>
                <div className="h-[1px] bg-slate-800 flex-1"></div>
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
      <div className="p-12 border-2 border-dashed border-rose-500/20 rounded-[40px] text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-[0.4em] mb-4">NEURAL RENDERING EXCEPTION</p>
        <div className="bg-black/50 p-8 rounded-3xl text-slate-400 font-mono text-[11px] whitespace-pre-wrap text-left">
          {content}
        </div>
      </div>
    );
  }
};