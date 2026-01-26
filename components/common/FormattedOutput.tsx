/* =========================================================
   FORMATTED OUTPUT – EXECUTIVE CLEAN RENDERING V4
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

// Aggressive sanitizer to remove markdown noise
const executiveSanitize = (text: string): string => {
  if (!text) return "";
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/```json/gi, '')
    .replace(/```/gi, '')
    .replace(/\*\*/g, '') 
    .replace(/###/g, '')  
    .replace(/##/g, '')   
    .replace(/#/g, '')    
    .replace(/__/g, '')   
    .replace(/_/g, '')    
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
            <div key={idx} className="mb-20 p-20 bg-emerald-600 rounded-[80px] shadow-[0_0_100px_rgba(16,185,129,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000"></div>
              <p className="text-5xl font-black text-white italic tracking-tighter leading-tight relative z-10">"{cleaned}"</p>
              <div className="mt-8 flex gap-4 relative z-10 opacity-40">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>)}
              </div>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-300 leading-relaxed mb-12 text-xl font-normal opacity-95 border-l-8 border-emerald-900/30 pl-12 py-4 font-sans">"{cleaned}"</p>;
        case 'bullets':
          const list = Array.isArray(block.content) ? block.content : [];
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
              {list.map((item: string, i: number) => (
                <div key={i} className="bg-[#0b1021] border-2 border-slate-800 p-8 rounded-[40px] flex items-start gap-6 hover:border-emerald-500/50 transition-all shadow-xl group">
                  <div className="mt-2 w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.8)] group-hover:scale-150 transition-all" />
                  <span className="font-medium text-slate-100 text-lg leading-tight font-sans">{executiveSanitize(item)}</span>
                </div>
              ))}
            </div>
          );
        case 'heading':
          return (
            <div key={idx} className="flex items-center gap-8 mb-12 mt-24 first:mt-0">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic whitespace-nowrap">{cleaned}</h3>
               <div className="h-1 bg-emerald-500/20 flex-1 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500 w-1/4 animate-[slide_4s_infinite]"></div>
               </div>
            </div>
          );
        default:
          return <p key={idx} className="text-slate-400 text-lg mb-8 leading-relaxed font-normal font-sans">{String(cleaned)}</p>;
      }
    };

    return (
      <div className={`space-y-20 animate-in fade-in duration-1000 max-w-6xl mx-auto pb-40 ${className}`}>
        {uiData?.title && (
          <div className="border-b-4 border-slate-800 pb-16 mb-24 text-center">
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none mb-6">{uiData.title}</h1>
            {uiData.subtitle && <p className="text-emerald-500 font-black uppercase tracking-[1em] text-sm italic animate-pulse">{uiData.subtitle}</p>}
          </div>
        )}

        {(uiData?.sections || []).map((section, sIdx) => (
          <section key={sIdx} className="mb-32">
            <div className="flex items-center gap-10 mb-16">
                <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center font-black text-white text-2xl italic shadow-2xl">0{sIdx+1}</div>
                <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter italic whitespace-nowrap">{executiveSanitize(section?.heading || "SEGMENT")}</h2>
                <div className="h-[2px] bg-slate-800 flex-1"></div>
            </div>
            <div className="px-6">
              {(section?.body || []).map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </section>
        ))}
        
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  } catch (fatalError) {
    return (
      <div className="p-20 border-4 border-dashed border-rose-500/20 rounded-[80px] text-center bg-rose-500/5">
        <p className="text-rose-400 font-black uppercase tracking-[0.8em] mb-8">NEURAL_DECODE_FAULT</p>
        <div className="bg-black/80 p-12 rounded-[48px] text-slate-400 font-mono text-sm whitespace-pre-wrap text-left shadow-2xl border border-white/5">
          {content}
        </div>
      </div>
    );
  }
};