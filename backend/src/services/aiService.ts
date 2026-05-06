import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { env } from "../config";

type ForensicSummaryInput = {
  weaknessSummary: string[];
  suppressionBreakdown: Array<{ category: string; estimatedPointsSuppressed: number }>;
  fastestImpactActions: Array<{ title: string; expectedImpact: number; timelineDays: number }>;
  lenderPerception: { narrative: string; profileTier: string };
  approvalRiskScore: number;
  primaryGoal?: string;
};

class AiService {
  private readonly openaiClient: OpenAI | null;
  private readonly lcModel: ChatOpenAI | null;

  constructor() {
    if (!env.openAiApiKey) {
      this.openaiClient = null;
      this.lcModel = null;
      return;
    }

    this.openaiClient = new OpenAI({ apiKey: env.openAiApiKey });
    this.lcModel = new ChatOpenAI({
      apiKey: env.openAiApiKey,
      model: env.openAiModel,
      temperature: 0.2,
    });
  }

  async generateText(prompt: string, fallback: string): Promise<string> {
    if (!this.openaiClient) {
      return fallback;
    }

    try {
      const response = await this.openaiClient.responses.create({
        model: env.openAiModel,
        input: [
          {
            role: "system",
            content:
              "You are a private financial intelligence assistant. Be factual, lawful, and never fabricate claims or evidence.",
          },
          { role: "user", content: prompt },
        ],
      });

      return response.output_text?.trim() || fallback;
    } catch {
      return fallback;
    }
  }

  async summarizeForensics(input: ForensicSummaryInput): Promise<string> {
    const fallback = [
      "Credit forensic narrative:",
      `Risk score: ${input.approvalRiskScore}/100`,
      `Tier: ${input.lenderPerception.profileTier}`,
      "Primary suppressors:",
      ...input.suppressionBreakdown
        .sort((a, b) => b.estimatedPointsSuppressed - a.estimatedPointsSuppressed)
        .slice(0, 4)
        .map((item) => `- ${item.category}: ~${item.estimatedPointsSuppressed} points`),
      "Fastest actions:",
      ...input.fastestImpactActions
        .slice(0, 4)
        .map((item) => `- ${item.title} (${item.timelineDays}d, impact ${item.expectedImpact})`),
      `Lender lens: ${input.lenderPerception.narrative}`,
    ].join("\n");

    if (!this.lcModel) {
      return fallback;
    }

    try {
      const message = await this.lcModel.invoke([
        new SystemMessage(
          "You are an elite underwriter + forensic analyst. Give concise, tactical, lawful guidance only."
        ),
        new HumanMessage(
          `Generate a 3-section summary:
1) Score suppression diagnosis
2) Highest-impact action sequence
3) Lender perception and approval readiness

Goal: ${input.primaryGoal ?? "Profile optimization"}
Risk: ${input.approvalRiskScore}
Weaknesses: ${input.weaknessSummary.join("; ")}
Suppressors: ${JSON.stringify(input.suppressionBreakdown)}
Actions: ${JSON.stringify(input.fastestImpactActions)}
Lender lens: ${JSON.stringify(input.lenderPerception)}`
        ),
      ]);

      return message.text || fallback;
    } catch {
      return fallback;
    }
  }
}

export const aiService = new AiService();

export async function summarizeForensicsWithAI(input: ForensicSummaryInput): Promise<string> {
  return aiService.summarizeForensics(input);
}
