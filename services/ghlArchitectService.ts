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

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://pomelli.agency",
      "X-Title": "Prospector OS Boardroom",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.9
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Agent Link Fault");
  
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
  if (!dossier) throw new Error("Strategy Manifest required. Please run Campaign Builder first.");

  const context = JSON.stringify(dossier.data);
  let debateTranscript = "";
  
  const steps: BoardroomStep[] = [
    { agentName: 'ARCHITECT', role: 'System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Red-Team', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Polish', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Executive Client Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  onUpdate([...steps]);

  const CLEAN_SIGNAL_DIRECTIVE = `
  STRICT FORMATTING PROTOCOL:
  - DO NOT USE MARKDOWN. NO ASTERISKS (**), NO HASHTAGS (###), NO UNDERSCORES (_).
  - USE PLAIN TEXT ONLY.
  - USE ALL CAPS FOR HEADINGS (E.G. WORKFLOW GEOMETRY:).
  - USE SIMPLE DASHES (-) FOR LIST ITEMS.
  - BE EXTREMELY VERBOSE. PROVIDE DEEP TECHNICAL DETAIL.
  `;

  // --- PHASE 1: INITIAL ARCHITECTURE ---
  steps[0].status = 'THINKING';
  onUpdate([...steps]);
  
  const initialDraft = await callAgent(
    `DATA CONTEXT: ${context}\n\nTask: Draft a massive GHL technical implementation plan for ${lead.businessName}.\n${CLEAN_SIGNAL_DIRECTIVE}\n\nREQUIRED SECTIONS:\n1. WORKFLOW ARCHITECTURE: List specific triggers and wait-condition branching.\n2. CUSTOM DATA SCHEMA: Define exact custom field names and value keys.\n3. CONVERSATION AI FORGE: Provide a massive system prompt for the GHL AI assistant.\n4. PIPELINE STAGING: Define 7 stages for high-ticket acquisition.\n5. ROI MATHEMATICS: Explain the conversion logic.`,
    "You are the Apex GHL Solutions Architect. You speak in implementation-ready technical terms. You strictly never use markdown symbols.",
    steps[0].modelId
  );
  
  debateTranscript += `[ARCHITECT DRAFT]:\n${initialDraft}\n\n`;
  steps[0].status = 'COMPLETED';
  steps[0].output = initialDraft;
  onUpdate([...steps]);

  // --- PHASE 2: THE RECURSIVE ADVERSARIAL LOOP ---
  for (let r = 1; r <= rounds; r++) {
    // 2a. AUDITOR'S TURN
    steps[1].status = 'THINKING';
    steps[1].currentRound = r;
    onUpdate([...steps]);

    const auditOutput = await callAgent(
      `DEBATE HISTORY:\n${debateTranscript}\n\nTask: Round ${r} of ${rounds}. Tearing down this GHL plan. Look for trigger loops, API bottlenecks, Twilio compliance failures, and AI hallucination risks.\n${CLEAN_SIGNAL_DIRECTIVE}`,
      "You are a Senior Technical Auditor. You find the flaws in every plan. You strictly never use markdown.",
      steps[1].modelId
    );

    debateTranscript += `[AUDIT ROUND ${r}]:\n${auditOutput}\n\n`;
    steps[1].status = 'COMPLETED';
    steps[1].output = auditOutput;
    onUpdate([...steps]);

    // 2b. REFINER'S TURN
    steps[2].status = 'THINKING';
    steps[2].currentRound = r;
    onUpdate([...steps]);

    const refinerOutput = await callAgent(
      `DEBATE HISTORY:\n${debateTranscript}\n\nTask: Rebuild the architecture based on the Auditor's critique. Inject advanced appointment-booking psychology and fail-safe automation logic.\n${CLEAN_SIGNAL_DIRECTIVE}`,
      "You are the Strategic Refiner. You harden technical plans into ROI engines. You strictly never use markdown.",
      steps[2].modelId
    );

    debateTranscript += `[REFINEMENT ROUND ${r}]:\n${refinerOutput}\n\n`;
    steps[2].status = 'COMPLETED';
    steps[2].output = refinerOutput;
    onUpdate([...steps]);
    
    await new Promise(res => setTimeout(res, 500));
  }

  // --- PHASE 3: EXECUTIVE SYNTHESIS ---
  steps[3].status = 'THINKING';
  onUpdate([...steps]);

  const finalPlan = await callAgent(
    `FULL DEBATE TRANSCRIPT:\n${debateTranscript}\n\nTask: You are the final executive judge. Synthesize the debate into a MASTER BLUEPRINT. 
    You must output a highly professional business plan.
    DO NOT USE ANY MARKDOWN SYMBOLS.
    Output EXACT raw JSON with no markdown inside strings.
    { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "sections": [ { "heading": "NAME", "body": [ { "type": "hero", "content": "..." }, { "type": "bullets", "content": ["..."] }, { "type": "p", "content": "..." } ] } ] }`,
    "You are the Executive Vice President of Strategy. You turn technical debate into world-class business plans. You strictly never use markdown symbols like ** or ##.",
    steps[3].modelId
  );

  steps[3].status = 'COMPLETED';
  steps[3].output = finalPlan;
  onUpdate([...steps]);

  return finalPlan;
};