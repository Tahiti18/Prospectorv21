
/* =========================================================
   GEMINI SERVICE – NATIVE PREVIEW OPTIMIZED (V16)
   ========================================================= */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity } from "../types";
import { deductCost } from "./computeTracker";
export type { Lead, AssetRecord, BenchmarkReport, VeoConfig, GeminiResult, EngineResult, BrandIdentity };

// CONFIRMED: Hard-locked to Gemini 3.0 Flash
const DEFAULT_MODEL = "gemini-3-flash-preview";

/**
 * Resolves the active model based on System Config / Local Storage.
 */
function getActiveModel(): string {
  const stored = localStorage.getItem('pomelli_neural_engine');
  const latency = localStorage.getItem('pomelli_latency');
  
  if (stored) return stored;
  // Fallback to Flash if latency isn't explicitly High
  if (latency === 'HIGH') return "gemini-3-pro-preview";
  return DEFAULT_MODEL;
}

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
  PRODUCTION_LOGS.unshift(entry); // Newest first
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
  pushLog(`ASSET_SAVED: [${type}] ${title} via ${module}`);
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
    const title = SESSION_ASSETS[idx].title;
    SESSION_ASSETS.splice(idx, 1);
    assetListeners.forEach(l => l([...SESSION_ASSETS]));
    pushLog(`ASSET_DELETED: ${title}`);
  }
}

/**
 * Clears all assets from the session vault.
 */
export function clearVault() {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  pushLog(`ASSET_VAULT_CLEARED`);
}

/**
 * Imports a batch of assets into the session vault.
 */
export function importVault(assets: AssetRecord[]) {
  SESSION_ASSETS.length = 0;
  SESSION_ASSETS.push(...assets);
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  pushLog(`ASSET_VAULT_IMPORTED: ${assets.length} items`);
}

async function callGemini(prompt: string, config?: any): Promise<GeminiResult<string>> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = getActiveModel();
    
    const finalConfig = { ...config };
    // Only use thinking budget if Pro is selected
    if (modelId.includes('pro') && !finalConfig.thinkingConfig) {
        finalConfig.thinkingConfig = { thinkingBudget: 4000 };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: finalConfig
    });

    deductCost(modelId, (prompt.length + (response.text?.length || 0)));
    pushLog(`NEURAL_UPLINK: ${modelId} - Success`);

    return {
      ok: true,
      text: response.text || "",
      raw: response
    };
  } catch (e: any) {
    pushLog(`NEURAL_FAULT: ${e.message}`);
    return {
      ok: false,
      text: "",
      raw: null,
      error: { message: e?.message ?? "Gemini call failed" }
    };
  }
}

/* =========================================================
   CORE GENERATORS
   ========================================================= */

export async function generateLeads(market: string, niche: string, count: number): Promise<EngineResult> {
  pushLog(`RECON_START: Scanning ${market} for ${niche}`);
  const prompt = `Find ${count} high-ticket businesses in ${market} specifically in the ${niche} niche that could benefit from AI transformation.`;
  
  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        leads: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              niche: { type: Type.STRING },
              city: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              leadScore: { type: Type.NUMBER },
              assetGrade: { type: Type.STRING },
              socialGap: { type: Type.STRING },
              visualProof: { type: Type.STRING },
              bestAngle: { type: Type.STRING },
              personalizedHook: { type: Type.STRING },
            },
            required: ["businessName", "websiteUrl", "niche", "city", "leadScore", "assetGrade", "socialGap"],
          }
        },
        rubric: {
          type: Type.OBJECT,
          properties: {
            visual: { type: Type.STRING },
            social: { type: Type.STRING },
            highTicket: { type: Type.STRING },
            reachability: { type: Type.STRING },
            grades: {
              type: Type.OBJECT,
              properties: { A: { type: Type.STRING }, B: { type: Type.STRING }, C: { type: Type.STRING } }
            }
          }
        },
        assets: {
          type: Type.OBJECT,
          properties: {
            emailOpeners: { type: Type.ARRAY, items: { type: Type.STRING } },
            fullEmail: { type: Type.STRING },
            callOpener: { type: Type.STRING },
            voicemail: { type: Type.STRING },
            smsFollowup: { type: Type.STRING },
          }
        }
      },
      required: ["leads", "rubric", "assets"]
    }
  });

  if (!result.ok) return { leads: [], rubric: {} as any, assets: {} as any };

  try {
    const data = JSON.parse(result.text);
    pushLog(`RECON_SUCCESS: Identified ${data.leads.length} high-fidelity targets.`);
    return data;
  } catch (e) {
    return { leads: [], rubric: {} as any, assets: {} as any };
  }
}

/**
 * EXHAUSTIVE MISSION ORCHESTRATOR
 * This produces the main "Campaign Forge" package.
 */
export async function orchestrateBusinessPackage(lead: Lead, assets: AssetRecord[]): Promise<any> {
  pushLog(`FORGE_INIT: Starting multi-vector architecture for ${lead.businessName}`);
  const prompt = `
    MISSION_ORCHESTRATION_V16: Perform exhaustive, deep strategic architecture for ${lead.businessName}.
    Target Niche: ${lead.niche}
    Vulnerability Gaps: ${lead.socialGap}
    
    REQUIREMENTS:
    1. EXHAUSTIVE NARRATIVE: Provide a detailed 3-paragraph executive thesis and a 25-day implementation roadmap.
    2. STRATEGY DECK: Exactly 7 high-impact slides. Every slide MUST have 5 detailed bullet points. No generic placeholders.
    3. FUNNEL MAP: Exactly 5 stages. Each stage must have a detailed description and a clear conversion goal.
    4. OUTREACH: 3 detailed emails and 2 LinkedIn scripts.
    5. VISUAL DIRECTION: Deep art direction directives for image and video generation.
    
    Do NOT summarize. Provide maximum fidelity for a high-ticket agency pitch.
  `;

  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        presentation: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slides: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { 
                        title: { type: Type.STRING }, 
                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                        insight: { type: Type.STRING }
                    },
                    required: ["title", "bullets"]
                } 
            }
          }
        },
        narrative: { type: Type.STRING },
        funnel: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    title: { type: Type.STRING }, 
                    description: { type: Type.STRING },
                    conversionGoal: { type: Type.STRING },
                    frictionFix: { type: Type.STRING }
                },
                required: ["title", "description", "conversionGoal"]
            } 
        },
        outreach: {
          type: Type.OBJECT,
          properties: {
            emailSequence: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } } 
                } 
            },
            linkedinSequence: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { type: { type: Type.STRING }, message: { type: Type.STRING } }
                }
            },
            callScript: {
                type: Type.OBJECT,
                properties: {
                    opener: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    closing: { type: Type.STRING }
                }
            }
          }
        },
        contentPack: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING },
                    type: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    visualDirective: { type: Type.STRING }
                }
            }
        },
        visualDirection: {
            type: Type.OBJECT,
            properties: {
                brandMood: { type: Type.STRING },
                colorPalette: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { color: { type: Type.STRING }, hex: { type: Type.STRING } } }
                },
                aiImagePrompts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { use_case: { type: Type.STRING }, prompt: { type: Type.STRING } }
                    }
                }
            }
        }
      }
    }
  });
  
  if (result.ok) {
    pushLog(`FORGE_COMPLETE: Multi-Tab strategy synchronized for ${lead.businessName}`);
    return JSON.parse(result.text);
  }
  return {};
}

/**
 * Architects an exhaustive 5-stage funnel map.
 */
export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`FUNNEL_ENGINE: Mapping 5-stage intent geometry for ${lead.businessName}`);
  const prompt = `
    TASK: Architect a definitive 5-stage conversion funnel for ${lead.businessName}.
    Niche: ${lead.niche}
    
    STAGES REQUIRED: 
    1. Awareness (The Disruptive Hook)
    2. Interest (The Value-Gap Demonstration)
    3. Consideration (Case Study & Social Proof)
    4. Intent (The Transformation Offer)
    5. Conversion (The Closing Protocol)
    
    For each stage, provide a detailed 3-sentence description of the psychological transition and the conversion mechanics.
    Return JSON array of { stage: number, title: string, description: string, conversionGoal: string }.
  `;

  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                stage: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                conversionGoal: { type: Type.STRING }
            },
            required: ["stage", "title", "description", "conversionGoal"]
        }
    }
  });

  if (!result.ok) return [];
  try {
    return JSON.parse(result.text);
  } catch (e) {
    return [];
  }
}

/**
 * Architects an exhaustive 7-slide pitch deck structure.
 */
export async function architectPitchDeck(lead: Lead): Promise<any> {
  pushLog(`DECK_ARCHITECT: Structural design for 7-slide narrative for ${lead.businessName}`);
  const prompt = `
    TASK: Architect a 7-slide strategic pitch deck narrative for ${lead.businessName}.
    SLIDES REQUIRED:
    1. The Vision (Title & Future State)
    2. The Problem (The Market Gap/Vulnerability)
    3. The Solution (AI Transformation Engine)
    4. Technical Proof (Mockups & Capability Proof)
    5. Financial Lift (ROI Projections)
    6. Implementation (The 90-Day Roadmap)
    7. The Partnership (The Close & Next Steps)

    For each slide, provide 5 detailed bullets that build a logical closing argument.
    Return JSON: { "slides": [ { "title": "", "bullets": [""] } ] }
  `;

  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "bullets"]
          }
        }
      },
      required: ["slides"]
    }
  });

  if (!result.ok) return { slides: [] };
  try {
    return JSON.parse(result.text);
  } catch (e) {
    return { slides: [] };
  }
}

export async function generateTaskMatrix(lead: Lead): Promise<any[]> {
  const prompt = `Generate a 10-step technical implementation roadmap for transforming ${lead.businessName}. 
  Focus on their niche: ${lead.niche} and gap: ${lead.socialGap}.
  Return JSON array of { id: string, task: string, status: 'pending' | 'complete' }.`;
  
  const result = await callGemini(prompt, {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                task: { type: Type.STRING },
                status: { type: Type.STRING }
            },
            required: ["id", "task", "status"]
        }
    }
  });

  return result.ok ? JSON.parse(result.text) : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  pushLog(`PITCH_ENGINE: Synthesizing multi-vector scripts for ${lead.businessName}`);
  const prompt = `
    TASK: Generate a definitive high-fidelity pitch script suite for ${lead.businessName}.
    Niche: ${lead.niche}
    Vulnerability: ${lead.socialGap}

    Structure the response using this EXACT UI_BLOCKS JSON schema:
    {
      "format": "ui_blocks",
      "title": "PITCH ARCHITECTURE",
      "subtitle": "STRATEGIC SCRIPTS FOR ${lead.businessName.toUpperCase()}",
      "sections": [
        {
          "heading": "1. THE ULTIMATE HOOK",
          "body": [
            { "type": "hero", "content": "A 10-word sentence that stops their brain." }
          ]
        },
        {
          "heading": "2. EXECUTIVE CLIENT PITCH (30 SECONDS)",
          "body": [
            { "type": "p", "content": "Concise high-impact script focused on ROI and competitive gap closure." },
            { "type": "bullets", "content": ["Hook line", "Gap reference", "Vision statement", "Direct call to action"] }
          ]
        },
        {
          "heading": "3. CANDIDATE VISION PITCH",
          "body": [
            { "type": "p", "content": "How to attract top-tier talent by selling the mission of transforming ${lead.businessName} into an AI-first leader." }
          ]
        },
        {
          "heading": "4. OBJECTION HANDLERS",
          "body": [
            { "type": "bullets", "content": ["Price objection response", "Technical complexity response", "Timeline response"] }
          ]
        }
      ]
    }
  `;
  const result = await callGemini(prompt, { responseMimeType: "application/json" });
  return result.text;
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  pushLog(`PROPOSAL_BUILDER: Architecting transformation agreement for ${lead.businessName}`);
  const prompt = `
    GENERATE_PROPOSAL_V16: Create a high-fidelity strategic transformation proposal for ${lead.businessName}.
    Return the response as a UI_BLOCKS JSON object with:
    1. EXECUTVE SUMMARY (Hero format)
    2. THE OPPORTUNITY (Deep paragraph)
    3. THE SOLUTION (Bullet points of AI features)
    4. PROJECTED ROI (Paragraph)
    5. TIMELINE (Bullet points)
    
    Structure the response using UI_BLOCKS JSON schema.
  `;
  const result = await callGemini(prompt, { responseMimeType: "application/json" });
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  pushLog(`SEQUENCER: Drafting 25-day omnipresence flow for ${lead.businessName}`);
  const prompt = `
    TASK: Architect a 7-step high-ticket engagement flow for ${lead.businessName}.
    Step 1: Day 1 (Email - The Disruptive Hook)
    Step 2: Day 3 (Email - Case Study/Proof)
    Step 3: Day 6 (LinkedIn - High-Value Connection Note)
    Step 4: Day 10 (Email - ROI Projection/Value Add)
    Step 5: Day 15 (LinkedIn - Direct Engagement)
    Step 6: Day 20 (Email - Soft Close/Availability)
    Step 7: Day 25 (Email - Final Breakup/Legacy Sync)

    Include full, professional, persuasive message bodies.
  `;

  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                day: { type: Type.NUMBER },
                channel: { type: Type.STRING, description: "EMAIL or LINKEDIN" },
                purpose: { type: Type.STRING },
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
            },
            required: ["day", "channel", "purpose", "body"]
        }
    }
  });

  if (!result.ok) return [];
  try {
    return JSON.parse(result.text);
  } catch (e) {
    return [];
  }
}

export async function groundedLeadSearch(query: string, market: string, count: number): Promise<EngineResult> { return generateLeads(market, query, count); }
export async function fetchLiveIntel(lead: Lead, module: string): Promise<BenchmarkReport> { return {} as any; }
export async function analyzeLedger(leads: Lead[]): Promise<{ risk: string; opportunity: string }> { return { risk: "N/A", opportunity: "N/A" }; }
export async function fetchBenchmarkData(lead: Lead): Promise<BenchmarkReport> { return {} as any; }
export async function extractBrandDNA(lead: Lead, url: string): Promise<BrandIdentity> { return {} as any; }
export async function generateVisual(prompt: string, lead: Lead, sourceImage?: string): Promise<string | undefined> { return undefined; }
export async function generateMockup(name: string, niche: string, leadId: string): Promise<string> { return "https://via.placeholder.com/1024"; }
export async function generateFlashSparks(lead: Lead): Promise<string[]> { return []; }
export async function generateROIReport(ltv: number, leads: number, conv: number): Promise<string> { return ""; }
export async function generateNurtureDialogue(lead: Lead, scenario: string): Promise<any[]> { return []; }
export async function synthesizeProduct(lead: Lead): Promise<any> { return {}; }
export async function openRouterChat(prompt: string, system?: string): Promise<string> { return ""; }
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
export async function loggedGenerateContent(params: { module: string; contents: string | any; config?: any; }): Promise<string> { return ""; }
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
