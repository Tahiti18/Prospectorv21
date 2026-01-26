
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
      temperature: 0.85
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
    { agentName: 'ARCHITECT', role: 'Technical Blueprint Design', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Technical Red-Team / Risk', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'ROI & Strategy Hardening', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Executive Client Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  onUpdate([...steps]);

  // --- PHASE 1: INITIAL MASTER ARCHITECTURE ---
  steps[0].status = 'THINKING';
  onUpdate([...steps]);
  
  const initialDraft = await callAgent(
    `FOUNDATION DATA: ${context}\n\nTask: Draft an EXHAUSTIVE GHL Master Blueprint for ${lead.businessName}. 
    YOU MUST PROVIDE 10X DETAIL ON:
    1. WORKFLOW ARCHITECTURE: Define the exact 'Trigger -> Wait -> Action' paths for 3 primary automations (Speed-to-lead, Long-term Nurture, and Database Reactivation).
    2. SNAPSHOT SCHEMA: List 10 required Custom Fields and 5 Custom Values (e.g. {{company.ai_bot_name}}).
    3. PIPELINE GEOMETRY: Define 7 Stages for a High-Ticket sale.
    4. CONVERSATION AI: Write a 500-word System Instruction for the GHL Bot settings.
    5. SMART LISTS: Define the specific filter logic for "Hot Intent" daily follow-up.`,
    "You are the Apex GHL Solutions Architect. Your output is used to build complex GHL sub-accounts. Be technical, verbose, and precise. No generic advice.",
    steps[0].modelId
  );
  
  debateTranscript += `[ARCHITECT INITIAL DRAFT]:\n${initialDraft}\n\n`;
  steps[0].status = 'COMPLETED';
  steps[0].output = initialDraft;
  onUpdate([...steps]);

  // --- PHASE 2: THE RECURSIVE ADVERSARIAL LOOP ---
  for (let r = 1; r <= rounds; r++) {
    // 2a. AUDITOR TEARS IT DOWN
    steps[1].status = 'THINKING';
    steps[1].currentRound = r;
    onUpdate([...steps]);

    const auditOutput = await callAgent(
      `CURRENT MASTER PLAN & DEBATE HISTORY:\n${debateTranscript}\n\nTask: This is ROUND ${r} of ${rounds}. Tearing down this GHL plan.
      Look for:
      - Automation triggers that will loop and ban the client from Twilio.
      - Gaps in the "Lead Re-engagement" logic.
      - Hallucination risks in the AI Prompts provided.
      - ROI flaws. Why won't this convert the $5k+ services?
      Be extremely blunt and technical.`,
      "You are a Senior GHL Risk Auditor. You hate weak plans. Your goal is to find why this system will break or fail to produce ROI.",
      steps[1].modelId
    );

    debateTranscript += `[ROUND ${r} AUDIT - LLAMA]:\n${auditOutput}\n\n`;
    steps[1].status = 'COMPLETED';
    steps[1].output = auditOutput;
    onUpdate([...steps]);

    // 2b. REFINER BUILDS IT BACK STRONGER
    steps[2].status = 'THINKING';
    steps[2].currentRound = r;
    onUpdate([...steps]);

    const refinerOutput = await callAgent(
      `CURRENT DEBATE TRANSCRIPT (READ CAREFULLY):\n${debateTranscript}\n\nTask: Rebuild and Refine the GHL Architecture based on the Auditor's critique.
      - Fix the Twilio/SMS risks mentioned.
      - Improve the AI Persona for higher conversions.
      - Update the Workflow logic to be 'fail-safe'.
      - Inject deeper conversion psychology into the GHL nurture sequences.
      Ensure this plan is now 100% executable and bulletproof.`,
      "You are the Strategic Growth Refiner. You take raw technical plans and turn them into aggressive, ROI-positive conversion machines. You fix what the Auditor breaks.",
      steps[2].modelId
    );

    debateTranscript += `[ROUND ${r} REFINEMENT - MISTRAL]:\n${refinerOutput}\n\n`;
    steps[2].status = 'COMPLETED';
    steps[2].output = refinerOutput;
    onUpdate([...steps]);
    
    await new Promise(res => setTimeout(res, 500));
  }

  // --- PHASE 3: THE EXECUTIVE POLISH (CLIENT READY) ---
  steps[3].status = 'THINKING';
  onUpdate([...steps]);

  const finalPlan = await callAgent(
    `FULL ADVERSARIAL DEBATE TRANSCRIPT:\n${debateTranscript}\n\n
    Task: Synthesize the absolute FINAL GHL MASTER BLUEPRINT for ${lead.businessName}.
    
    CRITICAL INSTRUCTION:
    - THIS IS FOR A HIGH-TICKET CLIENT. 
    - DO NOT OUTPUT RAW CODE BLOCKS OR JSON.
    - OUTPUT A VERBOSE, BEAUTIFULLY STRUCTURED BUSINESS PLAN using UI_BLOCKS format.
    - EVERY SECTION MUST BE RICH IN GHL SPECIFIC DETAIL (Pipelines, Workflows, Bot Settings).
    - Summarize the ROI impact based on the adversarial refinements.
    
    Structure:
    { "format": "ui_blocks", "title": "GHL MASTER IMPLEMENTATION BLUEPRINT", "sections": [ { "heading": "EXECUTIVE STRATEGY", "body": [{ "type": "hero", "content": "..." }] } ] }`,
    "You are the Executive Vice President of Strategy. Your job is to take technical debate and turn it into a high-fidelity, comprehensive business document that justifies a $10k+ monthly retainer.",
    steps[3].modelId
  );

  steps[3].status = 'COMPLETED';
  steps[3].output = finalPlan;
  onUpdate([...steps]);

  return finalPlan;
};
