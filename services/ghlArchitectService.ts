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

/**
 * THE DEFINITIVE GOHIGHLEVEL MASTER KNOWLEDGE BASE
 * Integrated from production-grade operational schema.
 */
const GHL_FULL_SPEC = `
GOHIGHLEVEL OPERATIONAL INFRASTRUCTURE (MASTER KB):

0. GLOBAL PRINCIPLES:
- Speed-to-lead + automated follow-up > traffic volume.
- Revenue-first, automation-heavy, human-in-the-loop only where necessary.

1. NATIVE AI EMPLOYEE SUITE:
- Voice AI: Browser-based widgets, real-time qualification, after-hours receptionist, deflection.
- Conversation AI: Adaptive chat on Web, SMS, FB, IG, WhatsApp.
- Reviews AI: Google/FB automation, sentiment triage, auto-response.
- Funnel/Website AI: Generative deployment.
- Content AI: Multi-channel copy (SMS/Email/Ad/Social) + image synthesis.
- Workflow AI: Logic-branching assistance.

2. OMNICHANNEL OUTREACH ENGINE:
- SMS/MMS: Speed-to-lead, 2-way sales chat, nudges.
- LC Email: Deliverability focus, domain warming, high-volume sequences.
- LC Phone/Calling: Native telephony, Power Dialer, Call Dispositions as triggers.
- Voicemail Drops: Missed Call Text Back (MCTB) automation.

3. CONVERSION INFRASTRUCTURE:
- Funnels/Sites: Offer pages, membership/client portals.
- Forms & Surveys: intake logic, custom field/tag mapping.
- Calendars: Round-robin, team distribution, payment-gated booking.

4. CRM & PIPELINE OPS:
- Contact Record: Unified Inbox, Custom Objects, Smart Lists.
- Pipelines: Standardized journeys (New Lead -> Qualified -> Booked -> Won).
- Task Mgmt: Internal notifications, SLA-driven follow-ups.

5. SCALE & MONETIZATION:
- Snapshots: Portable infrastructure templates (Workflows, Funnels, Fields).
- SaaS Mode: White-labeling, rebilling, marketplace integration.
- Payments: Stripe/PayPal, deposits, recurring subscriptions, automated invoicing.

6. REPUTATION & SOCIAL:
- GBP Integration: Review velocity management, local SEO ranking protection.
- Social Planner: Evergreen scheduling, AI-assisted content cadence.
`;

const IMPLEMENTATION_SCHEMA = `
REQUIRED OUTPUT STRUCTURE (GHL MASTER BLUEPRINT):
1. Business Objectives (Revenue goals, close rates, speed-to-lead SLAs).
2. Offer Architecture (Primary/Secondary offers, pricing, guarantees).
3. Acquisition & Conversion Assets (Funnel map, form fields, widget placement).
4. Routing & Pipeline Design (Round-robin logic, stage entry/exit rules).
5. Workflow Library (Speed-to-lead, MCTB, No-show recovery, Review requests).
6. AI Usage Policy (Voice/Chat handoff thresholds, compliance constraints).
7. Snapshot & Scale Strategy (Niche-specific deployment, SaaS tier mapping).
8. 90-Day Optimization Roadmap (Weekly KPIs, performance tuning).
`;

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); 

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS GHL Architect",
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
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: Cognitive complexity peaked.");
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
    { agentName: 'ARCHITECT', role: 'System Infrastructure', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Compliance', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - DO NOT USE ALL-CAPS FOR PARAGRAPHS. USE SENTENCE CASE.
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO BACKTICKS, NO HASHTAGS).
  - ONLY MAIN HEADINGS CAN BE ALL-CAPS.
  - BE EXHAUSTIVE AND SPECIFIC TO GHL MODULES: ${GHL_FULL_SPEC}
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect an exhaustive GHL implementation plan for ${lead.businessName}. Focus on Voice AI receptionists, Snapshots, and complex Workflow trees.\n${CLEAN_SIGNAL_PROTOCOL}`,
      "You are the Lead GHL Architect. You have total technical recall of every GoHighLevel module. No markdown.",
      steps[0].modelId
    );
    debateTranscript += `ARCHITECT DRAFT:\n${initialDraft}\n\n`;
    steps[0].output = initialDraft;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS ---
    for (let r = 1; r <= rounds; r++) {
      // Auditor
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();
      const auditOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Find failure points in this GHL plan. Check for A2P 10DLC compliance, API webhook limits, and friction in the lead journey.\n${CLEAN_SIGNAL_PROTOCOL}`,
        "You are the Brutal GHL Auditor. You find hidden flaws. No markdown.",
        steps[1].modelId
      );
      debateTranscript += `AUDIT ROUND ${r}:\n${auditOutput}\n\n`;
      steps[1].output = auditOutput;
      steps[1].status = 'COMPLETED';
      updateUI();

      // Refiner
      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();
      const refinerOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Solve all Auditor concerns. Re-engineer the build for maximum agency ROI via Snapshots and SaaS Mode optimization.\n${CLEAN_SIGNAL_PROTOCOL}`,
        "You are the Strategic Refiner. You solve all gaps. No markdown.",
        steps[2].modelId
      );
      debateTranscript += `REFINEMENT ROUND ${r}:\n${refinerOutput}\n\n`;
      steps[2].output = refinerOutput;
      steps[2].status = 'COMPLETED';
      updateUI();
    }

    // --- PHASE 3: EXECUTIVE MASTER SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();

    const finalPlan = await callAgent(
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the DEFINITIVE MASTER BLUEPRINT for ${lead.businessName}.
      INSTRUCTIONS:
      - Cover EVERY area of the GHL stack: AI Suite, Outreach, CRM, Funnels, SaaS, and Monetization.
      - BE EXHAUSTIVE. Write massive, detailed paragraphs for each section. 
      - DO NOT REDUNDANTLY LIST IDEAS; MERGE THEM into a single superior plan.
      - FOLLOW THIS EXACT SCHEMA: ${IMPLEMENTATION_SCHEMA}
      - OUTPUT EXACT RAW JSON ONLY. DO NOT USE MARKDOWN CODE BLOCKS.
      - ENSURE ALL "content" STRINGS ARE MASSIVE AND HIGH-DETAIL.

      REQUIRED JSON STRUCTURE:
      {
        "format": "ui_blocks",
        "title": "GHL MASTER ARCHITECTURE",
        "subtitle": "EXHAUSTIVE TECHNICAL SCHEMATIC",
        "sections": [
          {
            "heading": "SYSTEM INFRASTRUCTURE & API ORCHESTRATION",
            "body": [
              { "type": "hero", "content": "Master vision of the implementation." },
              { "type": "p", "content": "Detailed, multi-para implementation strategy in sentence case." },
              { "type": "bullets", "content": ["Action item 1", "Action item 2", "API Endpoint config"] }
            ]
          }
        ]
      }`,
      "You are the Executive Vice President of GHL Implementation. You synthesize massive, detailed technical blueprints in raw JSON format. No markdown.",
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
