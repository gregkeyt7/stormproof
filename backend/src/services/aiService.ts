import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import OpenAI from "openai";
import { env } from "../config";

type ForensicAiInput = {
  profileSummary: string;
  weaknesses: string[];
  targetGoal: string;
};

type LetterAiInput = {
  letterType: string;
  bureau: string;
  creditor: string;
  issueType: string;
  accountContext: string;
  evidenceSummary: string;
  objective: string;
};

class AiService {
  private readonly openAiClient: OpenAI | null;
  private readonly langChainModel: ChatOpenAI | null;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      this.openAiClient = null;
      this.langChainModel = null;
      return;
    }

    this.openAiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    this.langChainModel = new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      temperature: 0.2
    });
  }

  async generateForensicNarrative(input: ForensicAiInput): Promise<string> {
    if (!this.langChainModel) {
      return [
        "CreditTitan AI Forensic Summary",
        `Goal: ${input.targetGoal}`,
        `Profile snapshot: ${input.profileSummary}`,
        "Primary weaknesses:",
        ...input.weaknesses.map((item) => `- ${item}`),
        "Execution note: focus on rapid utilization suppression, dispute packet quality, and conservative inquiry behavior."
      ].join("\n");
    }

    const messages = [
      new SystemMessage(
        "You are an elite private financial intelligence assistant. Be factual, concise, lawful, and never invent evidence."
      ),
      new HumanMessage(
        `Generate a clear forensic credit analysis narrative with tactical priorities.
Goal: ${input.targetGoal}
Profile summary: ${input.profileSummary}
Weaknesses: ${input.weaknesses.join("; ")}

Return 3 sections:
1) What is suppressing score
2) High-impact actions in order
3) Lender perception and approval readiness`
      )
    ];

    const response = await this.langChainModel.invoke(messages);
    return response.text;
  }

  async generateDisputeLetter(input: LetterAiInput): Promise<{ subject: string; body: string }> {
    const fallbackSubject = `${input.letterType} Request - ${input.creditor}`;
    const fallbackBody = `To Whom It May Concern,

I am requesting a formal review of the following reporting item:

Bureau: ${input.bureau}
Creditor: ${input.creditor}
Issue: ${input.issueType}
Account context: ${input.accountContext}

Supporting facts:
${input.evidenceSummary}

Requested resolution:
${input.objective}

Please investigate this matter and provide written confirmation of your findings.

Sincerely,
[Your Name]
[Address]
[Date]`;

    if (!this.openAiClient) {
      return { subject: fallbackSubject, body: fallbackBody };
    }

    const completion = await this.openAiClient.responses.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content:
            "You draft professional dispute and credit correspondence. Remain factual, lawful, and do not fabricate evidence."
        },
        {
          role: "user",
          content: `Draft a ${input.letterType} letter.

Bureau: ${input.bureau}
Creditor: ${input.creditor}
Issue type: ${input.issueType}
Account context: ${input.accountContext}
Evidence summary: ${input.evidenceSummary}
Objective: ${input.objective}

Return this exact format:
SUBJECT: ...
BODY:
...`
        }
      ]
    });

    const text = completion.output_text?.trim();
    if (!text) {
      return { subject: fallbackSubject, body: fallbackBody };
    }

    const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
    return {
      subject: subjectMatch?.[1]?.trim() || fallbackSubject,
      body: bodyMatch?.[1]?.trim() || fallbackBody
    };
  }
}

export const aiService = new AiService();
