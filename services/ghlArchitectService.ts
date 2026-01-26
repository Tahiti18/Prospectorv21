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
 * THE ULTIMATE GOHIGHLEVEL MASTER KNOWLEDGE BASE
 * This represents the "System of Truth" for all GHL Architect agents.
 */
const GHL_MASTER_KNOWLEDGE = `
GOHIGHLEVEL (GHL) PLATFORM CAPABILITIES & CONSTRAINTS:

1. AI EMPLOYEE SUITE:
   - Voice AI: After-hours receptionist, real-time qualification, calendar booking, website voice widget.
   - Conversation AI: Omnichannel (SMS, FB, IG, WA, Web) chat automation with fallback thresholds.
   - Reviews AI: Automated sentiment triage and review response management.
   - Funnel AI / Content AI / Workflow AI: Generative deployment and logic branching.

2. OMNICHANNEL ENGINE:
   - LC Phone (Twilio Native): Power Dialer, Call Dispositions, Missed-Call-Text-Back (MCTB).
   - LC Email (Mailgun Native): Sequence automation, deliverability optimization.
   - 10DLC A2P Compliance: Required technical gates for all SMS campaigns.

3. CONVERSION ASSETS:
   - Funnels/Websites: High-speed conversion architecture.
   - Calendars: Round-robin, team-based, and payment-gated bookings.
   - Snapshots: Master templates for cloning complete sub-account logic.

NICHE SNAPSHOT ARCHITECTURES:
- DENTAL: Implant consults, insurance qualification forms, 180-day reactivation loops.
- ROOFING: Storm damage assessments, weather-trigger campaigns, estimate follow-up sequences.
- MEDSPA: Contraindication screening via Chat AI, membership retention, injectables consults.
- LEGAL: Case evaluation calls, intake checklists, doc-request workflows.
- REAL ESTATE: Home valuation funnels, buyer/seller nurture, open house follow-up.
- SMB/TRADES: MCTB-heavy, technician dispatch ETA notifications, instant payment links.

HANDOFF PROTOCOL:
- Lead Source Map -> Tags:source_<name>
- Trigger Events: lead.created, call.missed, appointment.booked, pipeline.stage_changed.
`;

const FINAL_SYNTHESIS_SCHEMA = `
JSON OUTPUT SCHEMA (STRICT ADHERENCE):
{
  "format": "ui_blocks",
  "title": "GHL MASTER ARCHITECTURE",
  "subtitle": "EXHAUSTIVE IMPLEMENTATION SCHEMATIC",
  "sections": [
    {
      "heading": "SYSTEM INFRASTRUCTURE AND COMPLIANCE",
      "body": [
        { "type": "hero", "content": "The overall vision for the sub-account architecture." },
        { "type": "p", "content": "Details on LC Phone/Email and A2P 10DLC setup." },
        { "type": "scorecard", "label": "COMPLIANCE STATUS", "value": "Awaiting Bundle" }
      ]
    },
    {
      "heading": "PIPELINE AND CRM MAPPING",
      "body": [
        { "type": "p", "content": "Definition of stages from New Lead to Won." },
        { "type": "bullets", "content": ["Stage 1: Logic...", "Stage 2: Logic..."] }
      ]
    },
    {
      "heading": "AI EMPLOYEE AND CONVERSATIONAL LAYER",
      "body": [
         { "type": "p", "content": "Configuration of Voice AI and Chat AI tools." },
         { "type": "steps", "content": ["Step 1: Training Data...", "Step 2: Handoff Rules..."] }
      ]
    },
    {
      "heading": "WORKFLOW AND AUTOMATION LIBRARY",
      "body": [
         { "type": "p", "content": "Detailed breakdown of at least 15 required workflows." },
         { "type": "bullets", "content": ["Workflow: MCTB...", "Workflow: No-Show Recovery...", "Workflow: Speed-to-Lead..."] }
      ]
    },
    {
      "heading": "90-DAY GROWTH ROADMAP",
      "body": [
        { "type": "timeline", "content": ["Days 0-7: Build", "Days 8-30: Launch", "Days 31-90: Scale"] }
      ]
    }
  ]
}
`;

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://pomelli.agency",
      "X-Title": "Prospector OS GHL Architect",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Neural Link Timeout");
  
  const text = data.choices[0].message.content;
  deductCost(model, (prompt.length + text.length));
  return text;
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
    { agentName: 'PLANNER', role: 'Technical System Architect', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Risk & QA Auditor', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'ENGINEER', role: 'Workflow & AI Engineer', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master System Synthesizer', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const PROTOCOL = `
  STRICT ARCHITECT PROTOCOL:
  - NO MARKDOWN (NO ASTERISKS, NO BACKTICKS).
  - USE SENTENCE CASE FOR ALL BODY CONTENT.
  - BE EXHAUSTIVE. NO REDUNDANCY. COVER ALL 6 GHL AI TOOLS.
  - KNOWLEDGE BASE: ${GHL_MASTER_KNOWLEDGE}
  `;

  try {
    // --- PHASE 1: PLANNER ---
    steps[0].status = 'THINKING';
    updateUI();
    const plannerOutput = await callAgent(
      `BUSINESS DATA: ${context}\n\nTask: Architect the complete GHL sub-account structure. Define pipelines, offer assets, and niche-specific snapshot contents.\n${PROTOCOL}`,
      "You are the GHL Planner Agent. You turn high-level strategy into technical platform architecture. No markdown.",
      steps[0].modelId
    );
    debateTranscript += `PLANNER ARCHITECTURE:\n${plannerOutput}\n\n`;
    steps[0].output = plannerOutput;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS ---
    for (let r = 1; r <= rounds; r++) {
      // Auditor
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();
      const auditOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Perform a brutal QA audit. Identify failure points in A2P 10DLC, HIPAA gates, and funnel friction. Demand technical precision.\n${PROTOCOL}`,
        "You are the GHL Auditor. You find every hidden technical and compliance flaw. No markdown.",
        steps[1].modelId
      );
      debateTranscript += `AUDIT REPORT:\n${auditOutput}\n\n`;
      steps[1].output = auditOutput;
      steps[1].status = 'COMPLETED';
      updateUI();

      // Engineer
      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();
      const engineerOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Resolve Auditor findings. Build the Workflow Library (triggers/steps) and define the AI handoff protocols.\n${PROTOCOL}`,
        "You are the GHL Workflow Engineer. You define the executable logic of the platform. No markdown.",
        steps[2].modelId
      );
      debateTranscript += `ENGINEERING SPECS:\n${engineerOutput}\n\n`;
      steps[2].output = engineerOutput;
      steps[2].status = 'COMPLETED';
      updateUI();
    }

    // --- PHASE 3: MASTER SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();

    const finalBlueprint = await callAgent(
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the DEFINITIVE MASTER BLUEPRINT for ${lead.businessName}.
      MERGE everything into a massive, technical, non-redundant schematic.
      OUTPUT EXACT RAW JSON FOLLOWING THE UI_BLOCKS FORMAT. NO MARKDOWN.
      SCHEMA: ${FINAL_SYNTHESIS_SCHEMA}`,
      "You are the Executive Vice President of GHL Strategy. You deliver massive, implementation-grade blueprints in valid raw JSON. No markdown.",
      steps[3].modelId
    );

    steps[3].status = 'COMPLETED';
    steps[3].output = finalBlueprint;
    updateUI();

    return finalBlueprint;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};