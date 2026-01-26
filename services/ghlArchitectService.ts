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
 * INDIGO GHL PLANNER — MASTER KNOWLEDGE BASE
 */
const INDIGO_KNOWLEDGE_BASE = `
INDIGO GHL Master specification for automated execution:

- Automation Engine: Workflows only (Campaigns/Triggers deprecated).
- AI Suite: Voice AI, Conversation AI, Reviews AI, Funnel AI, Content AI, Workflow AI.
- Object Model: Contacts, Custom Fields, Tags, Pipelines, Stages.
- Action Dictionary: send_sms, send_email, make_call, assign_user, add_tag, update_custom_field, move_pipeline_stage, webhook.
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
  - NO MARKDOWN.
  - USE SENTENCE CASE.
  - KB: ${INDIGO_KNOWLEDGE_BASE}
  `;

  try {
    // --- PHASE 1-3 AGENT CALLS ---
    steps[0].status = 'THINKING';
    updateUI();
    const plannerOut = await callAgent(`CONTEXT: ${context}\nTASK: Architect GHL deployment for ${lead.businessName}. ${PROTOCOL_HEADER}`, "You are the PLANNER agent.", steps[0].modelId);
    debateTranscript += `PLANNER:\n${plannerOut}\n\n`;
    steps[0].output = plannerOut; steps[0].status = 'COMPLETED'; updateUI();

    steps[1].status = 'THINKING';
    updateUI();
    const auditorOut = await callAgent(`HISTORY: ${debateTranscript}\nTASK: Compliance audit. ${PROTOCOL_HEADER}`, "You are the AUDITOR agent.", steps[1].modelId);
    debateTranscript += `AUDITOR:\n${auditorOut}\n\n`;
    steps[1].output = auditorOut; steps[1].status = 'COMPLETED'; updateUI();

    steps[2].status = 'THINKING';
    updateUI();
    const engineerOut = await callAgent(`HISTORY: ${debateTranscript}\nTASK: Define workflow logic. ${PROTOCOL_HEADER}`, "You are the ENGINEER agent.", steps[2].modelId);
    debateTranscript += `ENGINEER:\n${engineerOut}\n\n`;
    steps[2].output = engineerOut; steps[2].status = 'COMPLETED'; updateUI();

    // --- PHASE 4: EXECUTIVE MASTER SYNTHESIS ---
    steps[3].status = 'THINKING';
    updateUI();
    const execPrompt = `
      TRANSCRIPT: ${debateTranscript}
      TASK: Synthesize the DEFINITIVE INDIGO MASTER BLUEPRINT for ${lead.businessName}.
      
      OUTPUT FORMAT (STRICT):
      Return a single JSON object with two main top-level keys:
      1. "format": "ui_blocks" (The visual schematic for the user)
      2. "technical_blueprint": The Indigo Canonical GHL Object Model for automated execution.
      
      TECHNICAL BLUEPRINT SCHEMA:
      {
         "meta": { "plan_hash": "deterministic_string" },
         "custom_fields": [{ "name": "Field Name", "dataType": "TEXT|NUMBER", "key": "unique_ghl_key" }],
         "tags": ["tag_1", "tag_2"],
         "pipelines": [{ "name": "Name", "stages": ["Stage 1", "Stage 2"] }]
      }
      
      UI_BLOCKS SCHEMA:
      {
         "format": "ui_blocks",
         "title": "GHL MASTER ARCHITECTURE",
         "sections": [ ... ]
      }
    `;
    const finalBlueprint = await callAgent(execPrompt, "You are the EXECUTIVE authority. Emit raw JSON combining visual schematic and technical blueprint.", steps[3].modelId);
    
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
