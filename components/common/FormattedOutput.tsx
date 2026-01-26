/* =========================================================
   FORMATTED OUTPUT – EXECUTIVE CLEAN RENDERING V6
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
    .replace(/#/g, '')    // Remove all hashtags
    .replace(/\*/g, '')   // Remove all asterisks
    .replace(/__/g, '')   // Remove underscores
    .replace(/~~/g, '')   // Remove strikethrough
    .replace(/\[|\]/g, '') // Remove brackets
    .replace(/\s{2,}/g, ' ') // Collapse extra spaces
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
  const sections = Object.entries(input).map(([key, val]) => ({
    heading: key.replace(/_/g, ' ').toUpperCase(),
    body: deconstructJsonToBlocks(val)
  }));
  return { format: 'ui_blocks', title: "Project Analysis", subtitle: "STRUCTURAL DECONSTRUCTION", sections };
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
            <div key={idx} className="mb-12 p-12 bg-emerald-600 rounded-[48px] shadow-2xl relative overflow-hidden group border-b-8 border-emerald-800">
              <p className="text-3xl font-black text-white italic tracking-tighter leading-tight relative z-10 font-sans">"{cleaned}"</p>
              <div className="mt-6 flex gap-2 relative z-10 opacity-20 font-black text-[10px] uppercase tracking-widest text-white">PROSPECTOR_DNA_ANCHOR</div>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-800 leading-relaxed mb-8 text-lg font-medium border-l-4 border-emerald-500/20 pl-8 py-2 font-sans">{cleaned}</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex items-start gap-4 hover:border-emerald-500/30 transition-all shadow-sm group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="font-bold text-slate-700 text-[13px] leading-snug uppercase tracking-tight font-sans">{executiveSanitize(item)}</span>
                </div>
              ))}
            </div>
          );
        case 'steps':
          const stepsList = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="space-y-4 mb-12">
              {stepsList.map((step: string, i: number) => (
                <div key={i} className="flex gap-6 items-center p-6 bg-white border border-slate-200 rounded-3xl group hover:border-emerald-500/40 transition-all">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black italic text-white shadow-xl">{i+1}</div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight font-sans">{executiveSanitize(step)}</p>
                </div>
              ))}
            </div>
          );
        case 'scorecard':
          return (
            <div key={idx} className="bg-slate-50 border-2 border-slate-200 p-6 rounded-3xl flex justify-between items-center mb-6 shadow-inner">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{block.label || 'METRIC'}</span>
               <span className="text-xl font-black italic text-emerald-600 uppercase tracking-tighter">{block.value}</span>
            </div>
          );
        case 'callout':
          return (
            <div key={idx} className="p-8 bg-emerald-50 border-l-8 border-emerald-500 rounded-r-3xl mb-12 italic text-emerald-900 font-serif text-lg leading-relaxed">
              "{cleaned}"
            </div>
          );
        case 'heading':
          return (
            <div key={idx} className="flex items-center gap-6 mb-8 mt-16 first:mt-0">
               <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-widest italic whitespace-nowrap font-sans">{cleaned}</h3>
               <div className="h-1 bg-emerald-500/10 flex-1 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500 w-1/4"></div>
               </div>
            </div>
          );
        case 'timeline':
          const timelineEvents = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="space-y-6 mb-12 border-l-2 border-slate-200 ml-4 pl-10">
              {timelineEvents.map((ev: any, i: number) => (
                <div key={i} className="relative">
                   <div className="absolute -left-[45px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-4 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ev.label || `PHASE 0${i+1}`}</span>
                      <p className="text-sm font-bold text-slate-700 uppercase tracking-tight font-sans">{typeof ev === 'string' ? executiveSanitize(ev) : executiveSanitize(ev.content)}</p>
                   </div>
                </div>
              ))}
            </div>
          );
        default:
          return <p key={idx} className="text-slate-700 text-lg mb-8 leading-relaxed font-normal font-sans">{String(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-12 animate-in fade-in duration-1000 max-w-6xl mx-auto pb-40 ${className}`}>
        {uiData?.title && (
          <div className="border-b border-slate-200 pb-10 mb-16 text-center">
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mb-4 font-sans">{uiData.title}</h1>
            {uiData.subtitle && <p className="text-emerald-600 font-black uppercase tracking-[0.8em] text-[10px] italic animate-pulse font-sans">{uiData.subtitle}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="mb-20">
            <div className="flex items-center gap-8 mb-10">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-xl italic shadow-2xl shrink-0">0{sIdx+1}</div>
                <h2 className="text-3xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap font-sans">{executiveSanitize(section?.heading || "SEGMENT")}</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
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
      <div className="p-16 border-2 border-rose-500/20 rounded-[48px] text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-[0.6em] mb-6 font-sans">SYNTHESIS_PARSING_FAULT</p>
        <div className="bg-black/90 p-10 rounded-[32px] text-slate-400 font-mono text-xs whitespace-pre-wrap text-left shadow-2xl border border-white/5 overflow-auto max-h-96">
          {content}
        </div>
      </div>
    );
  }
};