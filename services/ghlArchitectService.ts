import { Lead } from "../types";
import { dossierStorage } from "./dossierStorage";
import { getStoredKeys, deductCost } from "./geminiService";

export interface BoardroomStep {
  agentName: string;
  role: string;
  modelLabel: string;
  modelId: string;
  status: 'WAITING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  output?: string;
  currentRound?: number;
}

const BUSINESS_KNOWLEDGE_BASE = `
STRATEGIC GROWTH KNOWLEDGE BASE v2.0:
- Goal: Maximize enterprise revenue and operational efficiency.
- Key Systems: AI Lead Response, Automated Reputation Management, Client Nurture, Calendar Optimization, Unified Communications.
- Business Logic: Eliminate "Lead Attrition," improve "Conversion Velocity," and reclaim 10+ hours of management time per week.
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
      "X-Title": "Prospector OS Strategy Lab",
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
  if (data.error) throw new Error(data.error.message || "Strategic Link Timeout");
  
  const text = data.choices[0].message.content;
  deductCost(model, (prompt.length + text.length));
  return text;
}

export const executeGrowthBoardroom = async (
  lead: Lead,
  rounds: number,
  onUpdate: (steps: BoardroomStep[]) => void
): Promise<string> => {
  const dossier = dossierStorage.getByLead(lead.id);
  if (!dossier) throw new Error("Strategic Framework Required. Run Business Architect First.");

  let debateHistory = "";

  const steps: BoardroomStep[] = [
    { agentName: 'BRAND STRATEGIST', role: 'Brand & Experience Lead', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'REVENUE ANALYST', role: 'Financial Optimization Expert', modelLabel: 'Llama 3.1 70B', modelId: 'meta-llama/llama-3.1-70b-instruct', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'SYSTEMS DIRECTOR', role: 'Operations Specialist', modelLabel: 'Mistral Large 2', modelId: 'mistralai/mistral-large', status: 'WAITING', currentRound: 1, output: "" },
    { agentName: 'EXECUTIVE SUMMARY', role: 'Managing Director', modelLabel: 'Gemini 3.0 Flash', modelId: 'google/gemini-3-flash-preview', status: 'WAITING', currentRound: 1, output: "" }
  ];

  const updateUI = () => onUpdate([...steps]);
  updateUI();

  const PROFESSIONAL_PROTOCOL = `
    STRICT BUSINESS STRATEGY PROTOCOL:
    - NO MILITARY SLANG (No "Attack", "Strike", "Mission", "Recon", "Target", "Cortex", "Uplink", "Payload").
    - USE BUSINESS TERMS (Analysis, Strategy, Prospect, Client, Engagement, Implementation).
    - ABSOLUTELY NO MARKDOWN (No stars **, no hashtags #, no underscores _).
    - NO decorative characters or giant capital letters at start of sentences.
    - STRUCTURE WITH PLAIN TEXT HEADINGS.
    - USE STRAIGHT, PROFESSIONAL PARAGRAPHS.
    - SPEAK AS A SENIOR MANAGEMENT CONSULTANT.
    - KB: ${BUSINESS_KNOWLEDGE_BASE}
  `;

  try {
    for (let r = 1; r <= rounds; r++) {
      // 1. Brand Strategist
      steps[0].currentRound = r; steps[0].status = 'ANALYZING'; updateUI();
      const visionOut = await callAgent(`ANALYSIS ROUND ${r}/${rounds}: Brand positioning for ${lead.businessName}. ${PROFESSIONAL_PROTOCOL}`, "You are a Brand Strategist.", steps[0].modelId);
      steps[0].output += `\n\nANALYSIS ROUND ${r}:\n${visionOut}`;
      debateHistory += `\nBRAND STRATEGIST (R${r}): ${visionOut}`;
      steps[0].status = 'COMPLETED'; updateUI();

      // 2. Revenue Analyst
      steps[1].currentRound = r; steps[1].status = 'ANALYZING'; updateUI();
      const profitOut = await callAgent(`ANALYSIS ROUND ${r}/${rounds}: Revenue strategy for ${lead.businessName}. ${PROFESSIONAL_PROTOCOL}`, "You are a Revenue Analyst.", steps[1].modelId);
      steps[1].output += `\n\nANALYSIS ROUND ${r}:\n${profitOut}`;
      debateHistory += `\nREVENUE ANALYST (R${r}): ${profitOut}`;
      steps[1].status = 'COMPLETED'; updateUI();

      // 3. Systems Director
      steps[2].currentRound = r; steps[2].status = 'ANALYZING'; updateUI();
      const opsOut = await callAgent(`ANALYSIS ROUND ${r}/${rounds}: Operations plan for ${lead.businessName}. ${PROFESSIONAL_PROTOCOL}`, "You are a Systems Director.", steps[2].modelId);
      steps[2].output += `\n\nANALYSIS ROUND ${r}:\n${opsOut}`;
      debateHistory += `\nSYSTEMS DIRECTOR (R${r}): ${opsOut}`;
      steps[2].status = 'COMPLETED'; updateUI();
      
      if (r < rounds) {
         steps[0].status = 'WAITING'; steps[1].status = 'WAITING'; steps[2].status = 'WAITING';
         updateUI();
      }
    }

    // 4. Final Executive Summary
    steps[3].status = 'ANALYZING'; updateUI();
    const finalPrompt = `
      HISTORY: ${debateHistory}
      TASK: Synthesize this into the DEFINITIVE BUSINESS TRANSFORMATION PLAN for ${lead.businessName}.
      
      REQUIREMENTS:
      - PROVIDE EXHAUSTIVE DETAIL (Min 4 paragraphs per section).
      - NO MILITARY TERMINOLOGY.
      - NO DECORATIVE FIRST LETTERS.
      - NO MARKDOWN.
      - USE "heading" BLOCKS FOR TITLES.
      - USE "p" FOR CLEAN PARAGRAPHS.
      - OUTPUT STRICTLY VALID JSON IN UI_BLOCKS FORMAT.
      
      JSON SCHEMA:
      {
        "format": "ui_blocks",
        "title": "BUSINESS TRANSFORMATION PLAN",
        "subtitle": "PREMIUM GROWTH STRATEGY",
        "sections": [
          { "heading": "STRATEGIC AUDIT", "body": [ { "type": "p", "content": "Professional analysis..." } ] },
          { "heading": "REVENUE GROWTH PROTOCOL", "body": [ { "type": "hero", "content": "Master Vision" }, { "type": "p", "content": "Growth detail..." } ] },
          { "heading": "OPERATIONAL EXCELLENCE", "body": [ { "type": "p", "content": "Efficiency detail..." } ] },
          { "heading": "EXPECTED OUTCOMES", "body": [ { "type": "bullets", "content": ["Outcome 1", "Outcome 2"] } ] }
        ]
      }
    `;
    const finalOut = await callAgent(finalPrompt, "You are the Managing Director.", steps[3].modelId);
    
    JSON.parse(finalOut);
    steps[3].output = "Transformation plan complete.";
    steps[3].status = 'COMPLETED';
    updateUI();
    return finalOut;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'ANALYZING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};
