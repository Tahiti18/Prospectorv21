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
 * INDIGO GHL PLANNER — KNOWLEDGE BASE v1.0 (PRODUCTION-GRADE)
 * Distilled Truth Anchors for GoHighLevel System Architecture
 */
const INDIGO_KNOWLEDGE_BASE = `
INDIGO GHL PLANNER MASTER SPECIFICATION:

0. SYSTEM PRIMITIVES:
- Platform: GoHighLevel (GHL)
- Automation: Workflows only (Campaigns/Triggers are deprecated)
- AI Suite: Voice AI, Conversation AI, Reviews AI, Funnel AI, Content AI, Workflow AI.
- Execution: Sub-Account deployment via Snapshots.

1. GHL OBJECT CANON:
- Contact: fields, custom_fields, tags, source, conversation_history.
- Opportunity: pipeline, stage, value, assigned_user.
- Pipeline: stages, entry_rules, exit_rules.
- Workflow: trigger, steps, conditions, exit_conditions.
- Action Dictionary: send_sms, send_email, make_call, assign_user, add_tag, update_custom_field, move_pipeline_stage, create_task, wait, if_else, webhook, notify_internal.

2. TRIGGER CONTRACT:
- events: contact.created, contact.updated, conversation.inbound, call.inbound, call.missed, appointment.booked, appointment.cancelled, appointment.no_show, pipeline.stage_changed, invoice.sent, payment.received, review.received.

3. NICHE SNAPSHOT INDEX:
- DENTAL: Implant consults, insurance qualification.
- ROOFING: Storm damage assessment, inspection booking.
- MEDSPA: Contraindication screening, membership retention.
- LEGAL: Case intake, document request.
- REAL ESTATE: Home valuation, buyer consult.
- TRADES: Same day service, MCTB primary.

4. AI POLICY:
- VOICE AI: Qualification, booking, FAQ. Handoff for: price negotiation, legal/medical advice, high anger.
- CHAT AI: Intake, routing, booking. Disallowed: advice, guarantees.
- REVIEWS AI: Auto-respond positive/neutral; human approval for negative.
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
    { agentName: 'PLANNER', role: 'Architectural Strategist', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Compliance & Risk Auditor', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'ENGINEER', role: 'Workflow & Logic Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis Executive', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const PROTOCOL_HEADER = `
  STRICT INDIGO PROTOCOL:
  - NO MARKDOWN (NO ASTERISKS, NO BACKTICKS, NO HASHTAGS).
  - USE SENTENCE CASE FOR PARAGRAPHS.
  - KNOWLEDGE BASE: ${INDIGO_KNOWLEDGE_BASE}
  `;

  try {
    // --- PHASE 1: PLANNER ---
    steps[0].status = 'THINKING';
    updateUI();
    const plannerPrompt = `
      CONTEXT: ${context}
      TASK: Architect the GHL deployment for ${lead.businessName}.
      OUTPUT CONTRACT: Define pipelines, offer funnels, asset maps (forms/surveys), and infrastructure (LC Phone vs Twilio).
      ${PROTOCOL_HEADER}
    `;
    const plannerOutput = await callAgent(plannerPrompt, "You are the PLANNER agent. You turn strategy into GHL architecture. No markdown.", steps[0].modelId);
    debateTranscript += `PLANNER ARCHITECTURE:\n${plannerOutput}\n\n`;
    steps[0].output = plannerOutput;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: AUDITOR ---
    steps[1].status = 'THINKING';
    updateUI();
    const auditorPrompt = `
      HISTORY: ${debateTranscript}
      TASK: Perform a Compliance & Risk Audit (Red Team).
      OUTPUT CONTRACT: Define compliance requirements (TCPA/A2P), disallowed claims, workflow risks, and AI handoff thresholds.
      ${PROTOCOL_HEADER}
    `;
    const auditorOutput = await callAgent(auditorPrompt, "You are the AUDITOR agent. You find failures and compliance risks. No markdown.", steps[1].modelId);
    debateTranscript += `AUDIT REPORT:\n${auditorOutput}\n\n`;
    steps[1].output = auditorOutput;
    steps[1].status = 'COMPLETED';
    updateUI();

    // --- PHASE 3: ENGINEER ---
    steps[2].status = 'THINKING';
    updateUI();
    const engineerPrompt = `
      HISTORY: ${debateTranscript}
      TASK: Define atomic workflow logic and event mapping.
      OUTPUT CONTRACT: Workflow definitions (triggers/steps), custom field schema, and tag schema using ONLY the Action Dictionary.
      ${PROTOCOL_HEADER}
    `;
    const engineerOutput = await callAgent(engineerPrompt, "You are the ENGINEER agent. You build the logic gates and workflows. No markdown.", steps[2].modelId);
    debateTranscript += `ENGINEERING SPECS:\n${engineerOutput}\n\n`;
    steps[2].output = engineerOutput;
    steps[2].status = 'COMPLETED';
    updateUI();

    // --- PHASE 4: EXECUTIVE MASTER SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();
    const execPrompt = `
      TRANSCRIPT: ${debateTranscript}
      TASK: Synthesize the DEFINITIVE INDIGO MASTER BLUEPRINT for ${lead.businessName}.
      INSTRUCTIONS: Merge all boardroom logic into a massive, implementation-grade schematic.
      REQUIREMENT: Output EXACT RAW JSON using the UI_BLOCKS format.
      
      FINAL UI_BLOCKS OUTPUT SCHEMA:
      {
        "format": "ui_blocks",
        "title": "GHL MASTER ARCHITECTURE",
        "subtitle": "INDIGO PRODUCTION BLUEPRINT",
        "sections": [
          { "heading": "SYSTEM INFRASTRUCTURE", "body": [ { "type": "hero", "content": "" }, { "type": "p", "content": "" } ] },
          { "heading": "PIPELINE & CUSTOM SCHEMA", "body": [ { "type": "bullets", "content": [] } ] },
          { "heading": "WORKFLOW REVENUE ENGINE", "body": [ { "type": "steps", "content": [] } ] },
          { "heading": "AI EMPLOYEE POLICY", "body": [ { "type": "callout", "content": "" }, { "type": "bullets", "content": [] } ] },
          { "heading": "COMPLIANCE & QA MATRIX", "body": [ { "type": "scorecard", "label": "TCPA", "value": "PASSED" } ] },
          { "heading": "90-DAY DEPLOYMENT TIMELINE", "body": [ { "type": "timeline", "content": [] } ] }
        ]
      }
    `;
    const finalBlueprint = await callAgent(execPrompt, "You are the EXECUTIVE synthesis authority. You emit massive, zero-fluff JSON blueprints. No markdown.", steps[3].modelId);
    
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
