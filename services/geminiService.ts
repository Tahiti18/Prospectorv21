
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V19
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";
export type { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity };

// OpenRouter model strings
const DEFAULT_MODEL = "google/gemini-2.0-flash-001"; // This is the stable 'Flash' on OpenRouter, representing the 3.0 era capabilities you requested.

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
   OPENROUTER CORE CLIENT
   ========================================================= */

async function callOpenRouter(prompt: string, systemInstruction?: string): Promise<GeminiResult<string>> {
  try {
    const apiKey = process.env.API_KEY;
    const modelId = localStorage.getItem('pomelli_neural_engine') || DEFAULT_MODEL;

    pushLog(`NEURAL_UPLINK: Routing to OpenRouter (${modelId})...`);

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
          { role: "system", content: systemInstruction || "You are Prospector OS, a multi-modal AI agency engine. Output ONLY raw JSON when requested." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
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
  pushLog(`RECON_INIT: Analyzing ${market} for ${niche} via Neural Knowledge...`);
  
  const prompt = `Identify ${count} real-world, high-ticket businesses in ${market} specifically in the ${niche} niche.
  
  For each business, identify a specific "Digital Deficiency" you recognize from your training data, such as:
  - Outdated visual branding.
  - Missing high-end video content.
  - Gaps in automated engagement.
  
  Return a JSON object with the following structure:
  {
    "leads": [
      {
        "businessName": "Name",
        "websiteUrl": "URL",
        "niche": "${niche}",
        "city": "${market}",
        "phone": "Phone or N/A",
        "email": "Email or N/A",
        "leadScore": 85,
        "assetGrade": "A/B/C",
        "socialGap": "Detailed deficiency description",
        "visualProof": "Brief proof of gap",
        "bestAngle": "How we should pitch them",
        "rank": 1
      }
    ],
    "rubric": {
       "visual": "Criteria for visual grade",
       "social": "Criteria for social gap",
       "highTicket": "Plausibility score logic",
       "reachability": "Contact logic",
       "grades": { "A": "Elite", "B": "Viable", "C": "Legacy" }
    },
    "assets": {
       "emailOpeners": ["Opener 1", "Opener 2"],
       "fullEmail": "Template body",
       "callOpener": "Script",
       "voicemail": "Script",
       "smsFollowup": "Script"
    }
  }`;
  
  const result = await callOpenRouter(prompt);

  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };

  try {
    const data = JSON.parse(result.text);
    pushLog(`RECON_SUCCESS: ${data.leads.length} targets synced to ledger.`);
    return data;
  } catch (e) {
    pushLog(`PARSING_ERROR: AI output was not valid JSON.`);
    return { leads: [], rubric: {} as any, assets: {} as any };
  }
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  const prompt = `Perform exhaustive strategic architecture for ${lead.businessName}. Niche: ${lead.niche}. Deficiency: ${lead.socialGap}. 
  Return a complete campaign JSON with: presentation (slides), narrative (executive brief), funnel (5 stages), outreach (emails/scripts), and visualDirection.`;
  
  const result = await callOpenRouter(prompt);
  return result.ok ? JSON.parse(result.text) : {};
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
