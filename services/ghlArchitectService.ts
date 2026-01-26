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
  return ""; 
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
    STRICT LAYMAN STRATEGY PROTOCOL:
    - ABSOLUTELY NO MARKDOWN (No stars **, no hashtags #, no underscores _, no dashes ---).
    - DO NOT use decorative characters or giant capital letters at start of sentences.
    - STRUCTURE WITH CLEAR PLAIN-TEXT HEADINGS (All caps).
    - USE STRAIGHT, CLEAN, PROFESSIONAL PARAGRAPHS.
    - SPEAK AS A LUXURY BUSINESS CONSULTANT.
    - KB: ${LAYMAN_KNOWLEDGE_BASE}
  `;

  try {
    for (let r = 1; r <= rounds; r++) {
      // 1. Visionary
      steps[0].currentRound = r; steps[0].status = 'THINKING'; updateUI();
      const visionOut = await callAgent(`ROUND ${r}/${rounds}: Vision for ${lead.businessName}. HISTORY: ${debateHistory || 'None'}. ${LAYMAN_PROTOCOL}`, "You are THE VISIONARY. Output clean paragraphs.", steps[0].modelId);
      steps[0].output += `\n\nROUND ${r}:\n${visionOut}`;
      debateHistory += `\nVISIONARY (R${r}): ${visionOut}`;
      steps[0].status = 'COMPLETED'; updateUI();

      // 2. Profit Hacker
      steps[1].currentRound = r; steps[1].status = 'THINKING'; updateUI();
      const profitOut = await callAgent(`ROUND ${r}/${rounds}: ROI strategy for ${lead.businessName}. ${LAYMAN_PROTOCOL}`, "You are THE PROFIT HACKER. Output clean paragraphs.", steps[1].modelId);
      steps[1].output += `\n\nROUND ${r}:\n${profitOut}`;
      debateHistory += `\nPROFIT HACKER (R${r}): ${profitOut}`;
      steps[1].status = 'COMPLETED'; updateUI();

      // 3. Ops Master
      steps[2].currentRound = r; steps[2].status = 'THINKING'; updateUI();
      const opsOut = await callAgent(`ROUND ${r}/${rounds}: Automation plan for ${lead.businessName}. ${LAYMAN_PROTOCOL}`, "You are THE OPS MASTER. Output clean paragraphs.", steps[2].modelId);
      steps[2].output += `\n\nROUND ${r}:\n${opsOut}`;
      debateHistory += `\nOPS MASTER (R${r}): ${opsOut}`;
      steps[2].status = 'COMPLETED'; updateUI();
      
      if (r < rounds) {
         steps[0].status = 'WAITING'; steps[1].status = 'WAITING'; steps[2].status = 'WAITING';
         updateUI();
      }
    }

    // 4. Final Synthesis
    steps[3].status = 'THINKING'; updateUI();
    const finalPrompt = `
      DEBATE HISTORY: ${debateHistory}
      TASK: As the Managing Director, synthesize this debate into the DEFINITIVE BUSINESS TRANSFORMATION PLAN for ${lead.businessName}.
      
      CRITICAL REQUIREMENTS:
      - PROVIDE EXHAUSTIVE DETAIL. This must be a massive, comprehensive plan.
      - EACH SECTION MUST HAVE AT LEAST 4 FULL PARAGRAPHS.
      - NO MARKDOWN SYMBOLS.
      - NO DECORATIVE FIRST LETTERS.
      - USE "heading" BLOCKS FOR TITLES.
      - USE "p" FOR CLEAN, STRAIGHT PARAGRAPHS.
      - OUTPUT STRICTLY VALID JSON IN UI_BLOCKS FORMAT.
      
      JSON SCHEMA:
      {
        "format": "ui_blocks",
        "title": "DEFINITIVE TRANSFORMATION PLAN",
        "subtitle": "PREMIUM GROWTH ARCHITECTURE",
        "sections": [
          { "heading": "I. STRATEGIC AUDIT", "body": [ { "type": "p", "content": "Detailed paragraphs..." } ] },
          { "heading": "II. REVENUE ACCELERATION", "body": [ { "type": "hero", "content": "Master Vision Statement" }, { "type": "p", "content": "Detailed paragraphs..." } ] },
          { "heading": "III. OPERATIONAL FREEDOM", "body": [ { "type": "p", "content": "Detailed paragraphs..." } ] },
          { "heading": "IV. PROJECTED OUTCOMES", "body": [ { "type": "bullets", "content": ["Outcome 1", "Outcome 2"] } ] }
        ]
      }
    `;
    const finalOut = await callAgent(finalPrompt, "You are the Managing Director. Provide a massive, clean, client-ready growth plan in valid UI_BLOCKS JSON.", steps[3].modelId);
    
    try {
      JSON.parse(finalOut);
      steps[3].output = "Synthesis complete.";
      steps[3].status = 'COMPLETED';
    } catch (e) {
      steps[3].status = 'FAILED';
      throw new Error("MD_SYNTHESIS_MALFORMED_JSON");
    }

    updateUI();
    return finalOut;

  } catch (error: any) {
    steps.forEach(s => { if (s.status === 'THINKING') s.status = 'FAILED'; });
    updateUI();
    throw error;
  }
};
