import React, { useState, useEffect, useRef } from 'react';
import { Lead, CreativeAsset, Campaign, BrandIdentity } from '../../types';
import { extractBrandDNA, generateVisual, saveAsset, generateVideoPayload, loggedGenerateContent } from '../../services/geminiService';
import { toast } from '../../services/toastManager';

interface BrandDNAProps {
  lead?: Lead;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
}

// UI Modes matching the Pomelli flow
type ViewMode = 'IDLE' | 'SCANNING' | 'DASHBOARD' | 'STRATEGY_SELECT' | 'CAMPAIGN' | 'EDITOR';

interface CampaignConcept {
  id: string;
  title: string;
  hook: string;
  visualDirection: string;
}

export const BrandDNA: React.FC<BrandDNAProps> = ({ lead, onUpdateLead }) => {
  // --- STATE ---
  const [view, setView] = useState<ViewMode>('IDLE');
  const [targetUrl, setTargetUrl] = useState(lead?.websiteUrl || '');
  
  // Data State
  const [adHocLead, setAdHocLead] = useState<Partial<Lead>>({
    id: 'temp-adhoc',
    businessName: 'TARGET BRAND',
    niche: 'Unclassified',
    brandIdentity: undefined
  });

  const activeEntity = lead || adHocLead as Lead;
  const activeIdentity = activeEntity.brandIdentity;

  // Flow State
  const [concepts, setConcepts] = useState<CampaignConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<CampaignConcept | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  
  // Loading States
  const [scanStep, setScanStep] = useState(0);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  const [isGeneratingCreatives, setIsGeneratingCreatives] = useState(false);
  
  // Editor
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [animatingAssetId, setAnimatingAssetId] = useState<string | null>(null);

  const SCAN_STEPS = [
    "Establishing neural link...",
    "Extracting typographic hierarchy...",
    "Sampling chromatic values...",
    "Analyzing brand archetype...",
    "Compiling DNA Matrix..."
  ];

  useEffect(() => {
    if (activeIdentity) {
      setView('DASHBOARD');
    }
  }, [activeIdentity]);

  // --- ACTIONS ---

  const handleExtract = async () => {
    if (!targetUrl.trim()) return;
    
    let safeUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(safeUrl)) safeUrl = `https://${safeUrl}`;
    setTargetUrl(safeUrl); 

    setView('SCANNING');
    setScanStep(0);

    const interval = setInterval(() => {
        setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const brandData = await extractBrandDNA(activeEntity, safeUrl);
      clearInterval(interval);
      
      if (lead && onUpdateLead) {
        onUpdateLead(lead.id, { brandIdentity: brandData });
      } else {
        let name = "TARGET";
        try { name = new URL(safeUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(); } catch (e) {}
        setAdHocLead(prev => ({ ...prev, businessName: name, brandIdentity: brandData }));
      }
      setView('DASHBOARD');
    } catch (e) {
      clearInterval(interval);
      toast.error("Extraction failed.");
      setView('IDLE');
    }
  };

  const generateConcepts = async () => {
    setIsGeneratingConcepts(true);
    try {
        const prompt = `Analyze the brand "${activeEntity.businessName}" (${activeIdentity?.visualTone}). Generate 3 professional campaign concepts. Return JSON array of {title, hook, visualDirection}.`;
        const response = await loggedGenerateContent({
            module: 'BRAND_DNA', contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(response);
        const newConcepts = parsed.map((c: any, i: number) => ({ ...c, id: `concept-${i}` }));
        setConcepts(newConcepts);
        setView('STRATEGY_SELECT');

    } catch (e) {
        toast.error("Failed to generate concepts.");
    } finally {
        setIsGeneratingConcepts(false);
    }
  };

  const handleSelectConcept = async (concept: CampaignConcept) => {
      setSelectedConcept(concept);
      setIsGeneratingCreatives(true);
      setView('CAMPAIGN');

      const timestamp = Date.now();
      const angles = ['STORY', 'PRODUCT', 'LIFESTYLE', 'ABSTRACT'];
      
      try {
          const promises = angles.map(async (angle, idx) => {
              const prompt = `Vertical 9:16 social for ${activeEntity.businessName}. Theme: ${concept.title}. Angle: ${angle}. Colors: ${activeIdentity?.colors.join(', ')}.`;
              const imgUrl = await generateVisual(prompt, activeEntity);
              if (!imgUrl) return null;

              return {
                  id: `creative-${timestamp}-${idx}`,
                  type: 'static' as const,
                  angle: angle as any,
                  imageUrl: imgUrl,
                  headline: idx === 0 ? concept.title : activeEntity.businessName,
                  subhead: concept.hook.slice(0, 40) + "...",
                  cta: "Explore",
                  status: 'ready' as const
              } as CreativeAsset;
          });

          const results = await Promise.all(promises);
          const validAssets = results.filter((r): r is CreativeAsset => r !== null);
          const newCampaign: Campaign = { id: `camp-${timestamp}`, name: concept.title, timestamp, creatives: validAssets };
          setActiveCampaign(newCampaign);
          if (lead && onUpdateLead) {
              const current = lead.campaigns || [];
              onUpdateLead(lead.id, { campaigns: [newCampaign, ...current] });
          }
      } catch (e) {
          toast.error("Asset generation failed.");
      } finally {
          setIsGeneratingCreatives(false);
      }
  };

  const handleSaveAssetToVault = (asset: CreativeAsset) => {
      saveAsset(asset.type === 'motion' ? 'VIDEO' : 'IMAGE', `${asset.headline} - ${asset.angle}`, asset.type === 'motion' && asset.videoUrl ? asset.videoUrl : asset.imageUrl, 'BRAND_DNA', activeEntity.id);
  };

  const handleAnimateAsset = async (asset: CreativeAsset) => {
      setAnimatingAssetId(asset.id);
      try {
          const videoUrl = await generateVideoPayload(`Cinematic animation of ${asset.angle} shot`, activeEntity.id, asset.imageUrl);
          if (videoUrl && activeCampaign) {
              const updatedCreatives = activeCampaign.creatives.map(c => c.id === asset.id ? { ...c, type: 'motion' as const, videoUrl: videoUrl } : c);
              setActiveCampaign({ ...activeCampaign, creatives: updatedCreatives });
          }
      } finally {
          setAnimatingAssetId(null);
      }
  };

  if (view === 'IDLE') {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-[#0b0c0f]">
            <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in duration-700">
                <div className="space-y-6">
                    <span className="text-6xl animate-pulse">🧬</span>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">IDENTITY <span className="text-emerald-500 italic">FORGE</span></h1>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Extract brand DNA and generate social campaigns.</p>
                </div>
                <div className="relative group max-w-lg mx-auto">
                    <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://brand.com" className="w-full bg-[#1a1a1a] border border-slate-800 text-[#e2e2e2] px-8 py-6 rounded-full text-center text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xl" />
                    <button onClick={handleExtract} className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-transform active:scale-95 shadow-xl">Establish DNA</button>
                </div>
            </div>
        </div>
    );
  }

  if (view === 'SCANNING') {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#0b0c0f]">
            <div className="relative w-full max-w-md bg-[#161616] rounded-[32px] p-12 text-center shadow-2xl border border-slate-800/50">
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-white uppercase italic">Processing Identity</h2>
                    <div className="flex justify-center py-8">
                        <div className="relative"><div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div></div>
                    </div>
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#1a1a1a] rounded-full border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{SCAN_STEPS[scanStep]}</span>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (view === 'DASHBOARD' && activeIdentity) {
      return (
          <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-12 animate-in fade-in zoom-in-95 duration-700 bg-[#0b0c0f] min-h-screen">
              <div className="text-center space-y-4">
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-white">BRAND <span className="text-emerald-500 italic">DNA</span></h1>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.4em]">SNAPSHOT: {activeEntity.businessName}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-6">
                      <div className="bg-[#1a1a1a] rounded-[32px] p-10 border border-slate-800 flex flex-col justify-between min-h-[300px]">
                          <div><h2 className="text-4xl font-black text-white uppercase leading-none">{activeEntity.businessName}</h2><a href={targetUrl} target="_blank" className="text-[10px] text-emerald-500 font-mono mt-4 block">{targetUrl}</a></div>
                          <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="bg-[#222] p-6 rounded-[24px]"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block">COLORS</span><div className="flex -space-x-2">{activeIdentity.colors.slice(0,4).map((c, i) => (<div key={i} className="w-10 h-10 rounded-full border-2 border-[#222]" style={{ backgroundColor: c }}></div>))}</div></div>
                              <div className="bg-white p-6 rounded-[24px] text-black flex flex-col justify-center items-center"><span className="text-[9px] font-black opacity-50 uppercase mb-1">TYPE</span><span className="text-2xl font-black italic">Aa</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="lg:col-span-7 bg-[#1a1a1a] rounded-[32px] p-8 border border-slate-800">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">DETECTED ELEMENTS</h3>
                      <div className="grid grid-cols-3 gap-4">
                          {activeIdentity.extractedImages?.map((img, i) => (<div key={i} className="aspect-[3/4] bg-black rounded-2xl overflow-hidden relative group border border-slate-800 hover:border-emerald-500 transition-all cursor-pointer"><img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" /></div>))}
                      </div>
                  </div>
              </div>

              <div className="flex justify-end pt-8">
                  <button onClick={generateConcepts} disabled={isGeneratingConcepts} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all shadow-xl">{isGeneratingConcepts ? 'ARCHITECTING...' : 'GENERATE CAMPAIGNS →'}</button>
              </div>
          </div>
      );
  }

  return <div className="h-screen flex items-center justify-center">Loading view state...</div>;
};
