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

const GHL_FULL_SPEC = `
GOHIGHLEVEL OPERATIONAL SPECIFICATION:
1. AI EMPLOYEE SUITE: 
   - Voice AI (Browser-based receptionist/qualifier), Conversation AI (Natural chat on Web/SMS/WhatsApp), Reviews AI (Sentiment responding), Funnel AI, Content AI (Copy/Image synthesis), Workflow AI.
2. OMNICHANNEL OUTREACH: 
   - LC Email/Phone (Native), SMS/MMS, missed-call-text-back, power dialers, call dispositions as triggers.
3. CONVERSION INFRASTRUCTURE: 
   - Funnel/Site builder, Surveys/Forms (with custom field mapping), Round-robin calendars, Team distribution.
4. CRM & PIPELINE OPS: 
   - Contact record (System of Truth), Multi-stage pipelines (SLA-driven), Tasks/Notifications, Custom Objects.
5. AUTOMATION (WORKFLOWS): 
   - Logic branching, Webhooks (OAuth V2), Wait steps, Marketplace extensions.
6. REPUTATION & SOCIAL: 
   - GBP/LSA integration, guided review wizards, Social Planner (evergreen scheduling).
7. SCALE & MONETIZATION: 
   - SaaS Mode (White-label, rebilling), Snapshots (Portable infrastructure templates), Marketplace commercialization.
`;

async function callAgent(prompt: string, system: string, model: string): Promise<string> {
  const keys = getStoredKeys();
  const apiKey = keys.openRouter || process.env.API_KEY;

  if (!apiKey) throw new Error("OPENROUTER_KEY_MISSING");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); 

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pomelli.agency",
        "X-Title": "Prospector OS GHL Boardroom",
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
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
  - NEVER USE ALL-CAPS FOR PARAGRAPHS OR LIST ITEMS.
  - USE NORMAL SENTENCE CASE (Capitalize only the first letter).
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO HASHTAGS).
  - USE ALL-CAPS FOR MAIN HEADINGS ONLY (E.G. TECHNICAL SCHEMATIC:).
  - EXPAND DETAIL TO THE ABSOLUTE MAXIMUM. COVER EVERY MODULE: ${GHL_FULL_SPEC}
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect an EXHAUSTIVE GHL Technical Build for ${lead.businessName}. Include funnel mapping, AI stack usage, and workflow logic.\n${CLEAN_SIGNAL_PROTOCOL}`,
      "You are the Apex GHL Architect. You have an exhaustive knowledge of HighLevel. You speak in implementation-ready sentence case.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Find critical failure points in this GHL plan. Check for API limits, compliance (10DLC), and friction in the lead journey.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Senior Technical Auditor. You are brutal and technically precise. No markdown. Use sentence case.",
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
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Solve all Auditor concerns. Inject high-level logic like Snapshots, Custom Objects, and White-label monetization paths.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Strategic Refiner. You solve all gaps. No markdown. Use sentence case.",
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
      `TRANSCRIPT:\n${debateTranscript}\n\nTask: Synthesize the DEFINITIVE GHL MASTER BLUEPRINT.
      REQUIRED STRUCTURE: Output EXACT raw JSON with NO markdown formatting inside strings.
      IMPORTANT: Ensure all content and bullets use NORMAL SENTENCE CASE.
      { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "subtitle": "TECHNICAL IMPLEMENTATION GUIDE", "sections": [ { "heading": "CORE LOGIC", "body": [ { "type": "hero", "content": "Summary of vision" }, { "type": "p", "content": "Detailed para 1" }, { "type": "bullets", "content": ["Action 1", "Action 2"] } ] } ] }`,
      "You are the Executive Vice President of GHL Implementation. You deliver exhaustive, JSON-formatted, implementation-ready plans. No markdown. Sentence case only.",
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