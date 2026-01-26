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

const GHL_KNOWLEDGE_BASE = `
GO-HIGHLEVEL (GHL) TECHNICAL STACK:
- CORE CRM: Smart Lists, Tags, Custom Fields (Text, Number, Date), Custom Objects.
- AUTOMATION: Workflow AI, Logic Branching, Webhooks (Inbound/Outbound), API V2 (OAuth), Custom Values.
- MESSAGING: A2P 10DLC Compliance, Twilio Integration, SMTP Providers, WhatsApp API, FB/IG DM Integration.
- FUNNELS/SITES: Funnel Builder, Website CMS, Global CSS, Membership/Course Portals, Client Portals.
- REPUTATION: GMB/LSA Management, Review Request Workflows.
- SAAS MODE: White-labeling, Pro-Plan Rebilling, Sub-account Snapshots, Marketplace Apps.
- CALENDAR: Round-robin, Team booking, Payment-gated appointments.
`;

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-min circuit breaker for complex GHL reasoning

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
        temperature: 0.8,
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
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: GHL reasoning saturation reached.");
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
    { agentName: 'ARCHITECT', role: 'GHL System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Compliance Audit', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - NEVER USE ALL CAPS FOR BODY TEXT OR BULLETS. USE SENTENCE CASE.
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO HASHTAGS).
  - USE ALL-CAPS HEADINGS ONLY (E.G. TECHNICAL SCHEMATIC:).
  - EXPAND DETAIL TO THE MAX. BE EXHAUSTIVE.
  - REFERENCE SPECIFIC GHL FEATURES: ${GHL_KNOWLEDGE_BASE}
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect an exhaustive GHL Technical Build for ${lead.businessName}.\n${CLEAN_SIGNAL_PROTOCOL}\n\nFOCUS: API V2 Webhooks, Custom Objects for unique business data, and SaaS Mode rebilling logic.`,
      "You are the Apex GHL Architect. You have an exhaustive knowledge of GoHighLevel. You never use markdown. You provide Implementation-ready technical schematics.",
      steps[0].modelId
    );
    
    debateTranscript += `ARCHITECT DRAFT:\n${initialDraft}\n\n`;
    steps[0].output = initialDraft;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS ---
    for (let r = 1; r <= rounds; r++) {
      // AUDITOR
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();

      try {
        const auditOutput = await callAgent(
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Audit this GHL plan for failure points. Check A2P 10DLC trust scores, Workflow rate limits, and SMTP reputation risks.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Brutal GHL Auditor. You find every technical flaw in a setup. No markdown.",
          steps[1].modelId
        );
        debateTranscript += `AUDIT ROUND ${r}:\n${auditOutput}\n\n`;
        steps[1].output = auditOutput;
        steps[1].status = 'COMPLETED';
      } catch (err) {
        steps[1].status = 'FAILED';
        throw err;
      }
      updateUI();

      // REFINER
      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();

      try {
        const refinerOutput = await callAgent(
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Solve all Auditor concerns. Inject high-level CRM logic like "Wait steps", "Conditional branching", and "Webhook triggers".\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Strategic Refiner. You maximize GHL efficiency and profitability. No markdown.",
          steps[2].modelId
        );
        debateTranscript += `REFINEMENT ROUND ${r}:\n${refinerOutput}\n\n`;
        steps[2].output = refinerOutput;
        steps[2].status = 'COMPLETED';
      } catch (err) {
        steps[2].status = 'FAILED';
        throw err;
      }
      updateUI();
    }

    // --- PHASE 3: EXECUTIVE SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();

    const finalPlan = await callAgent(
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the ULTIMATE GHL MASTER BLUEPRINT.
      EXPAND DETAIL TO THE MAX. COVER EVERY ASPECT OF THE BUILD.
      REQUIRED STRUCTURE: Output EXACT raw JSON with NO markdown formatting inside strings.
      { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "subtitle": "TECHNICAL IMPLEMENTATION GUIDE", "sections": [ { "heading": "SYSTEM INFRASTRUCTURE AND API ORCHESTRATION", "body": [ { "type": "hero", "content": "Summary of GHL vision" }, { "type": "p", "content": "Detailed implementation para" }, { "type": "bullets", "content": ["Specific Workflow Step", "API V2 Endpoint logic", "Custom Field mapping"] } ] } ] }`,
      "You are the Executive Vice President of GHL Strategy. You provide the most comprehensive technical plans ever generated. No markdown.",
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