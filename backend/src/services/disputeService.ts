import { LetterType } from "@prisma/client";
import { z } from "zod";
import { aiService } from "./aiService";

const disputeInputSchema = z.object({
  bureau: z.string().min(2).max(64),
  creditor: z.string().min(2).max(120),
  accountType: z.string().min(2).max(120),
  issueType: z.string().min(2).max(120),
  consumerName: z.string().min(2).max(120),
  accountIdentifier: z.string().min(2).max(80),
  facts: z.string().min(5).max(2000),
  requestedOutcome: z.string().min(5).max(300),
  supportingEvidence: z.array(z.string().min(2).max(200)).default([]),
});

const letterTypeToTone: Record<LetterType, string> = {
  BUREAU_DISPUTE: "formal and concise bureau dispute tone",
  CREDITOR_DISPUTE: "professional direct creditor challenge tone",
  DEBT_VALIDATION: "strict debt validation request tone",
  GOODWILL: "respectful goodwill adjustment tone",
  CFPB_DRAFT: "factual regulatory complaint draft tone",
  METHOD_OF_VERIFICATION: "method of verification request tone",
  CEASE_COMMUNICATION: "legal cease communication tone",
  SETTLEMENT_NEGOTIATION: "structured settlement negotiation tone",
  INQUIRY_REMOVAL: "inquiry removal request tone",
};

type DisputeInput = z.infer<typeof disputeInputSchema>;

function letterTypeHeading(letterType: LetterType): string {
  switch (letterType) {
    case "BUREAU_DISPUTE":
      return "Credit Bureau Dispute";
    case "CREDITOR_DISPUTE":
      return "Creditor Dispute";
    case "DEBT_VALIDATION":
      return "Debt Validation Request";
    case "GOODWILL":
      return "Goodwill Adjustment Request";
    case "CFPB_DRAFT":
      return "CFPB Complaint Draft";
    case "METHOD_OF_VERIFICATION":
      return "Method of Verification Request";
    case "CEASE_COMMUNICATION":
      return "Cease Communication Notice";
    case "SETTLEMENT_NEGOTIATION":
      return "Settlement Negotiation Proposal";
    case "INQUIRY_REMOVAL":
      return "Hard Inquiry Removal Request";
    default:
      return "Dispute Letter";
  }
}

function staticLetter(letterType: LetterType, input: DisputeInput): { subject: string; body: string } {
  const subject = `${letterTypeHeading(letterType)} — ${input.creditor} (${input.accountIdentifier})`;
  const evidenceLines = input.supportingEvidence.length
    ? input.supportingEvidence.map((e, index) => `${index + 1}. ${e}`).join("\n")
    : "1. Supporting records are attached for verification.";

  const body = [
    `Date: ${new Date().toLocaleDateString("en-US")}`,
    "",
    `To: ${input.bureau} / ${input.creditor}`,
    "",
    `Re: ${letterTypeHeading(letterType)} — Account ${input.accountIdentifier}`,
    "",
    `Dear ${input.bureau} / ${input.creditor},`,
    "",
    `My name is ${input.consumerName}. I am requesting review of the above account due to the following issue: ${input.issueType}.`,
    "",
    "Factual summary:",
    input.facts,
    "",
    "Requested resolution:",
    input.requestedOutcome,
    "",
    "Supporting evidence provided:",
    evidenceLines,
    "",
    "Please investigate and provide written confirmation of your findings. If records cannot substantiate reporting accuracy, I request correction or removal as applicable.",
    "",
    "This correspondence is sent for factual review and does not include any false or fabricated claims.",
    "",
    "Sincerely,",
    input.consumerName,
  ].join("\n");

  return { subject, body };
}

export const disputeService = {
  validateInput(payload: unknown): DisputeInput {
    return disputeInputSchema.parse(payload);
  },

  async generateLetter(letterType: LetterType, payload: unknown): Promise<{ subject: string; body: string }> {
    const input = this.validateInput(payload);
    const fallback = staticLetter(letterType, input);
    const tone = letterTypeToTone[letterType];

    const prompt = [
      "Generate a factual consumer credit letter.",
      `Letter type: ${letterTypeHeading(letterType)}.`,
      `Tone: ${tone}.`,
      "Rules:",
      "- Never invent evidence.",
      "- No fraudulent claims.",
      "- Keep language professional and specific.",
      "",
      `Consumer: ${input.consumerName}`,
      `Bureau: ${input.bureau}`,
      `Creditor: ${input.creditor}`,
      `Account type: ${input.accountType}`,
      `Issue type: ${input.issueType}`,
      `Account identifier: ${input.accountIdentifier}`,
      `Facts: ${input.facts}`,
      `Requested outcome: ${input.requestedOutcome}`,
      `Evidence list: ${input.supportingEvidence.join("; ") || "None provided"}`,
      "",
      "Return a polished dispute letter body only.",
    ].join("\n");

    const aiDraft = await aiService.generateText(prompt, fallback.body);
    return {
      subject: fallback.subject,
      body: aiDraft,
    };
  },
};
