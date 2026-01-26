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
 * PRODUCTION-GRADE GHL KNOWLEDGE BASE
 * Deliverables A, B, C integrated into the prompt context.
 */
const GHL_KNOWLEDGE_BASE = `
GOHIGHLEVEL (GHL) ARCHITECTURAL CONSTRAINTS:
1. PLATFORM UNIT: Sub-Account deployment.
2. AI SUITE: Voice AI (receptionist/booking), Conversation AI (omnichannel chat), Reviews AI (reputation), Funnel AI, Content AI, Workflow AI.
3. AUTOMATION: Use Workflows only. Campaigns/Triggers are deprecated.
4. SNAPSHOTS: Copy funnels, calendars, workflows, and custom fields across sub-accounts.
5. CHANNELS: LC Email (Mailgun), LC Phone (Twilio), SMS, WhatsApp, FB, IG, Webchat.
6. COMPLIANCE: TCPA, HIPAA, GDPR, 10DLC A2P must be technical hurdles handled via workflow gates.

NICHE SNAPSHOTS (TRUTH ANCHORS):
- DENTAL: Implant consults, insurance qualification surveys, 90-day reactivation.
- ROOFING: Storm damage assessments, inspection prep workflows, weather-triggered blasts.
- MEDSPA: Contraindication screening via Chat AI, injectables consults, membership retention.
- LEGAL: Case intake checklists, statute of limitations tracking, document request loops.
- REAL ESTATE: Home valuation funnels, buyer consult nurture, open house follow-ups.
- SMB: Same-day service scheduling, MCTB (Missed Call Text Back) is critical.
`;

const FINAL_SYNTHESIS_SCHEMA = `
Deliverable A JSON Schema Structure (Strict):
{
  "meta": { "schema_version": "1.0", "source_system": "ProspectorOS" },
  "implementation_plan": {
    "platform_assumptions": { "use_workflows_not_campaigns": true, "ai_suite_expected": ["Voice AI", "Conversation AI", "Reviews AI", "Funnel AI", "Content AI", "Workflow AI"] },
    "pipelines": [{ "name": "Main", "stages": [], "definitions": { "stage_entry_rules": [], "stage_exit_rules": [] } }],
    "assets": { "funnels": [], "forms": [], "calendars": [] },
    "ai": { "voice_ai": {}, "conversation_ai": {}, "policies": {} },
    "workflows": [{ "name": "", "trigger": "", "steps": [], "exit_conditions": [] }],
    "roadmap_90_day": { "days_0_7": [], "days_8_30": [], "days_31_60": [], "days_61_90": [] }
  }
}
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
        temperature: 0.7,
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
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: Boardroom debate reached complexity limits.");
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
    { agentName: 'PLANNER', role: 'System Implementation Architect', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'QA & Compliance Auditor', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'ENGINEER', role: 'Workflow & AI Policy Engineer', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master System Synthesizer', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const PROTOCOL = `
  STRICT ARCHITECT PROTOCOL:
  - NO MARKDOWN (NO ASTERISKS, NO BACKTICKS).
  - USE SENTENCE CASE FOR PARAGRAPHS.
  - BE EXHAUSTIVE. COVER ALL GHL MODULES.
  - CONTEXT: ${GHL_KNOWLEDGE_BASE}
  `;

  try {
    // --- PHASE 1: PLANNER (D2) ---
    steps[0].status = 'THINKING';
    updateUI();
    const plannerOutput = await callAgent(
      `BUSINESS DATA: ${context}\n\nTask: Architect a complete GHL deployment for ${lead.businessName}. Define pipeline stages, core offer mapping, and channel stack selection.\n${PROTOCOL}`,
      "You are the GHL Planner Agent. You turn business analysis into implementation architecture. No markdown.",
      steps[0].modelId
    );
    debateTranscript += `PLANNER ARCHITECTURE:\n${plannerOutput}\n\n`;
    steps[0].output = plannerOutput;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS (D6 & Deliverable B) ---
    for (let r = 1; r <= rounds; r++) {
      // Auditor (D6)
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();
      const auditOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Perform a QA Audit. Generate 15+ test cases and a go-live checklist. Identify compliance risks (A2P 10DLC) and logic holes.\n${PROTOCOL}`,
        "You are the GHL Go-Live Auditor. You find every point of failure. Brutal precision. No markdown.",
        steps[1].modelId
      );
      debateTranscript += `AUDIT REPORT:\n${auditOutput}\n\n`;
      steps[1].output = auditOutput;
      steps[1].status = 'COMPLETED';
      updateUI();

      // Engineer (D3/D4)
      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();
      const engineerOutput = await callAgent(
        `HISTORY:\n${debateTranscript}\n\nTask: Build the Workflow Library (12-25 workflows) and AI Policy. Define triggers, steps, and handoff thresholds.\n${PROTOCOL}`,
        "You are the Workflow Engineer. You define the logic that powers the business. Implementation-ready details. No markdown.",
        steps[2].modelId
      );
      debateTranscript += `ENGINEERING SPECS:\n${engineerOutput}\n\n`;
      steps[2].output = engineerOutput;
      steps[2].status = 'COMPLETED';
      updateUI();
    }

    // --- PHASE 3: MASTER SYNTHESIS (D1/D7/Dossier blocks) ---
    steps[3].status = 'THINKING';
    updateUI();

    const finalBlueprint = await callAgent(
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the DEFINITIVE GHL MASTER BLUEPRINT.
      STRUCTURE: Output EXACT raw JSON following the UI_BLOCKS format.
      REQUIREMENT: Merge ALL findings into a massive, non-redundant plan. 
      INCLUDE: 90-day roadmap, complete asset list, and workflow map.
      JSON SCHEMA REFERENCE: ${FINAL_SYNTHESIS_SCHEMA}
      
      FINAL UI_BLOCKS OUTPUT SCHEMA:
      {
        "format": "ui_blocks",
        "title": "GHL MASTER ARCHITECTURE",
        "subtitle": "EXHAUSTIVE IMPLEMENTATION BLUEPRINT",
        "sections": [
          { "heading": "SYSTEM INFRASTRUCTURE", "body": [ { "type": "hero", "content": "" }, { "type": "p", "content": "" } ] },
          { "heading": "AI EMPLOYEE SUITE", "body": [ { "type": "steps", "content": ["Config Voice AI", "Map Chat AI"] } ] },
          { "heading": "WORKFLOW REVENUE ENGINE", "body": [ { "type": "bullets", "content": [] } ] },
          { "heading": "COMPLIANCE & QA MATRIX", "body": [ { "type": "scorecard", "label": "TCPA", "value": "PASSED" } ] },
          { "heading": "90-DAY GROWTH ROADMAP", "body": [ { "type": "timeline", "content": [] } ] }
        ]
      }`,
      "You are the Executive Vice President of GHL Implementation. You deliver zero-fluff, implementation-grade JSON blueprints. Exhaustive detail. Sentence case content.",
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