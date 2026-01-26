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
GHL COMPREHENSIVE KNOWLEDGE BASE:
1. AI EMPLOYEE SUITE:
   - Voice AI: Phone receptionists, browser-based voice widgets, lead qualification, booking.
   - Conversation AI: Context-aware chatbots for Web, SMS, FB, IG, and WhatsApp.
   - Reviews AI: Reputation management, automated review responses, sentiment tracking.
   - Content AI: Multi-channel copy generation, image synthesis, Social Planner integration.
2. OMNICHANNEL DELIVERY:
   - LC Phone/SMS: Native telephony, power dialers, missed-call-text-back.
   - LC Email/Mailgun: High-volume deliverability, domain warming, automated newsletters.
   - Social Planner: Content AI-assisted scheduling for FB, IG, LI, X, TikTok, GBP.
3. CONVERSION INFRASTRUCTURE:
   - Funnels & Sites: AI-assisted builders, membership portals, client portals.
   - Calendars: Round-robin distribution, payment-gated bookings, team scheduling.
   - Forms & Surveys: Conditional logic intake, custom field mapping.
4. CRM & PIPELINE OPS:
   - System of Record: Custom objects, smart lists, conversation unified inbox.
   - Workflow Builder: Advanced branching logic, wait steps, inbound webhooks, API V2 (OAuth).
   - Opportunity Tracking: Multi-stage pipelines, task management, automation triggers.
5. SCALE & MONETIZATION:
   - SaaS Mode: Pro-plan rebilling, white-labeling, custom dashboards.
   - Snapshots: Portable sub-account templates (Workflows, Funnels, Fields).
   - Payments: Stripe integration, recurring subscriptions, automated invoicing.
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
        "X-Title": "Prospector OS GHL Planner",
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
    if (e.name === 'AbortError') throw new Error("AGENT_TIMED_OUT: GHL architectural complexity peaked.");
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
    { agentName: 'ARCHITECT', role: 'GHL Master Builder', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 },
    { agentName: 'AUDITOR', role: 'Compliance & Scalability', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1 },
    { agentName: 'REFINER', role: 'Strategic Optimizer', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1 },
    { agentName: 'EXECUTIVE', role: 'Master Synthesis', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1 }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const CLEAN_SIGNAL_PROTOCOL = `
  STRICT OUTPUT PROTOCOL:
  - DO NOT USE ALL-CAPS FOR PARAGRAPHS OR BULLET POINTS.
  - USE NORMAL SENTENCE CASE FOR ALL BODY TEXT.
  - DO NOT USE MARKDOWN (NO ASTERISKS, NO HASHTAGS).
  - USE ALL-CAPS FOR MAIN HEADINGS ONLY (E.G. TECHNICAL SCHEMATIC:).
  - EXPAND DETAIL TO THE ABSOLUTE MAXIMUM. BE EXHAUSTIVE.
  - COVER EVERY GHL FEATURE: ${GHL_FULL_SPEC}
  `;

  try {
    // --- PHASE 1: INITIAL ARCHITECT ---
    steps[0].status = 'THINKING';
    updateUI();
    
    const initialDraft = await callAgent(
      `CONTEXT: ${context}\n\nTask: Architect an exhaustive, 10x depth GHL Technical Build for ${lead.businessName}.\n${CLEAN_SIGNAL_PROTOCOL}\n\nFOCUS: Integration of Voice AI widgets, Snapshots for repeatability, and Advanced Pipeline logic.`,
      "You are the Apex GHL Architect. You have an exhaustive knowledge of every GHL sub-module. You provide deep technical implementation guides without markdown.",
      steps[0].modelId
    );
    
    debateTranscript += `ARCHITECT DRAFT:\n${initialDraft}\n\n`;
    steps[0].output = initialDraft;
    steps[0].status = 'COMPLETED';
    updateUI();

    // --- PHASE 2: ADVERSARIAL LOOPS ---
    for (let r = 1; r <= rounds; r++) {
      steps[1].status = 'THINKING';
      steps[1].currentRound = r;
      updateUI();
      try {
        const auditOutput = await callAgent(
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Find every technical flaw, rate-limit bottleneck, and compliance risk (A2P 10DLC, GDPR). Force more technical specificity.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Senior Technical Auditor. You find hidden failures in GHL setups. No markdown. Use sentence case.",
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

      steps[2].status = 'THINKING';
      steps[2].currentRound = r;
      updateUI();
      try {
        const refinerOutput = await callAgent(
          `HISTORY:\n${debateTranscript}\n\nTask: Round ${r}/${rounds}. Refactor the entire architecture based on Audit findings. Maximize ROI through automated SaaS Mode rebilling and AI Conversation efficiency.\n${CLEAN_SIGNAL_PROTOCOL}`,
          "You are the Strategic Refiner. You optimize GHL builds for maximum agency profitability. No markdown. Use sentence case.",
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
      COVER EVERY CAPABILITY: Voice AI, Reputation AI, Funnels, Workflows, LC Email/Phone, Snapshots, and SaaS Mode.
      REQUIRED STRUCTURE: Output EXACT raw JSON with NO markdown inside strings.
      IMPORTANT: All 'content' and 'bullets' MUST be in normal sentence case.
      { "format": "ui_blocks", "title": "GHL MASTER ARCHITECTURE", "subtitle": "EXHAUSTIVE IMPLEMENTATION GUIDE", "sections": [ { "heading": "SYSTEM INFRASTRUCTURE", "body": [ { "type": "hero", "content": "Summary" }, { "type": "p", "content": "Detailed para" }, { "type": "bullets", "content": ["Action 1", "Action 2"] } ] } ] }`,
      "You are the Executive VP of Global Strategy. You deliver massive, exhaustive, implementation-ready GHL blueprints in JSON format.",
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