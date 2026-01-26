import { Lead } from "../types";
import { dossierStorage } from "./dossierStorage";
import { getStoredKeys, deductCost } from "./geminiService";

export interface BoardroomStep {
  agentName: string;
  role: string;
  modelLabel: string;
  modelId: string;
  status: 'WAITING' | 'THINKING' | 'COMPLETED' | 'FAILED';
  output?: string;
  currentRound?: number;
}

// THE DEFINITIVE GHL OPERATIONAL KNOWLEDGE BASE
const GHL_MASTER_KB = `
GOHIGHLEVEL (GHL) ARCHITECTURAL STANDARDS:
1. AI EMPLOYEE SUITE:
   - Voice AI: Real-time qualification, after-hours reception, browser-based voice widgets.
   - Conversation AI: Context-aware multi-channel (Web, SMS, FB, IG, WhatsApp) dialogue.
   - Reviews AI: Reputation velocity, automated sentiment-based responses, ranking protection.
   - Content/Funnel AI: Rapid site generation, copy variants, Social Planner automation.
2. OMNICHANNEL ENGINE:
   - LC Phone/Email: Native 10DLC A2P compliance, Power Dialer, missed-call-text-back.
   - CRM Core: Smart Lists, Custom Objects, API V2 (OAuth), Custom Fields mapping.
3. CONVERSION INFRASTRUCTURE:
   - Funnels/Sites: Membership portals, Client Portals, Global CSS branding.
   - Calendars: Round-robin distribution, Team booking, Payment-gated appointments.
4. AUTOMATION (WORKFLOWS):
   - Logic Branching: Conditional wait steps, inbound/outbound webhooks, logic gates.
   - Snapshots: Portable infrastructure templates for repeatability and scale.
5. MONETIZATION:
   - SaaS Mode: Pro-plan rebilling, White-label commercialization, Stripe integration.
`;

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-min limit for deep synthesis

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS Boardroom",
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature: 0.75,
        max_tokens: 4000
      })
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Neural Link Timeout");
    
    const text = data.choices[0].message.content;
    deductCost(model, (prompt.length + text.length));
    return text;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: Cognitive load exceeded GHL processing limits.");
    throw e;
  }
}

export const executeNeuralBoardroom = async (
  lead: Lead, 
  rounds: number,
  onUpdate: (steps: BoardroomStep[]) => void
): Promise<string> => {
  const dossier = dossierStorage.getByLead(lead.id);
  if (!dossier) throw new Error("Strategic Manifest Required. Run Campaign Forge First.");

  const context = JSON.stringify(dossier.data);
  let debateTranscript = "";
  
  const steps: BoardroomStep[] = [
    { agentName: 'ARCHITECT', role: 'Technical Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Risk & Compliance', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Final Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - NEVER USE ALL-CAPS FOR PARAGRAPHS OR BULLET POINTS. USE SENTENCE CASE.
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO HASHTAGS, NO BACKTICKS).
  - ONLY HEADINGS CAN BE ALL-CAPS.
  - EXPAND DETAIL TO THE MAX. BE EXHAUSTIVE, NOT REDUNDANT.
  - REFERENCE GHL SPECIFICS: ${GHL_MASTER_KB}
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect a massive GHL technical build for ${lead.businessName}.\n${CLEAN_SIGNAL_PROTOCOL}`,
      "You are the Apex GHL Architect. You have total mastery of every sub-module and API endpoint. No markdown.",
      steps[0].modelId
    );
    debateTranscript += `ARCHITECT DRAFT:\n${initialDraft}\n\n`;
    steps[0].output = initialDraft;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS ---
    for (let r = 1; r <= rounds; r++) {
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();
      const auditOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Find failure points in this GHL plan. Audit A2P 10DLC, API V2 limits, and conversion friction.\n${CLEAN_SIGNAL_PROTOCOL}`,
        "You are the Brutal GHL Auditor. You are technically precise. No markdown.",
        steps[1].modelId
      );
      debateTranscript += `AUDIT ROUND ${r}:\n${auditOutput}\n\n`;
      steps[1].output = auditOutput;
      steps[1].status = 'COMPLETED';
      updateUI();

      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();
      const refinerOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Solve the Audit findings. Re-engineer the architecture for maximum agency ROI.\n${CLEAN_SIGNAL_PROTOCOL}`,
        "You are the Strategic Refiner. You solve all gaps. No markdown.",
        steps[2].modelId
      );
      debateTranscript += `REFINEMENT ROUND ${r}:\n${refinerOutput}\n\n`;
      steps[2].output = refinerOutput;
      steps[2].status = 'COMPLETED';
      updateUI();
    }

    // --- PHASE 3: EXECUTIVE SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();

    const finalPlan = await callAgent(
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the DEFINITIVE GHL MASTER BLUEPRINT.
      INSTRUCTIONS: Cover every area of the build (AI, Outreach, CRM, Funnels, SaaS). 
      EXPAND DETAIL TO THE ABSOLUTE MAXIMUM. DO NOT SUMMARIZE.
      OUTPUT EXACT RAW JSON ONLY. NO MARKDOWN BACKTICKS.
      REQUIRED STRUCTURE:
      {
        "format": "ui_blocks",
        "title": "GHL MASTER ARCHITECTURE",
        "subtitle": "EXHAUSTIVE IMPLEMENTATION SCHEMATIC",
        "sections": [
          {
            "heading": "SYSTEM INFRASTRUCTURE AND API ORCHESTRATION",
            "body": [
              { "type": "hero", "content": "The overall vision for the technical ecosystem." },
              { "type": "p", "content": "Comprehensive paragraph about the base configuration." },
              { "type": "bullets", "content": ["Technical step 1", "Technical step 2", "Technical step 3"] }
            ]
          },
          {
             "heading": "AI EMPLOYEE AND CONVERSATIONAL LAYER",
             "body": [ { "type": "p", "content": "Exhaustive details on Voice AI and Chat AI config." }, { "type": "bullets", "content": ["AI config point 1", "AI config point 2"] } ]
          },
          {
             "heading": "CRM PIPELINES AND REVENUE OPS",
             "body": [ { "type": "p", "content": "Deep dive into custom fields, objects, and stages." } ]
          }
        ]
      }`,
      "You are the Executive Vice President of GHL Implementation. You deliver the most comprehensive, detailed blueprints in the agency world. No markdown. Sentence case body text.",
      steps[3].modelId
    );

    steps[3].status = 'COMPLETED';
    steps[3].output = finalPlan;
    updateUI();

    return finalPlan;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};