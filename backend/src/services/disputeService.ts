import { z } from "zod";
import { aiService } from "./aiService";

const disputeLetterSchema = z.object({
  bureau: z.string().min(2).max(80),
  issueType: z.string().min(2).max(80),
  creditorName: z.string().min(2).max(120),
  accountType: z.string().min(2).max(80),
  accountReference: z.string().optional(),
  userGoal: z.string().min(5).max(300),
  facts: z.array(z.string().min(3)).min(1),
  evidence: z.array(z.string().min(2)).default([]),
  request: z.string().min(4).max(400),
});

export type GenerateDisputeLetterInput = z.infer<typeof disputeLetterSchema>;

function titleForIssue(issueType: string): string {
  return issueType
    .toLowerCase()
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function escalationTimeline(issueType: string): string[] {
  const base = [
    "Day 0: Submit dispute with supporting packet.",
    "Day 7: Confirm receipt and tracking identifiers.",
    "Day 21: Follow up for investigation status update.",
    "Day 31+: Review response and escalate if unresolved.",
  ];
  if (issueType === "METHOD_OF_VERIFICATION") {
    return [...base, "Escalation: Request documented method of verification and data furnisher proof."];
  }
  if (issueType === "DEBT_VALIDATION") {
    return [...base, "Escalation: Request full debt validation package before payment engagement."];
  }
  return base;
}

function buildFallbackBody(input: GenerateDisputeLetterInput): string {
  const facts = input.facts.map((fact) => `- ${fact}`).join("\n");
  const evidence = input.evidence.length
    ? input.evidence.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "1. Supporting records are attached for factual verification.";
  return [
    `Date: ${new Date().toLocaleDateString("en-US")}`,
    "",
    `To: ${input.bureau} / ${input.creditorName}`,
    "",
    `Re: ${titleForIssue(input.issueType)} - ${input.accountReference ?? "Account under review"}`,
    "",
    "To Whom It May Concern,",
    "",
    "I am requesting a factual investigation of this account reporting.",
    "",
    "Issue summary:",
    facts,
    "",
    "Supporting evidence list:",
    evidence,
    "",
    "Requested outcome:",
    input.request,
    "",
    `Primary goal: ${input.userGoal}`,
    "",
    "Please provide written findings and correct or remove any inaccurate reporting.",
    "",
    "Sincerely,",
    "[Consumer Name]",
  ].join("\n");
}

export async function generateDisputeLetter(input: GenerateDisputeLetterInput): Promise<{
  subject: string;
  body: string;
  complianceNotes: string[];
  escalationTimeline: string[];
}> {
  const parsed = disputeLetterSchema.parse(input);
  const subject = `${titleForIssue(parsed.issueType)} Request - ${parsed.creditorName}`;
  const fallbackBody = buildFallbackBody(parsed);
  const prompt = [
    "Draft a professional dispute letter.",
    "Constraints: factual tone, no invented evidence, no fraudulent claims, keep it concise and specific.",
    `Bureau: ${parsed.bureau}`,
    `Creditor: ${parsed.creditorName}`,
    `Account type: ${parsed.accountType}`,
    `Issue type: ${parsed.issueType}`,
    `Account reference: ${parsed.accountReference ?? "N/A"}`,
    `Facts: ${parsed.facts.join("; ")}`,
    `Evidence: ${parsed.evidence.join("; ") || "None listed"}`,
    `Requested outcome: ${parsed.request}`,
    `User goal: ${parsed.userGoal}`,
    "Return only the letter body.",
  ].join("\n");

  const body = await aiService.generateText(prompt, fallbackBody);
  return {
    subject,
    body,
    complianceNotes: [
      "User must review and verify all facts before submission.",
      "Do not submit any claim that cannot be documented.",
      "Keep a timestamped copy of all correspondence.",
    ],
    escalationTimeline: escalationTimeline(parsed.issueType),
  };
}
