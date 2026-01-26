import { Lead, IndigoTechnicalBlueprint } from "../types";
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

const INDIGO_KNOWLEDGE_BASE = `
INDIGO GHL MASTER KB v1.0:
- Data Layer: Contacts, Custom Fields, Tags, Pipelines.
- Logic Layer: Workflows (native only).
- Action Set: send_sms, send_email, move_pipeline_stage, update_field.
- Constraints: Custom field keys must be lowercase_with_underscores and unique.
`;

const LAYMAN_KNOWLEDGE_BASE = `
GHL STRATEGIC IMPACT KB v1.0:
- Goal: Maximize Bottom-line revenue and Operational freedom.
- Key Systems: AI Speed-to-lead, Automated Reputation, VIP Nurture, Calendar Consolidation, Unified Communications.
- Business Logic: Eliminate "Lead Leakage," double the "Conversion Velocity," and reclaim 10+ hours of manual labor per week.
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
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      temperature: 0.8,
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
  if (!dossier) throw new Error("Strategic Manifest Required.");

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

  const PROTOCOL = `STRICT INDIGO PROTOCOL: NO MARKDOWN. KB: ${INDIGO_KNOWLEDGE_BASE}`;

  try {
    // Stage 1: Planner
    steps[0].status = 'THINKING'; updateUI();
    const plannerOut = await callAgent(`CONTEXT: ${context}\nTASK: Architect sub-account for ${lead.businessName}. ${PROTOCOL}`, "You are the PLANNER agent.", steps[0].modelId);
    debateTranscript += `PLANNER:\n${plannerOut}\n\n`;
    steps[0].output = plannerOut; steps[0].status = 'COMPLETED'; updateUI();

    // Stage 2: Auditor
    steps[1].status = 'THINKING'; updateUI();
    const auditorOut = await callAgent(`HISTORY: ${debateTranscript}\nTASK: Compliance/Risk audit. ${PROTOCOL}`, "You are the AUDITOR agent.", steps[1].modelId);
    debateTranscript += `AUDITOR:\n${auditorOut}\n\n`;
    steps[1].output = auditorOut; steps[1].status = 'COMPLETED'; updateUI();

    // Stage 3: Engineer
    steps[2].status = 'THINKING'; updateUI();
    const engineerOut = await callAgent(`HISTORY: ${debateTranscript}\nTASK: Atomic workflow logic. ${PROTOCOL}`, "You are the ENGINEER agent.", steps[2].modelId);
    debateTranscript += `ENGINEER:\n${engineerOut}\n\n`;
    steps[2].output = engineerOut; steps[2].status = 'COMPLETED'; updateUI();

    // Stage 4: Executive Synthesis (STRICT JSON OUTPUT)
    steps[3].status = 'THINKING'; updateUI();
    const execPrompt = `
      TRANSCRIPT: ${debateTranscript}
      TASK: Synthesize the DEFINITIVE INDIGO MASTER BLUEPRINT for ${lead.businessName}.
      
      CRITICAL: You must output a single valid JSON object with the following structure. Do not include any text outside this JSON.
      
      {
        "ui_blocks": {
          "format": "ui_blocks",
          "title": "GHL MASTER ARCHITECTURE",
          "subtitle": "INDIGO BLUEPRINT v1.0",
          "sections": [ ... ]
        },
        "technical_blueprint": {
          "schema_version": "1.0",
          "meta": { "plan_hash": "deterministic_sha256_mock", "target_business": "${lead.businessName}" },
          "data_model": {
            "custom_fields": [ { "name": "", "dataType": "TEXT", "key": "lowercase_key" } ],
            "tags": [ "string" ]
          },
          "pipelines": [ { "name": "", "stages": ["string"] } ],
          "workflows_manifest": [],
          "qa_requirements": []
        }
      }
    `;
    const finalResult = await callAgent(execPrompt, "You are the EXECUTIVE authority. Output ONLY valid JSON matching the requested schema.", steps[3].modelId);
    
    // Verify JSON before returning
    try {
      JSON.parse(finalResult);
      steps[3].status = 'COMPLETED';
      steps[3].output = "Synthesis complete. Blueprint generated.";
    } catch (e) {
      steps[3].status = 'FAILED';
      throw new Error("EXECUTIVE_SYNTHESIS_MALFORMED_JSON");
    }

    updateUI();
    return finalResult;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};

export const executeGrowthBoardroom = async (
  lead: Lead,
  rounds: number,
  onUpdate: (steps: BoardroomStep[]) => void
): Promise<string> => {
  const dossier = dossierStorage.getByLead(lead.id);
  if (!dossier) throw new Error("Strategic Manifest Required. Run Campaign Forge First.");

  const context = JSON.stringify(dossier.data);
  let debateHistory = "";

  const steps: BoardroomStep[] = [
    { agentName: 'THE VISIONARY', role: 'Brand & Experience Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'PROFIT HACKER', role: 'Revenue Optimization Expert', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'OPS MASTER', role: 'Efficiency Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'MD SYNTHESIS', role: 'Managing Director', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const LAYMAN_PROTOCOL = `
    LAYMAN STRATEGY PROTOCOL:
    - NO CODE REFERENCES (No "API", "JSON", "Webhook", "Custom Fields").
    - FOCUS ON BUSINESS VALUE, CUSTOMER JOURNEY, AND REVENUE.
    - USE POWERFUL, PLAIN ENGLISH.
    - KB: ${LAYMAN_KNOWLEDGE_BASE}
  `;

  try {
    for (let r = 1; r <= rounds; r++) {
      // 1. Visionary
      steps[0].currentRound = r; steps[0].status = 'THINKING'; updateUI();
      const visionPrompt = `ROUND ${r}/${rounds}: Establish the high-level brand transformation vision for ${lead.businessName}. CONTEXT: ${context}. HISTORY: ${debateHistory || 'Start of debate'}. ${LAYMAN_PROTOCOL}`;
      const visionOut = await callAgent(visionPrompt, "You are THE VISIONARY. You architect premium market authority and client experience.", steps[0].modelId);
      steps[0].output += `\n\n--- ROUND ${r} ---\n${visionOut}`;
      debateHistory += `\nVISIONARY (R${r}): ${visionOut}`;
      steps[0].status = 'COMPLETED'; updateUI();

      // 2. Profit Hacker
      steps[1].currentRound = r; steps[1].status = 'THINKING'; updateUI();
      const profitPrompt = `ROUND ${r}/${rounds}: Based on the Vision provided, how do we extract maximum revenue for ${lead.businessName}? Focus on conversion velocity and ROI. ${LAYMAN_PROTOCOL}`;
      const profitOut = await callAgent(profitPrompt, "You are THE PROFIT HACKER. You care about one thing: making the client more money and plugging lead leaks.", steps[1].modelId);
      steps[1].output += `\n\n--- ROUND ${r} ---\n${profitOut}`;
      debateHistory += `\nPROFIT HACKER (R${r}): ${profitOut}`;
      steps[1].status = 'COMPLETED'; updateUI();

      // 3. Ops Master
      steps[2].currentRound = r; steps[2].status = 'THINKING'; updateUI();
      const opsPrompt = `ROUND ${r}/${rounds}: Review the Vision and Profit strategies. How do we automate these systems so ${lead.businessName} saves 40+ hours per month? ${LAYMAN_PROTOCOL}`;
      const opsOut = await callAgent(opsPrompt, "You are THE OPS MASTER. You architect efficiency, scaling systems, and operational sanity.", steps[2].modelId);
      steps[2].output += `\n\n--- ROUND ${r} ---\n${opsOut}`;
      debateHistory += `\nOPS MASTER (R${r}): ${opsOut}`;
      steps[2].status = 'COMPLETED'; updateUI();
      
      if (r < rounds) {
         steps[0].status = 'WAITING';
         steps[1].status = 'WAITING';
         steps[2].status = 'WAITING';
         updateUI();
      }
    }

    // 4. Final Synthesis
    steps[3].status = 'THINKING'; updateUI();
    const finalPrompt = `
      DEBATE HISTORY: ${debateHistory}
      
      TASK: As the Managing Director, synthesize this intense debate into the DEFINITIVE BUSINESS GROWTH PLAN for ${lead.businessName}.
      
      CRITICAL: You must output a valid JSON object in UI_BLOCKS format. 
      Use "heading" blocks for the EMERALD green titles.
      Use "hero" blocks for the Vision statement.
      Use "bullets" for tactical steps.
      Use "p" for straight normal paragraphs.
      
      FORMAT:
      {
        "format": "ui_blocks",
        "title": "BUSINESS TRANSFORMATION PLAN",
        "subtitle": "PREMIUM GROWTH ARCHITECTURE",
        "sections": [
          {
            "heading": "I. THE DIGITAL GAP",
            "body": [ { "type": "p", "content": "Analyze current deficiencies..." } ]
          },
          {
            "heading": "II. REVENUE ENGINE ACTIVATION",
            "body": [ { "type": "hero", "content": "The Profit Vision..." }, { "type": "bullets", "content": ["Tactic 1", "Tactic 2"] } ]
          },
          {
            "heading": "III. OPERATIONAL FREEDOM",
            "body": [ { "type": "p", "content": "Automation impact..." } ]
          },
          {
            "heading": "IV. PROJECTED OUTCOMES",
            "body": [ { "type": "p", "content": "Revenue and time saved stats..." } ]
          }
        ]
      }
    `;
    const finalOut = await callAgent(finalPrompt, "You are the Managing Director. Provide a massive, comprehensive, client-ready growth plan in valid UI_BLOCKS JSON.", steps[3].modelId);
    
    // Validate JSON
    try {
      JSON.parse(finalOut);
      steps[3].output = "Growth Strategy Finalized. Deploying Schematic.";
      steps[3].status = 'COMPLETED';
    } catch (e) {
      steps[3].status = 'FAILED';
      throw new Error("MD_SYNTHESIS_JSON_FAILURE");
    }

    updateUI();
    return finalOut;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};
