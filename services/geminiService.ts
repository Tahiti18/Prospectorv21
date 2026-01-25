
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V21 (GEMINI 3.0 FLASH)
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";
export type { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity };

// Definitive OpenRouter Model ID for the newest Gemini 3.0 Flash architecture
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

/**
 * Robustly extracts JSON from AI responses that may contain markdown or chatter.
 */
function extractJSON(text: string): any {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Look for JSON markdown block
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) return JSON.parse(match[1]);
      
      // 3. Brute force envelope find
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
    const apiKey = process.env.API_KEY;
    const modelId = DEFAULT_MODEL;

    pushLog(`NEURAL_UPLINK: Routing to OpenRouter Gemini 3.0 Flash...`);

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
          { role: "system", content: systemInstruction || "You are Prospector OS, powered by Gemini 3.0 Flash. Output ONLY raw JSON when requested. No conversational chatter." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "OpenRouter internal error");
    }

    const text = data.choices[0].message.content;
    deductCost(modelId, (prompt.length + text.length));
    
    return {
      ok: true,
      text: text,
      raw: data
    };
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    return {
      ok: false,
      text: "",
      raw: null,
      error: { message: e.message }
    };
  }
}

/* =========================================================
   CORE GENERATORS
   ========================================================= */

export async function generateLeads(market: string, niche: string, count: number): Promise<EngineResult> {
  pushLog(`RECON_INIT: Scouring Knowledge Base for ${market} businesses in ${niche} via Gemini 3.0...`);
  
  const prompt = `Identify ${count} real-world, high-ticket businesses physically located in ${market} specifically within the ${niche} niche.
  
  CRITICAL: You must only select businesses that exhibit identifiable Digital Deficiencies (Outdated design, no video content, poor social engagement).
  
  Return a raw JSON object with this structure:
  {
    "leads": [
      {
        "businessName": "Exact Business Name",
        "websiteUrl": "https://...",
        "niche": "${niche}",
        "city": "${market}",
        "phone": "Real Phone Number",
        "email": "Real Email or Not found",
        "leadScore": 0-100,
        "assetGrade": "A/B/C",
        "socialGap": "Detailed description of their digital infrastructure gap",
        "visualProof": "Brief proof of gap",
        "bestAngle": "Strategic pitch hook",
        "rank": 1
      }
    ],
    "rubric": {
       "visual": "Criteria used",
       "social": "Deficit logic",
       "highTicket": "Plausibility logic",
       "reachability": "Contact logic",
       "grades": { "A": "Elite", "B": "Viable", "C": "Legacy" }
    },
    "assets": {
       "emailOpeners": ["Hook 1", "Hook 2"],
       "fullEmail": "Email Template",
       "callOpener": "Script",
       "voicemail": "Script",
       "smsFollowup": "Script"
    }
  }`;
  
  const result = await callOpenRouter(prompt);

  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };

  const data = extractJSON(result.text);
  if (data && data.leads) {
    pushLog(`RECON_SUCCESS: ${data.leads.length} grounded targets synced.`);
    return data;
  } else {
    pushLog(`PARSING_ERROR: Node returned unparseable sequence.`);
    return { leads: [], rubric: {} as any, assets: {} as any };
  }
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  const prompt = `Perform strategic architecture for ${lead.businessName}. Return a complete campaign JSON with slides, executive narrative, 5-stage funnel, outreach scripts, and visual direction.`;
  const result = await callOpenRouter(prompt);
  return result.ok ? extractJSON(result.text) : {};
}

// STUBS FOR TYPESCRIPT COMPLIANCE
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
export function getStoredKeys() { return { openRouter: "PLATFORM_MANAGED", kie: "PLATFORM_MANAGED" }; }
export function setStoredKeys(orKey: string, kieKey: string) { return true; }
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
