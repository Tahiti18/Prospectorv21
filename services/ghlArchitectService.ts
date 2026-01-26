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
- Goal: Bottom-line revenue and operational freedom.
- Tools: Smart follow-ups, unified inbox, reputation management, automated booking, VIP nurture sequences.
- Outcomes: Zero missed leads, 2x conversion lift, 40+ hours saved per month, elite brand authority.
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
    { agentName: 'THE VISIONARY', role: 'Brand & Experience Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'PROFIT HACKER', role: 'Revenue Optimization Expert', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'OPS MASTER', role: 'Efficiency Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'MD SYNTHESIS', role: 'Managing Director', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const LAYMAN_PROTOCOL = `
    LAYMAN STRATEGY PROTOCOL:
    - NO CODE REFERENCES.
    - NO API TALK.
    - FOCUS ON BUSINESS VALUE, CUSTOMER JOURNEY, AND REVENUE.
    - USE ACCESSIBLE, POWERFUL ENGLISH.
    - KB: ${LAYMAN_KNOWLEDGE_BASE}
  `;

  try {
    for (let r = 1; r <= rounds; r++) {
      // 1. Visionary
      steps[0].currentRound = r; steps[0].status = 'THINKING'; updateUI();
      const visionPrompt = `ROUND ${r}: Review ${lead.businessName} context: ${context}. ${debateHistory ? `Previous debate: ${debateHistory}` : ''}. Propose the high-level brand transformation vision. ${LAYMAN_PROTOCOL}`;
      const visionOut = await callAgent(visionPrompt, "You are THE VISIONARY. Focus on authority and client experience.", steps[0].modelId);
      debateHistory += `\nVISIONARY (R${r}): ${visionOut}`;
      steps[0].output = visionOut; steps[0].status = 'COMPLETED'; updateUI();

      // 2. Profit Hacker
      steps[1].currentRound = r; steps[1].status = 'THINKING'; updateUI();
      const profitPrompt = `ROUND ${r}: Based on Vision: ${visionOut}. How do we maximize pure revenue and ROI? ${LAYMAN_PROTOCOL}`;
      const profitOut = await callAgent(profitPrompt, "You are THE PROFIT HACKER. Focus on conversion and money.", steps[1].modelId);
      debateHistory += `\nPROFIT HACKER (R${r}): ${profitOut}`;
      steps[1].output = profitOut; steps[1].status = 'COMPLETED'; updateUI();

      // 3. Ops Master
      steps[2].currentRound = r; steps[2].status = 'THINKING'; updateUI();
      const opsPrompt = `ROUND ${r}: Vision: ${visionOut}, Profit: ${profitOut}. How do we automate this to save 40+ hours/month? ${LAYMAN_PROTOCOL}`;
      const opsOut = await callAgent(opsPrompt, "You are THE OPS MASTER. Focus on time and efficiency.", steps[2].modelId);
      debateHistory += `\nOPS MASTER (R${r}): ${opsOut}`;
      steps[2].output = opsOut; steps[2].status = 'COMPLETED'; updateUI();
      
      if (r < rounds) {
         steps.forEach(s => { if (s.agentName !== 'MD SYNTHESIS') s.status = 'WAITING'; });
         updateUI();
      }
    }

    // 4. Final Synthesis
    steps[3].status = 'THINKING'; updateUI();
    const finalPrompt = `
      DEBATE HISTORY: ${debateHistory}
      TASK: Synthesize the DEFINITIVE BUSINESS TRANSFORMATION PLAN for ${lead.businessName} in UI_BLOCKS format.
      
      CRITICAL: Focus on:
      - The Problem (Business Deficiencies)
      - The Solution (Business Enhancements via GHL)
      - The Outcomes (Time Saved, Revenue Lift, Scale)
      
      Structure: { "format": "ui_blocks", "title": "BUSINESS GROWTH PLAN", "sections": [...] }
    `;
    const finalOut = await callAgent(finalPrompt, "You are the Managing Director. Provide the final executive plan.", steps[3].modelId);
    steps[3].output = "Plan synthesized successfully.";
    steps[3].status = 'COMPLETED';
    updateUI();

    return finalOut;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};