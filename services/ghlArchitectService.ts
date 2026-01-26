
import { Type } from "@google/genai";
import { Lead } from "../types";
import { dossierStorage } from "./dossierStorage";
import { pushLog, getStoredKeys, deductCost } from "./geminiService";

export interface BoardroomStep {
  agentName: string;
  role: string;
  modelLabel: string;
  modelId: string;
  status: 'WAITING' | 'THINKING' | 'COMPLETED' | 'FAILED';
  output?: string;
  currentRound?: number;
}

// OpenRouter Call Helper
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
      temperature: 0.7
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
    { agentName: 'ARCHITECT', role: 'Technical Design', modelLabel: 'Gemini 2.0 Flash', modelId: 'google/gemini-2.0-flash-001', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Logical Critique', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Polish', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Final Synthesis', modelLabel: 'ChatGPT (4o-mini)', modelId: 'openai/gpt-4o-mini', status: 'WAITING', currentRound: 1 }
  ];

  onUpdate([...steps]);

  // --- PHASE 1: INITIAL ARCHITECTURE ---
  steps[0].status = 'THINKING';
  onUpdate([...steps]);
  pushLog(`BOARDROOM: Architect Node (Gemini) drafting initial GHL framework for ${lead.businessName}...`);
  
  const initialDraft = await callAgent(
    `FOUNDATION DATA: ${context}\n\nTask: Draft a technical GHL implementation plan including specific Workflow triggers, SmartList logic, and AI Bot prompts.`,
    "You are the GHL Solution Architect. Output technical, specific GHL instructions.",
    steps[0].modelId
  );
  
  debateTranscript += `[ARCHITECT INITIAL DRAFT]:\n${initialDraft}\n\n`;
  steps[0].status = 'COMPLETED';
  steps[0].output = initialDraft;
  onUpdate([...steps]);

  // --- PHASE 2: ADVERSARIAL DEBATE LOOP ---
  for (let r = 1; r <= rounds; r++) {
    // 2a. AUDITOR'S TURN
    steps[1].status = 'THINKING';
    steps[1].currentRound = r;
    onUpdate([...steps]);
    pushLog(`BOARDROOM: Round ${r}/${rounds} - Auditor Node (Llama) analyzing risks...`);

    const auditOutput = await callAgent(
      `CURRENT DEBATE TRANSCRIPT:\n${debateTranscript}\n\nTask: Find 3 flaws in the current plan and identify 2 missed revenue recovery opportunities. If this is round ${r} of ${rounds}, be increasingly critical.`,
      "You are a rigorous GHL Auditor. Be blunt. Find logical gaps and technical impossibilities.",
      steps[1].modelId
    );

    debateTranscript += `[ROUND ${r} AUDIT - LLAMA]:\n${auditOutput}\n\n`;
    steps[1].status = 'COMPLETED';
    steps[1].output = auditOutput;
    onUpdate([...steps]);

    // 2b. REFINER'S TURN
    steps[2].status = 'THINKING';
    steps[2].currentRound = r;
    onUpdate([...steps]);
    pushLog(`BOARDROOM: Round ${r}/${rounds} - Refiner Node (Mistral) updating strategy...`);

    const refinerOutput = await callAgent(
      `CURRENT DEBATE TRANSCRIPT:\n${debateTranscript}\n\nTask: Refine the architecture based on the latest audit. Fix the flaws mentioned and improve the ROI projections.`,
      "You are a Senior Agency Strategist. Refine technical plans for maximum client ROI and conversion speed.",
      steps[2].modelId
    );

    debateTranscript += `[ROUND ${r} REFINEMENT - MISTRAL]:\n${refinerOutput}\n\n`;
    steps[2].status = 'COMPLETED';
    steps[2].output = refinerOutput;
    onUpdate([...steps]);
    
    // Brief delay to prevent rate limit and show visual step
    await new Promise(res => setTimeout(res, 500));
  }

  // --- PHASE 3: EXECUTIVE SYNTHESIS ---
  steps[3].status = 'THINKING';
  onUpdate([...steps]);
  pushLog(`BOARDROOM: Executive Node (ChatGPT) distilling ${rounds} rounds of debate into final blueprint...`);

  const finalPlan = await callAgent(
    `FULL DEBATE TRANSCRIPT:\n${debateTranscript}\n\nTask: You have seen ${rounds} rounds of debate. Synthesize the absolute best technical GHL Master Blueprint into the UI_BLOCKS JSON format. No markdown, just raw JSON.`,
    `You are the Executive Synthesizer. Output EXACT JSON using format: { "format": "ui_blocks", "title": "GHL MASTER BLUEPRINT", "sections": [ { "heading": "NAME", "body": [ { "type": "p", "content": "..." } ] } ] }`,
    steps[3].modelId
  );

  steps[3].status = 'COMPLETED';
  steps[3].output = finalPlan;
  onUpdate([...steps]);
  pushLog("BOARDROOM: Consensus reached. Finalized GHL Blueprint produced.");

  return finalPlan;
};
