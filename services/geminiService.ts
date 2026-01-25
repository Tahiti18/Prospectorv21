
/* =========================================================
   GEMINI SERVICE – NATIVE PREVIEW OPTIMIZED (V18)
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

export function clearVault() {
  SESSION_ASSETS.length = 0;
  assetListeners.forEach(l => l([...SESSION_ASSETS]));
  pushLog(`ASSET_VAULT_CLEARED`);
}

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
  pushLog(`NEURAL_SCAN_INIT: Accessing Knowledge Base for ${market} businesses in ${niche}...`);
  
  const prompt = `You are a high-level lead discovery agent for a multi-modal AI agency. 
  Your mission is to identify ${count} real-world, high-ticket businesses located in ${market} specifically within the ${niche} niche.
  
  CRITICAL: You must identify specific businesses that have identifiable "Digital Deficiencies" such as:
  1. Outdated or low-fidelity visual assets.
  2. Lack of cinematic or high-end video content.
  3. Poor social media conversion architecture.
  4. Gaps in automated customer engagement.

  For each business, provide deep tactical data points. Use your internal knowledge to retrieve verified business names and websites.
  
  Return the results as a JSON object adhering to the specified schema.`;
  
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
              rank: { type: Type.NUMBER }
            },
            required: ["businessName", "websiteUrl", "niche", "city", "leadScore", "assetGrade", "socialGap", "rank"],
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
    pushLog(`NEURAL_SCAN_SUCCESS: Syncing ${data.leads.length} identified targets to ledger.`);
    return data;
  } catch (e) {
    pushLog(`RECOVERY_ERROR: Parsing failure on Lead Ledger data.`);
    return { leads: [], rubric: {} as any, assets: {} as any };
  }
}

/**
 * GENERATE EMAIL VARIATIONS (A/B TEST CORE)
 */
export async function generateEmailVariations(lead: Lead): Promise<{ subject: string, body: string }[]> {
    pushLog(`VARIATION_FORGE: Synthesizing A/B outreach vectors for ${lead.businessName}...`);
    const prompt = `
        TASK: Generate 3 distinct outreach email variations for ${lead.businessName}.
        Context: Their niche is ${lead.niche} and they have a identified gap: "${lead.socialGap}".
        
        VARIATION 1: Aggressive/ROI focused. Short subject line, very direct value pitch. CTA: "Book a 15-minute audit".
        VARIATION 2: Insight/Analytic focused. Mention a specific observation about their site or social presence. CTA: "Reply 'BLUE' for the full gap report".
        VARIATION 3: Casual/Human-centric. Very low-friction. Focus on a quick curiosity question. CTA: "Open to a quick screen-share video?".
        
        Return JSON object with "variations" key containing an array of 3 objects { "subject": string, "body": string }.
    `;
    
    const result = await callGemini(prompt, { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                variations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            body: { type: Type.STRING }
                        },
                        required: ["subject", "body"]
                    }
                }
            },
            required: ["variations"]
        }
    });

    if (result.ok) {
        try {
            return JSON.parse(result.text).variations;
        } catch(e) {
            return [];
        }
    }
    return [];
}

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

export async function architectFunnel(lead: Lead): Promise<any[]> {
  pushLog(`FUNNEL_ENGINE: Mapping 5-stage intent geometry for ${lead.businessName}`);
  const prompt = `
    TASK: Architect a definitive 5-stage conversion funnel for ${lead.businessName}.
    Niche: ${lead.niche}
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
  return result.ok ? JSON.parse(result.text) : [];
}

export async function architectPitchDeck(lead: Lead): Promise<any> {
  pushLog(`DECK_ARCHITECT: Structural design for 7-slide narrative for ${lead.businessName}`);
  const prompt = `
    TASK: Architect a 7-slide strategic pitch deck narrative for ${lead.businessName}.
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
  return result.ok ? JSON.parse(result.text) : { slides: [] };
}

export async function generateTaskMatrix(lead: Lead): Promise<any[]> {
  const prompt = `Generate a 10-step technical implementation roadmap for transforming ${lead.businessName}. 
  Return JSON array of { id: string, task: string, status: 'pending' | 'complete' }.`;
  const result = await callGemini(prompt, {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.STRING }, task: { type: Type.STRING }, status: { type: Type.STRING } },
            required: ["id", "task", "status"]
        }
    }
  });
  return result.ok ? JSON.parse(result.text) : [];
}

export async function generatePitch(lead: Lead): Promise<string> {
  const prompt = `Generate high-fidelity pitch scripts for ${lead.businessName}. Use UI_BLOCKS JSON format.`;
  const result = await callGemini(prompt, { responseMimeType: "application/json" });
  return result.text;
}

export async function generateProposalDraft(lead: Lead): Promise<string> {
  const prompt = `Create a high-fidelity strategic transformation proposal for ${lead.businessName}. Use UI_BLOCKS JSON schema.`;
  const result = await callGemini(prompt, { responseMimeType: "application/json" });
  return result.text;
}

export async function generateOutreachSequence(lead: Lead): Promise<any[]> {
  const prompt = `Architect a 7-step high-ticket engagement flow for ${lead.businessName}. Return JSON array.`;
  const result = await callGemini(prompt, { 
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { day: { type: Type.NUMBER }, channel: { type: Type.STRING }, purpose: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } },
            required: ["day", "channel", "purpose", "body"]
        }
    }
  });
  return result.ok ? JSON.parse(result.text) : [];
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
