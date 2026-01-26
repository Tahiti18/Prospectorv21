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
      temperature: 0.8,
      max_tokens: 3800
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
    { agentName: 'ARCHITECT', role: 'GHL System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Compliance Audit', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - DO NOT USE MARKDOWN. NO ASTERISKS, NO HASHTAGS, NO BOLDING SYMBOLS.
  - USE PLAIN TEXT ONLY.
  - USE ALL-CAPS HEADINGS FOLLOWED BY A COLON (E.G. TECHNICAL SCHEMATIC:).
  - USE SIMPLE DASHES (-) FOR LIST ITEMS.
  - 10X TECHNICAL DEPTH: REFER TO GHL API V2, CUSTOM OBJECTS, WEBHOOKS, AND 10DLC COMPLIANCE.
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect a massive GHL Technical build for ${lead.businessName}.\n${CLEAN_SIGNAL_PROTOCOL}\n\nREQUIRED FOCUS:\n1. WORKFLOW AUTOMATION MESH: Map 7 complex triggers.\n2. CUSTOM DATA SCHEMA: List 20 specific Custom Fields.\n3. CONVERSATION AI: Write a 1000-word GHL AI System Instruction set.\n4. API INTEGRATION: Define Zapier/Webhook payloads for external ROI reporting.`,
      "You are the Apex GHL Architect. You speak in technical specifications. You strictly never use markdown.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Find 10 critical failure points in this GHL plan. Look for A2P 10DLC compliance risks, Snapshot collision issues, and API rate-limit bottlenecks.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Senior Technical Auditor. You are brutal and technically precise. No markdown.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Refactor the entire architecture to solve the Auditor's findings. Inject advanced appointment-booking psychology into the workflow SMS steps.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Strategic Refiner. You solve all technical gaps. No markdown.",
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
      REQUIRED STRUCTURE: Output EXACT raw JSON with NO markdown formatting inside strings.
      { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "subtitle": "TECHNICAL IMPLEMENTATION GUIDE", "sections": [ { "heading": "CORE LOGIC", "body": [ { "type": "hero", "content": "..." }, { "type": "p", "content": "..." }, { "type": "bullets", "content": ["..."] } ] } ] }`,
      "You are the Executive Vice President. You turn technical warfare into clean business documents. No markdown.",
      steps[3].modelId
    );

    steps[3].status = 'COMPLETED';
    steps[3].output = finalPlan;
    updateUI();

    return finalPlan;

  } catch (error: any) {
    // Ensure no step remains spinning if an error occurs
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};