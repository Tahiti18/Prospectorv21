
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V25 (ELITE STRATEGIC CORE)
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";

export type { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity };

const DEFAULT_MODEL = "google/gemini-3-flash-preview"; 

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
    openRouter: localStorage.getItem('pomelli_os_or_key') || "",
    kie: localStorage.getItem('pomelli_os_kie_key') || ""
  };
}

export function setStoredKeys(orKey: string, kieKey: string) {
  if (orKey) localStorage.setItem('pomelli_os_or_key', orKey);
  if (kieKey) localStorage.setItem('pomelli_os_kie_key', kieKey);
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
    const cleaned = text.replace(/```json\s*|```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
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
        model: DEFAULT_MODEL,
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
    deductCost(DEFAULT_MODEL, (prompt.length + text.length));
    
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
  pushLog(`RECON: Analyzing ${market} for ${niche} prospects via Neural Sweep...`);
  const prompt = `Identify ${count} real-world, high-ticket businesses in ${market} (${niche}). Return EXACT JSON: { "leads": [{ "businessName": "", "websiteUrl": "", "niche": "", "city": "", "phone": "", "email": "", "leadScore": 0-100, "assetGrade": "A/B/C", "socialGap": "", "visualProof": "", "bestAngle": "", "rank": 1 }], "rubric": { "visual": "", "social": "", "highTicket": "", "reachability": "", "grades": { "A": "", "B": "", "C": "" } }, "assets": { "emailOpeners": ["", ""], "fullEmail": "", "callOpener": "", "voicemail": "", "smsFollowup": "" } }`;
  const result = await callOpenRouter(prompt);
  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };
  return extractJSON(result.text) || { leads: [], rubric: {} as any, assets: {} as any };
}

export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> {
  pushLog(`GROUNDED_RECON: Scanning ${market} theater for ${query} signals...`);
  return await generateLeads(market, query, count);
}

export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> {
  pushLog(`FORGE: Generating A/B variations for ${lead.businessName}...`);
  const prompt = `Generate 3 distinct high-impact cold email variations for ${lead.businessName}. Return JSON array of {subject, body}.`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || [];
}

export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`FUNNEL: Mapping 7-stage conversion geometry for ${lead.businessName}...`);
  const prompt = `Architect a 7-stage High-Ticket AI Transformation Funnel for ${lead.businessName}. Return ONLY a JSON array: [ { "title": "Stage Name", "description": "Deep tactical description", "conversionGoal": "CLICK/OPT-IN/BOOK/DEPOSIT", "frictionFix": "How AI solves this stage" } ]`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function architectPitchDeck(lead: Lead): Promise<any> {
  pushLog(`DECK: Engineering 7-slide strategic blueprint for ${lead.businessName}...`);
  const prompt = `Create a 7-slide elite strategy deck architecture for ${lead.businessName}. Return ONLY JSON: { "slides": [ { "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "category": "VISION/ROI", "insight": "Kicker" } ] }`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || { slides: [] };
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  pushLog(`PROPOSAL: Constructing blueprint for ${lead.businessName}...`);
  const prompt = `Create a massive, professional high-ticket agency proposal for ${lead.businessName}. Use UI_BLOCKS JSON structure.`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  pushLog(`SEQUENCE: Engineering optimal 25-day strike roadmap for ${lead.businessName}...`);
  const prompt = `Draft a comprehensive 25-day engagement sequence for ${lead.businessName}. 
  Requirement: EXACTLY 7 high-impact emails spaced strategically across 25 days (e.g., Days 1, 3, 5, 10, 15, 20, 25).
  Also include 2 LinkedIn touchpoints and 1 SMS follow-up.
  Return ONLY a JSON array where each object is: { "day": number, "channel": "EMAIL"|"LINKEDIN"|"SMS", "purpose": "Short Goal", "subject": "Subject (if email)", "body": "Full copy" }`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  pushLog(`PITCH: Synthesizing beautiful discovery scripts for ${lead.businessName}...`);
  const prompt = `Generate a comprehensive 3-part script set for ${lead.businessName}. Return UI_BLOCKS JSON.`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`FORGE: Packaging 25-day multi-dimensional blueprint for ${lead.businessName}...`);
  const prompt = `Perform strategic architecture for ${lead.businessName}. Return comprehensive campaign JSON. Outreach MUST contain exactly 7 emails in the emailSequence array, each with 'day' and 'purpose' keys spread over 25 days.`;
  const result = await callOpenRouter(prompt);
  return result.ok ? extractJSON(result.text) : null;
}

// STUBS
export async function generateTaskMatrix(lead: Lead): Promise<any[]> { return []; }
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
export async function translateTactical(text: string, lang: string): Promise<string> { return text; }
export async function analyzeVisual(base64: string, mimeType: string, prompt: string): Promise<string> { return ""; }
export async function analyzeVideoUrl(url: string, mission: string, leadId?: string): Promise<string> { return ""; }
export async function generateVideoPayload(prompt: string, leadId?: string, image?: string, lastFrame?: string, config?: VeoConfig): Promise<string> { return ""; }
export async function enhanceVideoPrompt(prompt: string): Promise<string> { return prompt; }
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
export async function fetchTokenStats(): Promise<any> { return {}; }
export async function critiqueVideoPresence(lead: Lead): Promise<string> { return ""; }
export async function generateAudioPitch(script: string, voice: string, leadId?: string): Promise<string> { return ""; }
export async function enhanceStrategicPrompt(prompt: string): Promise<string> { return prompt; }
export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> { return {} as any; }
export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> { return { risk: "", opportunity: "" }; }
export async function fetchBenchmarkData(lead: Lead): Promise<BenchmarkReport> { return {} as any; }
export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> { return {} as any; }
