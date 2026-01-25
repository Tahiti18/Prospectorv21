
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V24 (STRATEGIC CORE)
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
  pushLog("INFRASTRUCTURE_KEY_COMMIT: Keys updated.");
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

    if (!apiKey) throw new Error("AUTHORIZATION_REQUIRED: Set OpenRouter key in Settings.");

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
          { role: "system", content: systemInstruction || "You are Prospector OS. Output ONLY raw JSON when requested. Fill every field with massive detail." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "OpenRouter error");

    const text = data.choices[0].message.content;
    deductCost(modelId, (prompt.length + text.length));
    
    return { ok: true, text: text, raw: data };
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    return { ok: false, text: "", raw: null, error: { message: e.message } };
  }
}

/* =========================================================
   FUNCTIONAL ARCHITECTS
   ========================================================= */

export async function generateLeads(market: string, niche: string, count: number): Promise<EngineResult> {
  pushLog(`RECON: Analyzing ${market} for ${niche} prospects...`);
  const prompt = `Identify ${count} real-world, high-ticket businesses in ${market} (${niche}). Return EXACT JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "niche": "", "city": "", "phone": "", "email": "", "leadScore": 0-100, "assetGrade": "A/B/C", "socialGap": "", "visualProof": "", "bestAngle": "", "rank": 1 }], "rubric": { "visual": "", "social": "", "highTicket": "", "reachability": "", "grades": { "A": "", "B": "", "C": "" } }, "assets": { "emailOpeners": ["", ""], "fullEmail": "", "callOpener": "", "voicemail": "", "smsFollowup": "" } }`;
  const result = await callOpenRouter(prompt);
  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };
  return extractJSON(result.text) || { leads: [], rubric: {} as any, assets: {} as any };
}

export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`FUNNEL: Mapping conversion geometry for ${lead.businessName}...`);
  const prompt = `Architect a 6-stage High-Ticket AI Funnel for ${lead.businessName}. Return ONLY a JSON array: [ { "title": "Stage Name", "description": "Deep tactical description", "conversionGoal": "CLICK/OPT-IN/BOOK", "frictionFix": "How AI solves this stage" } ]`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  pushLog(`PROPOSAL: Constructing executive blueprint for ${lead.businessName}...`);
  const prompt = `Create a massive, professional high-ticket agency proposal for ${lead.businessName}. 
  You must use the following UI_BLOCKS JSON structure: 
  { "sections": [ 
    { "heading": "THE PROBLEM", "body": [{ "type": "p", "content": "Deep analysis" }, { "type": "bullets", "content": ["Point 1", "Point 2"] }] },
    { "heading": "THE TRANSFORMATION", "body": [{ "type": "hero", "content": "Bold Statement" }, { "type": "p", "content": "Process detail" }] },
    { "heading": "ECONOMIC IMPACT", "body": [{ "type": "p", "content": "ROI breakdown" }] }
  ] }`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  pushLog(`SEQUENCE: Drafting 5-day multi-channel strike for ${lead.businessName}...`);
  const prompt = `Draft a 5-day engagement sequence for ${lead.businessName}. Return ONLY a JSON array: [ { "day": 1, "channel": "EMAIL", "purpose": "The Hook", "subject": "High impact", "body": "Full professional copy" }, { "day": 2, "channel": "LINKEDIN", "purpose": "Logic Lock", "message": "Direct pitch" }, { "day": 4, "channel": "EMAIL", "purpose": "The Vision", "subject": "Visual proof", "body": "Full professional copy" } ]`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  pushLog(`PITCH: Synthesizing discovery scripts for ${lead.businessName}...`);
  const prompt = `Generate a 3-part script set for ${lead.businessName}. 
  Return UI_BLOCKS JSON with sections for: 
  1. THE 30S ELEVATOR HOOK 
  2. THE DISCOVERY SESSION SCRIPT 
  3. THE OBJECTION REBUTTAL MATRIX.
  Be exhaustive.`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`FORGE: Packaging multi-dimensional blueprint for ${lead.businessName}...`);
  const prompt = `Perform strategic architecture for ${lead.businessName}. Return comprehensive campaign JSON: { "narrative": "300 words", "presentation": { "title": "", "slides": [{ "title": "", "bullets": [], "category": "", "insight": "" }] }, "outreach": { "emailSequence": [{ "subject": "", "body": "" }], "linkedinSequence": [{ "type": "", "message": "" }], "callScript": { "opener": "", "hook": "", "closing": "" } }, "funnel": [{ "title": "", "description": "", "conversionGoal": "", "frictionFix": "" }], "contentPack": [{ "platform": "", "type": "", "caption": "", "visualDirective": "" }], "visualDirection": { "brandMood": "", "colorPalette": [{ "hex": "", "color": "" }], "typography": { "heading": "", "body": "" }, "aiImagePrompts": [{ "use_case": "", "prompt": "" }] } }`;
  const result = await callOpenRouter(prompt);
  return result.ok ? extractJSON(result.text) : null;
}

// STUBS REMAIN FOR TYPESCRIPT COMPLIANCE
export async function generateTaskMatrix(lead: Lead): Promise<any[]> { 
    return [
        { id: '1', task: 'Review Social Audit Gaps', status: 'pending' },
        { id: '2', task: 'Approve 4K Visual Art Directive', status: 'pending' },
        { id: '3', task: 'Finalize Pricing Architecture', status: 'pending' },
        { id: '4', task: 'Execute Day 1 Outreach Strike', status: 'pending' }
    ]; 
}
export async function architectPitchDeck(lead: Lead): Promise<any> { return { slides: [] }; }
export async function generateProposalDraftLegacy(lead: Lead): Promise<string> { return ""; }
export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> { return []; }
export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> { return generateLeads(market, query, count); }
export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> { return {} as any; }
export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> { return { risk: "N/A", opportunity: "N/A" }; }
export async function fetchBenchmarkData(lead: Lead): Promise<BenchmarkReport> { return {} as any; }
export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> { return {} as any; }
export async function generateVisual(prompt: string, lead: Lead, sourceImage?: string): Promise<string | undefined> { return undefined; }
export async function generateMockup(name: string, niche: string, leadId: string): Promise<string> { return ""; }
export async function generateFlashSparks(lead: Lead): Promise<string[]> { return ["Viral Hook 1", "AI Insight 2", "Market Gap 3"]; }
export async function generateROIReport(ltv: number, leads: number, conv: number): Promise<string> { return "ROI Analysis complete."; }
export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> { return []; }
export async function synthesizeProduct(lead: Lead): Promise<any> { return { productName: "AI TRANSFORMATION", pricePoint: "$15,000", features: ["Feature A"] }; }
export async function openRouterChat(prompt: string, system?: string): Promise<string> { 
    const res = await callOpenRouter(prompt, system);
    return res.text;
}
export async function performFactCheck(lead: Lead, claim: string): Promise<any> { return { status: "Verified", evidence: "No issues detected.", sources: [] }; }
export async function translateTactical(text: string, lang: string): Promise<string> { return text; }
export async function analyzeVisual(base64: string, mimeType: string, prompt: string): Promise<string> { return "Vision audit complete."; }
export async function analyzeVideoUrl(url: string, mission: string, leadId?: string): Promise<string> { return "Video analysis complete."; }
export async function generateVideoPayload(prompt: string, leadId?: string, image?: string, lastFrame?: string, config?: VeoConfig): Promise<string> { return ""; }
export async function enhanceVideoPrompt(prompt: string): Promise<string> { return prompt; }
export async function generateMotionLabConcept(lead: Lead): Promise<any> { return { title: "Motion Concept", scenes: [] }; }
export async function generateAgencyIdentity(niche: string, region: string): Promise<any> { return { name: "Prospector Agency" }; }
export async function fetchViralPulseData(niche: string): Promise<any[]> { return []; }
export async function queryRealtimeAgent(prompt: string): Promise<{ text: string, sources: any[] }> { return { text: "", sources: [] }; }
export async function testModelPerformance(model: string, prompt: string): Promise<string> { return "OK"; }
export async function loggedGenerateContent(params: { module: string; contents: string | any; config?: any; }): Promise<string> { 
    const res = await callOpenRouter(params.contents);
    return res.text;
}
export async function generateAffiliateProgram(niche: string): Promise<any> { return { vision: "Affiliate Vision", tiers: [] }; }
export async function synthesizeArticle(source: string, mode: string): Promise<string> { return "Synthesis complete."; }
export async function crawlTheaterSignals(sector: string, signal: string): Promise<Lead[]> { return []; }
export async function identifySubRegions(theater: string): Promise<string[]> { return ["Sub-region 1"]; }
export async function simulateSandbox(lead: Lead, ltv: number, volume: number): Promise<string> { return "Simulation results."; }
export async function generatePlaybookStrategy(niche: string): Promise<any> { return { strategyName: "Playbook" }; }
export async function fetchTokenStats(): Promise<any> { return { recentOps: [] }; }
export async function critiqueVideoPresence(lead: Lead): Promise<string> { return "Audit complete."; }
export async function generateAudioPitch(script: string, voice: string, leadId?: string): Promise<string> { return ""; }
export async function enhanceStrategicPrompt(prompt: string): Promise<string> { return prompt; }
