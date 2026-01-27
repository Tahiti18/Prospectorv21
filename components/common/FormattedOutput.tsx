/* =========================================================
   FORMATTED OUTPUT – EXECUTIVE CLEAN RENDERING V15
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
    // Aggressive markdown strip
    .replace(/\*\*(.*?)\*\*/g, '$1') // Strip double asterisks
    .replace(/\*(.*?)\*/g, '$1')     // Strip single asterisks
    .replace(/__(.*?)__/g, '$1')     // Strip double underscores
    .replace(/_(.*?)_/g, '$1')       // Strip single underscores
    .replace(/#{1,6}\s?/g, '')      // Strip all header hashes
    .replace(/\[|\]/g, '')           // Strip brackets
    .replace(/`{1,3}/g, '')          // Strip backticks
    .replace(/~~/g, '')              // Strip strikethrough
    .replace(/---\s?/g, '')          // Strip horizontal rules
    .replace(/\s{2,}/g, ' ')         // Collapse multiple spaces
    .trim();
};

const promoteToStrategicReport = (input: any): UIBlocks => {
  if (typeof input === 'string') {
    return {
      format: 'ui_blocks',
      title: "Strategic Analysis",
      subtitle: "DATA SYNTHESIS",
      sections: [{ heading: "OVERVIEW", body: [{ type: 'p', content: input }] }]
    };
  }
  return { format: 'ui_blocks', title: "Strategy Session", subtitle: "NEURAL CORE", sections: [] };
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
      
      // Auto-detect if a paragraph block is acting as a markdown heading
      if (block.type === 'p' && typeof block.content === 'string') {
        const raw = block.content.trim();
        if (raw.startsWith('**') && raw.endsWith('**')) {
           return (
            <div key={idx} className="flex items-center gap-4 mb-8 mt-12 first:mt-0">
               <h3 className="text-4xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap font-sans">
                  {executiveSanitize(raw)}
               </h3>
               <div className="h-px bg-emerald-500/10 flex-1 rounded-full"></div>
            </div>
           );
        }
      }

      const cleaned = typeof block.content === 'string' ? executiveSanitize(block.content) : block.content;

      switch (block.type) {
        case 'hero':
          return (
            <div key={idx} className="mb-10 p-10 bg-emerald-600 rounded-[48px] shadow-2xl relative overflow-hidden group border-b-8 border-emerald-800">
              <p className="text-2xl font-black text-white italic tracking-tighter leading-tight relative z-10 font-sans">"{cleaned}"</p>
              <div className="mt-4 flex gap-2 relative z-10 opacity-20 font-black text-[9px] uppercase tracking-widest text-white">STRATEGIC_PROTOCOL</div>
            </div>
          );
        case 'p':
          return <p key={idx} className="text-slate-800 leading-relaxed mb-8 text-base font-medium border-l-4 border-emerald-500/10 pl-8 py-1 font-sans">{cleaned}</p>;
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
      <div className={`space-y-12 animate-in fade-in duration-700 ${className}`}>
        {(uiData?.title || uiData?.subtitle) && (
          <div className="border-b-2 border-emerald-500/20 pb-8 mb-12">
            {uiData.subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{uiData.subtitle}</p>}
            {uiData.title && <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{uiData.title}</h2>}
          </div>
        )}

        {uiData?.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-tighter italic whitespace-nowrap">{section.heading}</h3>
              <div className="h-px bg-emerald-500/10 flex-1 rounded-full"></div>
            </div>
            <div className="space-y-4">
              {section.body.map((block, bIdx) => renderBlock(block, bIdx))}
            </div>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    return (
      <div className={`whitespace-pre-wrap font-sans text-slate-700 leading-relaxed ${className}`}>
        {executiveSanitize(content)}
      </div>
    );
  }
};