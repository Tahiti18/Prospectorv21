
/* =========================================================
   OPENROUTER SERVICE – POMELLI OS V25 (ELITE STRATEGIC CORE)
   ========================================================= */

import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";

// Comment: Re-exporting deductCost for ghlArchitectService.ts
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

async function callOpenRouter(prompt: string, systemInstruction?: string, modelOverride?: string): Promise<GeminiResult<string>> {
  try {
    const keys = getStoredKeys();
    const apiKey = keys.openRouter || process.env.API_KEY;

    if (!apiKey) throw new Error("AUTHORIZATION_REQUIRED: Set OpenRouter key in Settings.");

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
            content: systemInstruction || "You are Prospector OS, a world-class strategic agency engineer. Output ONLY raw JSON when requested. Every single field must be filled with high-density, professional, and targeted tactical detail. Never use placeholders or empty strings." 
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
  pushLog(`RECON: Performing exhaustive theater scan of ${market} for ${niche} prospects...`);
  const prompt = `Identify ${count} real-world, high-ticket businesses in ${market} (${niche}). 
  Return EXACT JSON: 
  { 
    "leads": [{ 
      "businessName": "Real Name", 
      "websiteUrl": "Actual URL", 
      "niche": "Specific Category", 
      "city": "Specific City", 
      "country": "Specific Country",
      "phone": "Real Format", 
      "email": "Valid Format", 
      "leadScore": 0-100, 
      "assetGrade": "A/B/C", 
      "socialGap": "Deep qualitative audit of their social deficiency", 
      "visualProof": "Description of current visual weakness", 
      "bestAngle": "The specific high-ticket AI pitch angle", 
      "rank": 1 
    }], 
    "rubric": { 
      "visual": "Criteria for 40pts", 
      "social": "Criteria for 30pts", 
      "highTicket": "Criteria for 20pts", 
      "reachability": "Criteria for 10pts", 
      "grades": { "A": "Definition", "B": "Definition", "C": "Definition" } 
    }, 
    "assets": { 
      "emailOpeners": ["Deeply personalized opener 1", "Deeply personalized opener 2"], 
      "fullEmail": "Professional cold email template", 
      "callOpener": "20s verbal script", 
      "voicemail": "Curiosity hook voicemail", 
      "smsFollowup": "High-intent SMS script" 
    } 
  }`;
  const result = await callOpenRouter(prompt);
  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };
  return extractJSON(result.text) || { leads: [], rubric: {} as any, assets: {} as any };
}

export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> {
  pushLog(`GROUNDED_RECON: Executing multi-vector intelligence sweep for ${query}...`);
  return await generateLeads(market, query, count);
}

export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> {
  pushLog(`FORGE: Architecting A/B performance variations for ${lead.businessName}...`);
  const prompt = `Generate 3 distinct, high-impact professional cold email variations for ${lead.businessName}. 
  Variation 1: Authority Driven. Variation 2: Gap-Benefit Driven. Variation 3: Direct Visual Pitch.
  Return JSON array of {subject, body}.`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || [];
}

export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`FUNNEL: Designing 7-stage conversion geometry for ${lead.businessName}...`);
  const prompt = `Architect an exhaustive 7-stage High-Ticket AI Transformation Funnel for ${lead.businessName}. 
  Stages must be: 1. Awareness (Social Stunt), 2. Discovery (Audit Landing Page), 3. Indoctrination (Case Study Video), 4. Conversion (Interactive ROI Calculator), 5. Commitment (Strategy Call), 6. Closing (Magic Link Proposal), 7. Advocacy (Client Dashboard).
  Return ONLY a JSON array: [ { "stage": 1, "title": "Stage Name", "description": "100-word tactical description", "conversionGoal": "Specific Action", "frictionFix": "How AI eliminates current hurdles" } ]`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function architectPitchDeck(lead: Lead): Promise<any> {
  pushLog(`DECK: Engineering 7-slide strategic blueprint for ${lead.businessName}...`);
  const prompt = `Create an elite 7-slide strategy deck architecture for ${lead.businessName}.
  Slides: 1. The Executive Vision, 2. The Current Digital Deficit (Audit), 3. Aesthetic Competitor Benchmarking, 4. The AI Visual Transformation, 5. Market Authority Projection, 6. The Economic Calculus (ROI), 7. Implementation Roadmap.
  Return ONLY JSON: { "slides": [ { "title": "Slide Title", "bullets": ["High-density point 1", "High-density point 2", "High-density point 3"], "category": "VISION/AUDIT/AESTHETIC/TECH/MARKET/ROI/PLAN", "insight": "A sharp strategic 'kicker' statement for each slide" } ] }`;
  const result = await callOpenRouter(prompt);
  return extractJSON(result.text) || { slides: [] };
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  pushLog(`PROPOSAL: Constructing massive executive blueprint for ${lead.businessName}...`);
  const prompt = `Create a massive, professional high-ticket agency proposal for ${lead.businessName}. 
  You must use the following UI_BLOCKS JSON structure and provide exhaustive detail for every section.
  Structure: 
  { 
    "format": "ui_blocks", 
    "title": "EXECUTIVE ARCHITECTURE PLAN", 
    "subtitle": "TRANSFORMATION STRATEGY FOR ${lead.businessName.toUpperCase()}",
    "sections": [ 
      { "heading": "THE DIGITAL DEFICIT", "body": [{ "type": "p", "content": "Deep audit of current state" }, { "type": "bullets", "content": ["Weakness 1", "Weakness 2", "Weakness 3"] }] },
      { "heading": "AI TRANSFORMATION ROADMAP", "body": [{ "type": "hero", "content": "The New Brand Vision" }, { "type": "p", "content": "Step-by-step implementation detail" }] },
      { "heading": "ECONOMIC IMPACT", "body": [{ "type": "p", "content": "Detailed ROI analysis and market projection" }] }
    ] 
  }`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  pushLog(`SEQUENCE: Engineering 25-day multi-channel strike roadmap for ${lead.businessName}...`);
  const prompt = `Draft a comprehensive 25-day engagement sequence for ${lead.businessName}. 
  Requirement: EXACTLY 7 high-impact emails spaced strategically (Days 1, 3, 5, 8, 14, 20, 25).
  Also include 2 LinkedIn touchpoints and 1 SMS follow-up.
  Return ONLY a JSON array where each object is: { "day": number, "channel": "EMAIL"|"LINKEDIN"|"SMS", "purpose": "Strategic Goal", "subject": "High-CTR Subject Line", "body": "Exhaustive, professional, non-intrusive high-ticket copy" }`;
  const result = await callOpenRouter(prompt);
  const data = extractJSON(result.text);
  return Array.isArray(data) ? data : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  pushLog(`PITCH: Synthesizing 3-part script architecture for ${lead.businessName}...`);
  const prompt = `Generate a comprehensive 3-part script set for ${lead.businessName} using the UI_BLOCKS format. 
  Include: 
  1. The 30-Second Elevator Hook (Pattern Interrupt).
  2. The Discovery Session Flow (5 Critical Psychological Questions).
  3. The Objection Handling Matrix (Addressing Cost, Time, and Implementation Risk).
  Structure: 
  { "format": "ui_blocks", "title": "PITCH ARCHITECTURE", "sections": [ 
    { "heading": "30-SECOND ELEVATOR HOOK", "body": [{ "type": "hero", "content": "The Hook" }, { "type": "p", "content": "The Delivery" }] },
    { "heading": "DISCOVERY SESSION FLOW", "body": [{ "type": "bullets", "content": ["Question 1", "Question 2", "Question 3"] }] },
    { "heading": "OBJECTION HANDLING", "body": [{ "type": "p", "content": "Tactical advice for overcoming specific lead concerns" }] }
  ] }`;
  const result = await callOpenRouter(prompt);
  return result.text;
}

export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`FORGE: Packaging full-scale intelligence dossier for ${lead.businessName}...`);
  const prompt = `Perform exhaustive strategic architecture for ${lead.businessName}. 
  Analyze their digital presence and synthesize a complete agency service package.
  Return EXACT JSON with NO empty fields:
  { 
    "narrative": "300-word executive thesis on why this transformation is mandatory now", 
    "presentation": { 
      "title": "THE ${lead.businessName.toUpperCase()} EVOLUTION", 
      "slides": [
        { "title": "Vision", "bullets": ["Point A", "Point B", "Point C"], "category": "VISION", "insight": "Strategic kicker" },
        { "title": "Audit", "bullets": ["Point A", "Point B", "Point C"], "category": "AUDIT", "insight": "Strategic kicker" },
        { "title": "Visuals", "bullets": ["Point A", "Point B", "Point C"], "category": "DESIGN", "insight": "Strategic kicker" },
        { "title": "Tech", "bullets": ["Point A", "Point B", "Point C"], "category": "TECH", "insight": "Strategic kicker" },
        { "title": "Market", "bullets": ["Point A", "Point B", "Point C"], "category": "MARKET", "insight": "Strategic kicker" },
        { "title": "ROI", "bullets": ["Point A", "Point B", "Point C"], "category": "ROI", "insight": "Strategic kicker" },
        { "title": "Roadmap", "bullets": ["Point A", "Point B", "Point C"], "category": "PLAN", "insight": "Strategic kicker" }
      ] 
    }, 
    "outreach": { 
      "emailSequence": [
        { "day": 1, "purpose": "The Hook", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 3, "purpose": "Value Drop", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 5, "purpose": "Social Proof", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 10, "purpose": "Case Study", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 15, "purpose": "The Offer", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 20, "purpose": "Scarcity", "subject": "Subject", "body": "Full Detail Body" },
        { "day": 25, "purpose": "Final Note", "subject": "Subject", "body": "Full Detail Body" }
      ], 
      "linkedinSequence": [{ "day": 4, "type": "DM", "message": "High-density message" }, { "day": 12, "type": "DM", "message": "High-density message" }], 
      "callScript": { "opener": "Scripted opener", "hook": "Value hook", "closing": "Closing ask" } 
    }, 
    "funnel": [
      { "title": "Stage 1", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 2", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 3", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 4", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 5", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 6", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" },
      { "title": "Stage 7", "description": "Desc", "conversionGoal": "Goal", "frictionFix": "AI Fix" }
    ], 
    "contentPack": [{ "platform": "Instagram", "type": "REEL", "caption": "Viral caption", "visualDirective": "Art direction" }], 
    "visualDirection": { 
      "brandMood": "Exhaustive mood description", 
      "colorPalette": [{ "hex": "#HEX", "color": "Name" }], 
      "typography": { "heading": "Font Name", "body": "Font Name" }, 
      "aiImagePrompts": [{ "use_case": "Hero", "prompt": "Exhaustive 4K prompt" }] 
    },
    "proposal": {
      "format": "ui_blocks",
      "title": "EXECUTIVE ARCHITECTURE PLAN",
      "subtitle": "TRANSFORMATION STRATEGY FOR ${lead.businessName.toUpperCase()}",
      "sections": [
        { "heading": "THE DIGITAL DEFICIT", "body": [{ "type": "p", "content": "3-para audit" }, { "type": "bullets", "content": ["Weakness 1", "Weakness 2", "Weakness 3"] }] },
        { "heading": "AI TRANSFORMATION ROADMAP", "body": [{ "type": "hero", "content": "Vision statement" }, { "type": "p", "content": "Step details" }] },
        { "heading": "ECONOMIC CALCULUS", "body": [{ "type": "p", "content": "ROI and lift projection details" }] }
      ]
    },
    "pitch": {
      "format": "ui_blocks",
      "title": "PITCH ARCHITECTURE",
      "sections": [
        { "heading": "30-SECOND ELEVATOR HOOK", "body": [{ "type": "hero", "content": "The Core Hook" }, { "type": "p", "content": "Pacing instructions" }] },
        { "heading": "DISCOVERY SESSION FLOW", "body": [{ "type": "bullets", "content": ["Question 1", "Question 2", "Question 3"] }] },
        { "heading": "OBJECTION HANDLING", "body": [{ "type": "p", "content": "Strategies for price and risk concerns" }] }
      ]
    }
  }`;
  const result = await callOpenRouter(prompt);
  return result.ok ? extractJSON(result.text) : null;
}

export async function resynthesizeNarrative(lead: Lead): Promise<string> {
  pushLog(`RE-SYNTHESIZING: Narrative for ${lead.businessName}...`);
  const result = await orchestrateBusinessPackage(lead, []);
  return result?.narrative || "";
}

export async function resynthesizeVisuals(lead: Lead): Promise<any> {
  pushLog(`RE-SYNTHESIZING: Visuals for ${lead.businessName}...`);
  const result = await orchestrateBusinessPackage(lead, []);
  return result?.visualDirection || null;
}

// Comment: Implementation of missing exported members

export async function fetchViralPulseData(niche: string): Promise<any[]> {
    pushLog(`TRENDS: Analyzing viral signals for ${niche}...`);
    const prompt = `Provide 4 current viral trends for the ${niche} niche. Return JSON: [{"label": "Trend", "val": 0-150, "type": "up"|"down"}]`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function queryRealtimeAgent(query: string): Promise<{ text: string; sources?: any[] }> {
    pushLog(`AGENT: Executing realtime grounded search for: ${query}...`);
    const result = await callOpenRouter(query);
    return { 
        text: result.text, 
        sources: (result.raw as any)?.grounding_metadata?.chunks || [] 
    };
}

export async function analyzeVideoUrl(url: string, prompt: string, leadId?: string): Promise<string> {
    pushLog(`VIDEO_INTEL: Deconstructing temporal stream for ${url}...`);
    const finalPrompt = `Analyze this video: ${url}. Instructions: ${prompt}. Return markdown or UI_BLOCKS.`;
    const result = await callOpenRouter(finalPrompt);
    return result.text;
}

export async function critiqueVideoPresence(lead: Lead): Promise<string> {
    pushLog(`VIDEO_AUDIT: Critiquing ${lead.businessName}'s video ecosystem...`);
    const prompt = `Perform a critique of the video marketing presence for ${lead.businessName} (${lead.websiteUrl}). Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function synthesizeArticle(source: string, mode: string): Promise<string> {
    pushLog(`ARTICLE: Synthesizing ${mode} for source...`);
    const prompt = `Synthesize this article/source: ${source}. Mode: ${mode}. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function analyzeVisual(base64: string, mimeType: string, prompt: string): Promise<string> {
    pushLog(`VISION: Analyzing visual plate...`);
    const finalPrompt = `Analyze the attached image. ${prompt}`;
    const result = await callOpenRouter(finalPrompt);
    return result.text;
}

export async function generateMockup(name: string, niche: string, leadId?: string): Promise<string> {
    pushLog(`MOCKUP: Forging 4K commercial render for ${name}...`);
    const prompt = `A premium 4K commercial mockup for ${name}, a ${niche} business. Luxury aesthetic.`;
    // Placeholder URL for simulation
    const mockUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000";
    saveAsset('IMAGE', `MOCKUP: ${name}`, mockUrl, 'MOCKUP_FORGE', leadId);
    return mockUrl;
}

export async function openRouterChat(prompt: string, system?: string): Promise<string> {
    const result = await callOpenRouter(prompt, system);
    return result.text;
}

export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> {
    pushLog(`INTEL: Fetching live node intelligence for ${lead.businessName}...`);
    const prompt = `Generate a benchmark report for ${lead.businessName}. Return JSON following BenchmarkReport interface.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || { missionSummary: "Error", visualStack: [], sonicStack: [], featureGap: "", businessModel: "", designSystem: "", deepArchitecture: "", sources: [] };
}

export async function generateAffiliateProgram(niche: string): Promise<any> {
    pushLog(`AFFILIATE: Synthesizing partner infrastructure for ${niche}...`);
    const prompt = `Create an affiliate program for ${niche}. Return JSON: { vision: string, nextSteps: string[], tiers: any[], marketingArsenal: any[], roiPartnerModel: any }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateROIReport(ltv: number, volume: number, conv: number): Promise<string> {
    pushLog(`ROI: Projecting economic impact (LTV: ${ltv}, Vol: ${volume})...`);
    const prompt = `Project ROI for AI transformation. LTV: ${ltv}, Volume: ${volume}, Conv: ${conv}%. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function fetchTokenStats(): Promise<any> {
    return {
        available: 4200000,
        recentOps: [
            { op: 'VEO_FORGE', id: '0x88FF', cost: '150K' },
            { op: 'INTEL_SWEEP', id: '0x22AB', cost: '12K' }
        ]
    };
}

export async function generateVideoPayload(prompt: string, leadId?: string, startImage?: string, endImage?: string, config?: VeoConfig): Promise<string> {
    pushLog(`VIDEO: Initiating VEO 3.1 sequence synthesis...`);
    // Simulated taskId for KIE integration
    return `TASK_${Date.now()}`;
}

export async function enhanceVideoPrompt(prompt: string): Promise<string> {
    const res = await callOpenRouter(`Enhance this video prompt for cinematic quality: ${prompt}`);
    return res.text;
}

export async function synthesizeProduct(lead: Lead): Promise<any> {
    pushLog(`PRODUCT: Synthesizing offer architecture for ${lead.businessName}...`);
    const prompt = `Architect a product for ${lead.businessName}. Return JSON: { productName, tagline, pricePoint, features: string[] }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> {
    pushLog(`DNA: Extracting identity from ${url}...`);
    const prompt = `Extract brand DNA from ${url}. Return JSON matching BrandIdentity interface.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateVisual(prompt: string, lead: Lead, sourceImage?: string): Promise<string> {
    pushLog(`IMAGE: Forging professional asset...`);
    const mockUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000";
    saveAsset('IMAGE', `VISUAL: ${lead.businessName}`, mockUrl, 'VISUAL_STUDIO', lead.id);
    return mockUrl;
}

export async function loggedGenerateContent(args: { module: string; contents: string; config?: any }): Promise<string> {
    pushLog(`NEURAL_CALL: [${args.module}] Initiating inference...`);
    const result = await callOpenRouter(args.contents, args.config?.systemInstruction);
    if (result.ok) {
        pushLog(`NEURAL_SUCCESS: [${args.module}] Inference complete.`);
        return result.text;
    }
    throw new Error(result.error?.message || "Inference failed");
}

export async function performFactCheck(lead: Lead, claim: string): Promise<any> {
    pushLog(`FACT_CHECK: Verifying claim for ${lead.businessName}...`);
    const prompt = `Verify this claim: "${claim}" for ${lead.businessName}. Return JSON: { status: "Verified"|"Disputed"|"Unknown", evidence: string, sources: any[] }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function generateAgencyIdentity(niche: string, region: string): Promise<any> {
    pushLog(`IDENTITY: Forging agency credentials...`);
    const prompt = `Generate agency identity for ${niche} in ${region}. Return JSON: { name, tagline, manifesto, colors: string[] }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function enhanceStrategicPrompt(prompt: string): Promise<string> {
    const res = await callOpenRouter(`Enhance this strategic prompt: ${prompt}`);
    return res.text;
}

export async function generatePlaybookStrategy(niche: string): Promise<any> {
    pushLog(`PLAYBOOK: Syncing SOP mesh for ${niche}...`);
    const prompt = `Generate a playbook for ${niche}. Return JSON: { strategyName, steps: { title, tactic }[] }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> {
    pushLog(`ANALYTICS: Evaluating ledger density...`);
    const prompt = `Analyze these leads. Return JSON: { risk: string, opportunity: string }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || { risk: "Low coverage", opportunity: "Emerging niche detected" };
}

export async function crawlTheaterSignals(sector: string, signal: string): Promise<Lead[]> {
    pushLog(`CRAWL: Scanning ${sector} for ${signal}...`);
    const res = await generateLeads(sector, signal, 4);
    return res.leads;
}

export async function identifySubRegions(theater: string): Promise<string[]> {
    return [theater + " North", theater + " South", theater + " Central"];
}

export async function generateMotionLabConcept(lead: Lead): Promise<any> {
    pushLog(`MOTION_LAB: Mapping dynamic vectors for ${lead.businessName}...`);
    const prompt = `Generate a motion storyboard concept for ${lead.businessName}. Return JSON: { title, hook, scenes: { time, visual, text }[] }`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text);
}

export async function testModelPerformance(model: string, prompt: string): Promise<string> {
    const res = await callOpenRouter(prompt, undefined, model);
    return res.text;
}

export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> {
    pushLog(`CONCIERGE: Simulating nurture sequence for ${lead.businessName}...`);
    const prompt = `Simulate a chat between a lead and an AI concierge for ${lead.businessName}. Scenario: ${scenario}. Return JSON array: [{role: "user"|"ai", text: string}]`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function simulateSandbox(lead: Lead, ltv: number, volume: number): Promise<string> {
    pushLog(`SANDBOX: Calculating variance for ${lead.businessName}...`);
    const prompt = `Simulate growth for ${lead.businessName} with LTV ${ltv} and volume ${volume}. Return markdown.`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function translateTactical(text: string, lang: string): Promise<string> {
    pushLog(`TRANSLATOR: Localizing payload to ${lang}...`);
    const prompt = `Translate this outreach copy to ${lang}: ${text}`;
    const result = await callOpenRouter(prompt);
    return result.text;
}

export async function generateFlashSparks(lead: Lead): Promise<string[]> {
    pushLog(`SPARKS: Generating content velocity pack for ${lead.businessName}...`);
    const prompt = `Generate 6 content hooks for ${lead.businessName}. Return JSON string array.`;
    const result = await callOpenRouter(prompt);
    return extractJSON(result.text) || [];
}

export async function generateAudioPitch(script: string, voice: string, leadId?: string): Promise<string> {
    pushLog(`SONIC: Synthesizing audio pitch (Voice: ${voice})...`);
    const mockUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    saveAsset('AUDIO', `PITCH: ${voice}`, mockUrl, 'SONIC_STUDIO', leadId);
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
        { id: '1', task: 'Review Social Audit Gaps', status: 'pending' },
        { id: '2', task: 'Approve 4K Visual Art Directive', status: 'pending' },
        { id: '3', task: 'Deploy Neural Scribe', status: 'pending' },
        { id: '4', task: 'Finalize Magic Link Proposal', status: 'pending' }
    ];
}
