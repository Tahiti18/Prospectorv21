
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V23 (HIGH-DENSITY FORGE)
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";
export type { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity };

const DEFAULT_MODEL = "google/gemini-3-flash-preview"; 

const KEY_STORAGE_OR = 'pomelli_os_or_key';
const KEY_STORAGE_KIE = 'pomelli_os_kie_key';

export const SESSION_ASSETS: AssetRecord[] = [];
export const PRODUCTION_LOGS: string[] = [];
const logListeners = new Set<(logs: string[]) => void>();

export function subscribeToLogs(callback: (logs: string[]) => void) {
  logListeners.add(callback);
  callback([...PRODUCTION_LOGS]);
  return () => { logListeners.delete(callback); };
}

export function pushLog(message: string) {
  const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
  PRODUCTION_LOGS.unshift(entry);
  if (PRODUCTION_LOGS.length > 200) PRODUCTION_LOGS.pop();
  logListeners.forEach(l => l([...PRODUCTION_LOGS]));
}

/* =========================================================
   PERSISTENCE LOGIC
   ========================================================= */

export function getStoredKeys() {
  return {
    openRouter: localStorage.getItem(KEY_STORAGE_OR) || "",
    kie: localStorage.getItem(KEY_STORAGE_KIE) || ""
  };
}

export function setStoredKeys(orKey: string, kieKey: string) {
  if (orKey) localStorage.setItem(KEY_STORAGE_OR, orKey);
  if (kieKey) localStorage.setItem(KEY_STORAGE_KIE, kieKey);
  pushLog("INFRASTRUCTURE_KEY_COMMIT: Keys updated and persisted.");
  return true;
}

/* =========================================================
   ASSET HELPERS
   ========================================================= */

export function saveAsset(
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO',
  title: string,
  data: string,
  module: string,
  leadId?: string,
  metadata?: any
): AssetRecord {
  const asset: AssetRecord = {
    id: `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type: type as any,
    title,
    data,
    timestamp: Date.now(),
    module,
    leadId,
    metadata
  };
  SESSION_ASSETS.push(asset);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  pushLog(`ASSET_SAVED: [${type}] ${title}`);
  return asset;
}

const assetListeners = new Set<(assets: AssetRecord[]) => void>();

export function subscribeToAssets(callback: (assets: AssetRecord[]) => void) {
  assetListeners.add(callback);
  callback([...SESSION_ASSETS]);
  return () => { assetListeners.delete(callback); };
}

export function deleteAsset(id: string) {
  const idx = SESSION_ASSETS.findIndex(a => a.id === id);
  if (idx >= 0) {
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
  }
}

export function clearVault() {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
}

export function importVault(assets: AssetRecord[]) {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
}

/* =========================================================
   OPENROUTER CORE CLIENT & PARSER
   ========================================================= */

function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) return JSON.parse(match[1]);
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
          return JSON.parse(text.substring(start, end + 1));
      }
    } catch (inner) {
      console.error("JSON Extraction failed", inner);
    }
  }
  return null;
}

async function callOpenRouter(prompt: string, systemInstruction?: string): Promise<GeminiResult<string>> {
  try {
    const keys = getStoredKeys();
    const apiKey = keys.openRouter || process.env.API_KEY;
    const modelId = DEFAULT_MODEL;

    if (!apiKey) {
        throw new Error("AUTHORIZATION_REQUIRED: Set OpenRouter key in Settings.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction || "You are Prospector OS. Output ONLY raw JSON when requested. No chatter." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7 // Slight creativity for campaign drafting
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "OpenRouter internal error");

    const text = data.choices[0].message.content;
    deductCost(modelId, (prompt.length + text.length));
    
    return { ok: true, text: text, raw: data };
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    return { ok: false, text: "", raw: null, error: { message: e.message } };
  }
}

/* =========================================================
   CORE GENERATORS
   ========================================================= */

export async function generateLeads(market: string, niche: string, count: number): Promise<EngineResult> {
  pushLog(`RECON_INIT: Analyzing ${market} for ${niche} prospects...`);
  
  const prompt = `Identify ${count} real-world, high-ticket businesses located in ${market} specifically within the ${niche} niche.
  CRITICAL: You must only select businesses that exhibit identifiable Digital Deficiencies.
  
  Return a raw JSON object with this EXACT structure:
  {
    "leads": [
      {
        "businessName": "Exact Name",
        "websiteUrl": "https://...",
        "niche": "${niche}",
        "city": "${market}",
        "phone": "Phone Number",
        "email": "Email or Not found",
        "leadScore": 0-100,
        "assetGrade": "A/B/C",
        "socialGap": "Description of gap",
        "visualProof": "Brief proof",
        "bestAngle": "Pitch hook",
        "rank": 1
      }
    ],
    "rubric": { "visual": "...", "social": "...", "highTicket": "...", "reachability": "...", "grades": { "A": "...", "B": "...", "C": "..." } },
    "assets": { "emailOpeners": ["...", "..."], "fullEmail": "...", "callOpener": "...", "voicemail": "...", "smsFollowup": "..." }
  }`;
  
  const result = await callOpenRouter(prompt);
  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };

  const data = extractJSON(result.text);
  if (data && data.leads) {
    pushLog(`RECON_SUCCESS: ${data.leads.length} targets synced.`);
    return data;
  }
  return { leads: [], rubric: {} as any, assets: {} as any };
}

/**
 * HIGH-DENSITY CAMPAIGN ORCHESTRATION
 * This function forces the model to produce a massive, detailed response.
 */
export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`FORGE_INIT: Architecting high-density campaign for ${lead.businessName}...`);
  
  const prompt = `Perform a comprehensive high-ticket agency strategic architecture for the business "${lead.businessName}" (${lead.niche}).
  
  You are the world's most elite CMO. Your task is to produce an EXHAUSTIVE, multi-tab strategic dossier. DO NOT skip any fields. DO NOT provide placeholders.
  
  Return ONLY a raw JSON object with this precise high-density structure:
  {
    "narrative": "A 300-word executive summary of the brand's current failure and the AI-driven salvation we are proposing.",
    "presentation": {
      "title": "ELITE TRANSFORMATION BLUEPRINT: ${lead.businessName}",
      "slides": [
        { "title": "The Digital Deficit", "bullets": ["Point 1 detailing a specific gap", "Point 2", "Point 3"], "category": "AUDIT", "insight": "A sharp strategic observation" },
        { "title": "Aesthetic Authority", "bullets": ["Visual Point 1", "Visual Point 2", "Visual Point 3"], "category": "DESIGN", "insight": "Visual leverage point" },
        { "title": "Conversion Geometry", "bullets": ["Conversion Point 1", "Conversion Point 2", "Conversion Point 3"], "category": "STRATEGY", "insight": "Funnel logic" },
        { "title": "The AI Multiplier", "bullets": ["AI Point 1", "AI Point 2", "AI Point 3"], "category": "TECH", "insight": "Tool specific value" },
        { "title": "Economic Outcome", "bullets": ["ROI Point 1", "ROI Point 2", "ROI Point 3"], "category": "FINANCE", "insight": "Revenue projection" }
      ]
    },
    "outreach": {
      "emailSequence": [
        { "subject": "High-impact subject 1", "body": "Full professional email body..." },
        { "subject": "High-impact subject 2", "body": "Full follow-up email body..." },
        { "subject": "High-impact subject 3", "body": "Closing email body..." }
      ],
      "linkedinSequence": [
        { "type": "CONNECTION_NOTE", "message": "High-conversion 300 character message..." },
        { "type": "DIRECT_PITCH", "message": "Sophisticated deep-dive DM..." }
      ],
      "callScript": {
        "opener": "The exact attention-grabbing opening line",
        "hook": "The core value proposition and objection handler",
        "closing": "The exact closing question to book the meeting"
      }
    },
    "funnel": [
      { "title": "Awareness Hook", "description": "Detailed description of stage 1", "conversionGoal": "CLICK", "frictionFix": "Specific AI solution for this stage" },
      { "title": "Logic Staging", "description": "Detailed description of stage 2", "conversionGoal": "OPT-IN", "frictionFix": "AI Concierge engagement" },
      { "title": "Visual Proof", "description": "Detailed description of stage 3", "conversionGoal": "TRUST", "frictionFix": "4K Brand Assets" },
      { "title": "Deal Closure", "description": "Detailed description of stage 4", "conversionGoal": "DEPOSIT", "frictionFix": "Interactive Proposal" }
    ],
    "contentPack": [
      { "platform": "Instagram", "type": "REEL", "caption": "Viral-engineered hook and copy...", "visualDirective": "Specific visual instructions for AI Video Studio" },
      { "platform": "LinkedIn", "type": "THOUGHT_LEADERSHIP", "caption": "Strategic professional post...", "visualDirective": "4K Studio shot directive" },
      { "platform": "X/Twitter", "type": "THREAD", "caption": "10-part educational thread...", "visualDirective": "Graphic style directive" },
      { "platform": "Facebook", "type": "COMMUNITY_AD", "caption": "Local targeting ad copy...", "visualDirective": "Aesthetic style directive" }
    ],
    "visualDirection": {
      "brandMood": "Comprehensive description of the new brand archetype (e.g., 'Modern Minimalist Luxury with High-Contrast Emerald Tones')",
      "colorPalette": [
        { "hex": "#HEXCODE1", "color": "Color Name 1" },
        { "hex": "#HEXCODE2", "color": "Color Name 2" },
        { "hex": "#HEXCODE3", "color": "Color Name 3" },
        { "hex": "#HEXCODE4", "color": "Color Name 4" }
      ],
      "typography": { "heading": "Specific Font Family Name", "body": "Complementary Body Font" },
      "aiImagePrompts": [
        { "use_case": "WEBSITE_HERO", "prompt": "Exhaustive 4K stable diffusion prompt for hero section..." },
        { "use_case": "SOCIAL_AD", "prompt": "Exhaustive cinematic prompt for Instagram ad..." },
        { "use_case": "PRODUCT_SHOT", "prompt": "Exhaustive studio lighting prompt..." },
        { "use_case": "LIFESTYLE", "prompt": "Exhaustive atmosphere prompt..." }
      ]
    }
  }`;

  const result = await callOpenRouter(prompt, "You are a world-class strategic agency orchestrator. Fill all fields with high-value, professional content.");
  
  if (result.ok) {
    const data = extractJSON(result.text);
    if (data) {
      pushLog(`FORGE_COMPLETE: Multi-dimensional blueprint synchronized for ${lead.businessName}.`);
      return data;
    }
  }
  
  pushLog(`FORGE_FAULT: Strategy engine failed to generate high-density payload.`);
  return null;
}

// STUBS REMAIN THE SAME
export async function architectFunnel(lead: Lead): Promise<any[]> { return []; }
export async function architectPitchDeck(lead: Lead): Promise<any> { return { slides: [] }; }
export async function generateTaskMatrix(lead: Lead): Promise<any[]> { return []; }
export async function generatePitch(lead: Lead): Promise<string> { return ""; }
export async function generateProposalDraft(lead: Lead): Promise<string> { return ""; }
export async function generateOutreachSequence(lead: Lead): Promise<any[]> { return []; }
export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> { return []; }
export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> { return generateLeads(market, query, count); }
export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> { return {} as any; }
export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> { return { risk: "N/A", opportunity: "N/A" }; }
export async function fetchBenchmarkData(lead: Lead): Promise<BenchmarkReport> { return {} as any; }
export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> { return {} as any; }
export async function generateVisual(prompt: string, lead: Lead, sourceImage?: string): Promise<string | undefined> { return undefined; }
export async function generateMockup(name: string, niche: string, leadId: string): Promise<string> { return ""; }
export async function generateFlashSparks(lead: Lead): Promise<string[]> { return []; }
export async function generateROIReport(ltv: number, leads: number, conv: number): Promise<string> { return ""; }
export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> { return []; }
export async function synthesizeProduct(lead: Lead): Promise<any> { return {}; }
export async function openRouterChat(prompt: string, system?: string): Promise<string> { 
    const res = await callOpenRouter(prompt, system);
    return res.text;
}
export async function performFactCheck(lead: Lead, claim: string): Promise<any> { return {}; }
export async function translateTactical(text: string, lang: string): Promise<string> { return ""; }
export async function analyzeVisual(base64: string, mimeType: string, prompt: string): Promise<string> { return ""; }
export async function analyzeVideoUrl(url: string, mission: string, leadId?: string): Promise<string> { return ""; }
export async function generateVideoPayload(prompt: string, leadId?: string, image?: string, lastFrame?: string, config?: VeoConfig): Promise<string> { return ""; }
export async function enhanceVideoPrompt(prompt: string): Promise<string> { return ""; }
export async function generateMotionLabConcept(lead: Lead): Promise<any> { return {}; }
export async function generateAgencyIdentity(niche: string, region: string): Promise<any> { return {}; }
export async function fetchViralPulseData(niche: string): Promise<any[]> { return []; }
export async function queryRealtimeAgent(prompt: string): Promise<{ text: string, sources: any[] }> { return { text: "", sources: [] }; }
export async function testModelPerformance(model: string, prompt: string): Promise<string> { return ""; }
export async function loggedGenerateContent(params: { module: string; contents: string | any; config?: any; }): Promise<string> { 
    const res = await callOpenRouter(params.contents);
    return res.text;
}
export async function generateAffiliateProgram(niche: string): Promise<any> { return {}; }
export async function synthesizeArticle(source: string, mode: string): Promise<string> { return ""; }
export async function crawlTheaterSignals(sector: string, signal: string): Promise<Lead[]> { return []; }
export async function identifySubRegions(theater: string): Promise<string[]> { return []; }
export async function simulateSandbox(lead: Lead, ltv: number, volume: number): Promise<string> { return ""; }
export async function generatePlaybookStrategy(niche: string): Promise<any> { return {}; }
export async function fetchTokenStats(): Promise<any> { return { recentOps: [] }; }
export async function critiqueVideoPresence(lead: Lead): Promise<string> { return ""; }
export async function generateAudioPitch(script: string, voice: string, leadId?: string): Promise<string> { return ""; }
export async function enhanceStrategicPrompt(prompt: string): Promise<string> { return ""; }
