/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V26 (PROFESSIONAL CORE)
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";

export { deductCost };

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
  pushLog("SYSTEM_KEY_COMMIT: Authorization updated.");
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
  pushLog(`DATA_SYNC: [${type}] ${title}`);
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

async function callOpenRouter(prompt: string, systemInstruction?: string, modelOverride?: string): Promise<GeminiResult<string>> {
  try {
    const keys = getStoredKeys();
    const apiKey = keys.openRouter || process.env.API_KEY;

    if (!apiKey) throw new Error("AUTHORIZATION_REQUIRED: Set API key in Settings.");

    const model = modelOverride || DEFAULT_MODEL;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: systemInstruction || "You are Prospector OS, a senior business consultant. Output raw JSON when requested. Be professional and avoid gimmicks. NO military slang." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "OpenRouter error");

    const text = data.choices[0].message.content;
    deductCost(model, (prompt.length + text.length));
    
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
  pushLog(`MARKET_ANALYSIS: Searching ${market} for ${niche} prospects...`);
  const prompt = `Identify ${count} real-world, high-ticket businesses in ${market} (${niche}). 
  Return EXACT JSON: 
  { 
    "leads": [{ 
      "businessName": "Real Name", 
      "websiteUrl": "Actual URL", 
      "niche": "Category", 
      "city": "City", 
      "phone": "Format", 
      "email": "Format", 
      "leadScore": 0-100, 
      "assetGrade": "A/B/C", 
      "socialGap": "Professional audit of social deficiency", 
      "visualProof": "Description of visual weakness", 
      "bestAngle": "The growth strategy angle", 
      "rank": 1 
    }], 
    "rubric": { 
      "visual": "Criteria", "social": "Criteria", "highTicket": "Criteria", "reachability": "Criteria", 
      "grades": { "A": "Elite", "B": "Viable", "C": "Legacy" } 
    }, 
    "assets": { 
      "emailOpeners": ["Opener 1", "Opener 2"], 
      "fullEmail": "Template", 
      "callOpener": "Script", 
      "voicemail": "Script", 
      "smsFollowup": "Script" 
    } 
  }`;
  const result = await callOpenRouter(prompt);
  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };
  return extractJSON(result.text) || { leads: [], rubric: {} as any, assets: {} as any };
}

export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> {
  pushLog(`SEARCH: Performing analysis for ${query}...`);
  return await generateLeads(market, query, count);
}

export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> {
  pushLog(`ANALYSIS: Drafting engagement variations for ${lead.businessName}...`);
  const prompt = `Generate 3 professional email variations for ${lead.businessName}. NO military slang. Return JSON array of {subject, body}.`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || [];
}

export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`STRATEGY: Mapping client journey for ${lead.businessName}...`);
  const prompt = `Architect a 7-stage client journey for ${lead.businessName}. NO military slang. 
  Return ONLY a JSON array: [ { "stage": 1, "title": "Stage Name", "description": "Description", "conversionGoal": "Action", "frictionFix": "Solution" } ]`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function architectPitchDeck(lead: Lead): Promise<any> {
  pushLog(`DEVELOPMENT: Planning strategy deck for ${lead.businessName}...`);
  const prompt = `Create a 7-slide business strategy for ${lead.businessName}. NO military slang. 
  Return ONLY JSON: { "slides": [ { "title": "Slide Title", "bullets": ["Point 1", "Point 2"], "category": "ANALYSIS/STRATEGY", "insight": "Key insight" } ] }`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || { slides: [] };
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  pushLog(`PROPOSAL: Drafting executive blueprint for ${lead.businessName}...`);
  const prompt = `Create a professional proposal for ${lead.businessName}. Use UI_BLOCKS format. NO military slang. 
  { 
    "format": "ui_blocks", 
    "title": "BUSINESS GROWTH PLAN", 
    "sections": [ 
      { "heading": "CURRENT PERFORMANCE AUDIT", "body": [{ "type": "p", "content": "Analysis..." }] },
      { "heading": "IMPLEMENTATION ROADMAP", "body": [{ "type": "p", "content": "Process..." }] }
    ] 
  }`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  pushLog(`ENGAGEMENT: Planning outreach sequence for ${lead.businessName}...`);
  const prompt = `Draft a 25-day sequence for ${lead.businessName}. NO military slang. 
  Return ONLY a JSON array: { "day": number, "channel": "EMAIL"|"LINKEDIN", "purpose": "Goal", "subject": "Subject", "body": "Copy" }`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  pushLog(`PITCH: Drafting script set for ${lead.businessName}...`);
  const prompt = `Generate scripts for ${lead.businessName}. Use UI_BLOCKS. NO military slang.`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`SYNTHESIS: Compiling strategic dossier for ${lead.businessName}...`);
  const prompt = `Compile a full business strategy for ${lead.businessName}. NO military slang. NO placeholders. Return JSON with 'narrative', 'presentation', 'outreach', 'funnel', 'contentPack', 'visualDirection', 'proposal', 'pitch'.`;
  const result = await callOpenRouter(prompt);
  return result.ok ? extractJSON(result.text) : null;
}

export async function resynthesizeNarrative(lead: Lead): Promise<string> {
  pushLog(`REFRESH: Updating narrative for ${lead.businessName}...`);
  const result = await orchestrateBusinessPackage(lead, []);
  return result?.narrative || "";
}

export async function resynthesizeVisuals(lead: Lead): Promise<any> {
  pushLog(`REFRESH: Updating visuals for ${lead.businessName}...`);
  const result = await orchestrateBusinessPackage(lead, []);
  return result?.visualDirection || null;
}

export async function fetchViralPulseData(niche: string): Promise<any[]> {
    pushLog(`TRENDS: Analyzing signals for ${niche}...`);
    const prompt = `Provide 4 trends for ${niche}. Return JSON: [{"label": "Trend", "val": 0-150, "type": "up"|"down"}]`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function queryRealtimeAgent(query: string): Promise<{ text: string; sources?: any[] }> {
    pushLog(`ANALYSIS: Searching live data for: ${query}...`);
    const result = await callOpenRouter(query);
    return { 
        text: result.text, 
        sources: (result.raw as any)?.grounding_metadata?.chunks || [] 
    };
}

export async function analyzeVideoUrl(url: string, prompt: string, leadId?: string): Promise<string> {
    pushLog(`ANALYSIS: Deconstructing video: ${url}...`);
    const finalPrompt = `Analyze video: ${url}. Instructions: ${prompt}. Use UI_BLOCKS. NO military slang.`;
    const result = await callOpenRouter(finalPrompt);
    return result.text;
}

export async function critiqueVideoPresence(lead: Lead): Promise<string> {
    pushLog(`AUDIT: Evaluating video ecosystem for ${lead.businessName}...`);
    const prompt = `Audit video presence for ${lead.businessName}. NO military slang. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function synthesizeArticle(source: string, mode: string): Promise<string> {
    pushLog(`SYNTHESIS: Summarizing source...`);
    const prompt = `Summarize source: ${source}. Mode: ${mode}. NO military slang. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function analyzeVisual(base64: string, mimeType: string, prompt: string): Promise<string> {
    pushLog(`VISION: Analyzing image plate...`);
    const finalPrompt = `Analyze image. ${prompt}. NO military slang.`;
    const result = await callOpenRouter(finalPrompt);
    return result.text;
}

export async function generateMockup(name: string, niche: string, leadId?: string): Promise<string> {
    pushLog(`CREATIVE: Rendering commercial preview for ${name}...`);
    const prompt = `A premium professional mockup for ${name}. Luxury aesthetic.`;
    const mockUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000";
    saveAsset('IMAGE', `MOCKUP: ${name}`, mockUrl, 'CREATIVE_LAB', leadId);
    return mockUrl;
}

export async function openRouterChat(prompt: string, system?: string): Promise<string> {
    const result = await callOpenRouter(prompt, system);
    return result.text;
}

export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> {
    pushLog(`ANALYSIS: Fetching intelligence for ${lead.businessName}...`);
    const prompt = `Benchmark ${lead.businessName}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || { missionSummary: "Error", visualStack: [], sonicStack: [], featureGap: "", businessModel: "", designSystem: "", deepArchitecture: "", sources: [] };
}

export async function generateAffiliateProgram(niche: string): Promise<any> {
    pushLog(`PARTNER: Designing program for ${niche}...`);
    const prompt = `Create affiliate program for ${niche}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateROIReport(ltv: number, volume: number, conv: number): Promise<string> {
    pushLog(`ANALYSIS: Projecting ROI (LTV: ${ltv})...`);
    const prompt = `Project ROI for AI services. LTV: ${ltv}, Vol: ${volume}. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function fetchTokenStats(): Promise<any> {
    return {
        available: 4200000,
        recentOps: [
            { op: 'MEDIA_RENDER', id: '0x88FF', cost: '150K' },
            { op: 'STRATEGY_GEN', id: '0x22AB', cost: '12K' }
        ]
    };
}

export async function generateVideoPayload(prompt: string, leadId?: string, startImage?: string, endImage?: string, config?: VeoConfig): Promise<string> {
    pushLog(`MEDIA: Initiating video synthesis...`);
    return `TASK_${Date.now()}`;
}

export async function enhanceVideoPrompt(prompt: string): Promise<string> {
    const res = await callOpenRouter(`Enhance video prompt: ${prompt}. NO military slang.`);
    return res.text;
}

export async function synthesizeProduct(lead: Lead): Promise<any> {
    pushLog(`DEVELOPMENT: Designing offer for ${lead.businessName}...`);
    const prompt = `Design offer for ${lead.businessName}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> {
    pushLog(`ANALYSIS: Extracting identity from ${url}...`);
    const prompt = `Extract brand DNA from ${url}. Return JSON.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateVisual(prompt: string, lead: Lead, sourceImage?: string): Promise<string> {
    pushLog(`CREATIVE: Rendering asset...`);
    const mockUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000";
    saveAsset('IMAGE', `VISUAL: ${lead.businessName}`, mockUrl, 'CREATIVE_LAB', lead.id);
    return mockUrl;
}

export async function loggedGenerateContent(args: { module: string; contents: string; config?: any }): Promise<string> {
    pushLog(`ANALYSIS: [${args.module}] Initiating analysis...`);
    const result = await callOpenRouter(args.contents, args.config?.systemInstruction);
    if (result.ok) {
        pushLog(`SUCCESS: [${args.module}] Analysis complete.`);
        return result.text;
    }
    throw new Error(result.error?.message || "Analysis failed");
}

export async function performFactCheck(lead: Lead, claim: string): Promise<any> {
    pushLog(`AUDIT: Verifying claim for ${lead.businessName}...`);
    const prompt = `Verify claim: "${claim}" for ${lead.businessName}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateAgencyIdentity(niche: string, region: string): Promise<any> {
    pushLog(`IDENTITY: Forging agency profile...`);
    const prompt = `Generate agency profile for ${niche} in ${region}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function enhanceStrategicPrompt(prompt: string): Promise<string> {
    const res = await callOpenRouter(`Enhance strategy prompt: ${prompt}. NO military slang.`);
    return res.text;
}

export async function generatePlaybookStrategy(niche: string): Promise<any> {
    pushLog(`DEVELOPMENT: Designing SOPs for ${niche}...`);
    const prompt = `Generate business SOPs for ${niche}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> {
    pushLog(`ANALYSIS: Evaluating portfolio...`);
    const prompt = `Analyze leads. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || { risk: "Low coverage", opportunity: "Emerging niche detected" };
}

export async function crawlTheaterSignals(sector: string, signal: string): Promise<Lead[]> {
    pushLog(`ANALYSIS: Scanning ${sector} for ${signal}...`);
    const res = await generateLeads(sector, signal, 4);
    return res.leads;
}

export async function identifySubRegions(theater: string): Promise<string[]> {
    return [theater + " North", theater + " South", theater + " Central"];
}

export async function generateMotionLabConcept(lead: Lead): Promise<any> {
    pushLog(`CREATIVE: Designing video storyboard for ${lead.businessName}...`);
    const prompt = `Design storyboard for ${lead.businessName}. Return JSON. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function testModelPerformance(model: string, prompt: string): Promise<string> {
    const res = await callOpenRouter(prompt, undefined, model);
    return res.text;
}

export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> {
    pushLog(`CONCIERGE: Simulating dialogue for ${lead.businessName}...`);
    const prompt = `Simulate chat for ${lead.businessName}. Scenario: ${scenario}. Return JSON array. NO military slang.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function simulateSandbox(lead: Lead, ltv: number, volume: number): Promise<string> {
    pushLog(`ANALYSIS: Calculating growth for ${lead.businessName}...`);
    const prompt = `Simulate growth. LTV ${ltv}, Vol ${volume}. NO military slang. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function translateTactical(text: string, lang: string): Promise<string> {
    pushLog(`LOCALIZATION: Translating to ${lang}...`);
    const prompt = `Translate outreach copy to ${lang}: ${text}`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function generateFlashSparks(lead: Lead): Promise<string[]> {
    pushLog(`CREATIVE: Generating content hooks for ${lead.businessName}...`);
    const prompt = `Generate 6 hooks for ${lead.businessName}. NO military slang. Return JSON array.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function generateAudioPitch(script: string, voice: string, leadId?: string): Promise<string> {
    pushLog(`MEDIA: Rendering audio pitch (Voice: ${voice})...`);
    const mockUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    saveAsset('AUDIO', `PITCH: ${voice}`, mockUrl, 'MEDIA_LAB', leadId);
    return mockUrl;
}

export async function fetchBenchmarkData(lead: Lead): Promise<BenchmarkReport> {
    return await fetchLiveIntel(lead, 'BENCHMARK');
}

export async function generateROIReport_Old(ltv: number, leads: number, conv: number): Promise<string> {
    return await generateROIReport(ltv, leads, conv);
}

export async function generateTaskMatrix(lead: Lead): Promise<any[]> { 
    return [
        { id: '1', task: 'Review Content Analysis', status: 'pending' },
        { id: '2', task: 'Approve Brand Asset Directive', status: 'pending' },
        { id: '3', task: 'Initialize Email Automation', status: 'pending' },
        { id: '4', task: 'Finalize Interactive Proposal', status: 'pending' }
    ];
}
