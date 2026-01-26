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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s circuit breaker

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS Boardroom",
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 3800
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
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: Network saturation reached.");
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
    { agentName: 'ARCHITECT', role: 'GHL System Architecture', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Compliance Audit', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - NEVER USE ALL CAPS FOR BODY TEXT OR PARAGRAPHS.
  - USE NORMAL SENTENCE CASE (Capitalize only the first letter of sentences).
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO HASHTAGS).
  - ONLY USE ALL-CAPS FOR MAIN HEADINGS ENDING IN A COLON (E.G. TECHNICAL SCHEMATIC:).
  - PROVIDE 10X TECHNICAL DEPTH REGARDING GHL API V2, CUSTOM OBJECTS, AND A2P 10DLC.
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect a massive GHL Technical build for ${lead.businessName}.\n${CLEAN_SIGNAL_PROTOCOL}\n\nFOCUS: Automation Mesh, Custom Data Schemas, and AI Booking Bots.`,
      "You are the Apex GHL Architect. You speak in straight, technical, implementation-ready language. You strictly never use markdown or all-caps paragraphs.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Find critical failure points in this GHL plan. Focus on compliance and rate-limits.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Senior Technical Auditor. You are brutal and technically precise. No markdown. No all-caps paragraphs.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Refactor the entire architecture to solve the Auditor's findings. Inject advanced CRM logic.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Strategic Refiner. You solve all technical gaps. No markdown. No all-caps paragraphs.",
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
      IMPORTANT: Ensure all 'content' and 'bullets' use normal sentence case, NOT all-caps.
      { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "subtitle": "TECHNICAL IMPLEMENTATION GUIDE", "sections": [ { "heading": "CORE LOGIC", "body": [ { "type": "hero", "content": "Summary of vision" }, { "type": "p", "content": "Detailed para 1" }, { "type": "bullets", "content": ["Step 1", "Step 2"] } ] } ] }`,
      "You are the Executive Vice President. You turn technical warfare into clean business documents. No markdown. No all-caps paragraphs.",
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