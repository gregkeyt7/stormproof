import type { CreditProfile } from "@prisma/client";

export type ForensicInput = {
  creditScore: number;
  utilization: number;
  latePayments: number;
  collections: number;
  hardInquiries: number;
  oldestAccountYears: number;
  debtToIncome: number;
  revolvingDebt: number;
  installmentDebt: number;
  monthlyIncome: number;
};

export type ForensicOutput = {
  weaknessSummary: string[];
  suppressionBreakdown: Array<{
    category: string;
    estimatedPointsSuppressed: number;
    severity: "low" | "medium" | "high";
    recommendation: string;
  }>;
  fastestImpactActions: Array<{
    title: string;
    expectedImpact: number;
    timelineDays: number;
    rationale: string;
  }>;
  approvalRiskScore: number;
  lenderPerception: {
    profileTier: "high-risk" | "near-prime" | "prime-candidate";
    narrative: string;
  };
  utilizationOptimizationMap: {
    currentUtilization: number;
    targetUtilization: number;
    targetBalance: number;
    payoffNeeded: number;
  };
};

const severityFromPoints = (points: number): "low" | "medium" | "high" => {
  if (points >= 65) return "high";
  if (points >= 30) return "medium";
  return "low";
};

export const buildForensicAnalysis = (input: ForensicInput): ForensicOutput => {
  const utilizationPenalty = input.utilization > 9 ? Math.round((input.utilization - 9) * 1.15) : 0;
  const latePenalty = input.latePayments * 17;
  const collectionPenalty = input.collections * 26;
  const inquiryPenalty = input.hardInquiries * 6;
  const agePenalty = input.oldestAccountYears < 2 ? 20 : input.oldestAccountYears < 5 ? 10 : 3;
  const dtiPenalty = input.debtToIncome > 43 ? Math.round((input.debtToIncome - 43) * 1.3) : 0;

  const suppressionBreakdown = [
    {
      category: "Utilization pressure",
      estimatedPointsSuppressed: utilizationPenalty,
      severity: severityFromPoints(utilizationPenalty),
      recommendation: "Lower revolving utilization before statement close dates to below 10%."
    },
    {
      category: "Delinquency history",
      estimatedPointsSuppressed: latePenalty,
      severity: severityFromPoints(latePenalty),
      recommendation: "Set all tradelines to autopay and issue goodwill requests for older late marks."
    },
    {
      category: "Derogatory/collections",
      estimatedPointsSuppressed: collectionPenalty,
      severity: severityFromPoints(collectionPenalty),
      recommendation: "Validate each derogatory account, dispute inaccuracies, and negotiate outcomes in writing."
    },
    {
      category: "Inquiry density",
      estimatedPointsSuppressed: inquiryPenalty,
      severity: severityFromPoints(inquiryPenalty),
      recommendation: "Freeze new applications for 60-90 days to let inquiry pressure decay."
    },
    {
      category: "Age + debt ratio drag",
      estimatedPointsSuppressed: agePenalty + dtiPenalty,
      severity: severityFromPoints(agePenalty + dtiPenalty),
      recommendation: "Preserve older accounts and reduce debt-to-income via payoff sequencing."
    }
  ];

  const weaknesses: string[] = [];
  if (input.utilization > 30) weaknesses.push(`Utilization is elevated at ${input.utilization}% (target 1-9%).`);
  if (input.latePayments > 0) weaknesses.push(`${input.latePayments} late payments are suppressing payment-history confidence.`);
  if (input.collections > 0) weaknesses.push(`${input.collections} derogatory accounts are increasing approval risk.`);
  if (input.hardInquiries > 3) weaknesses.push(`${input.hardInquiries} recent hard inquiries suggest aggressive credit-seeking.`);
  if (input.debtToIncome > 43) weaknesses.push(`Debt-to-income at ${input.debtToIncome}% exceeds many lender comfort thresholds.`);
  if (input.oldestAccountYears < 2) weaknesses.push("Thin or young file depth is weakening stability signals.");

  if (weaknesses.length === 0) {
    weaknesses.push("No severe suppression factors detected; focus on consistency and utilization discipline.");
  }

  const totalSuppression = suppressionBreakdown.reduce((sum, row) => sum + row.estimatedPointsSuppressed, 0);

  const fastestImpactActions = [
    {
      title: "Revolving utilization compression sprint",
      expectedImpact: Math.min(Math.max(utilizationPenalty, 10), 90),
      timelineDays: 21,
      rationale: "High utilization is one of the fastest-moving score components once balances report lower."
    },
    {
      title: "Dispute and verification package assembly",
      expectedImpact: Math.min(Math.max(collectionPenalty + Math.round(latePenalty * 0.35), 8), 95),
      timelineDays: 45,
      rationale: "Correcting inaccurate negative data can significantly improve approval optics."
    },
    {
      title: "Inquiry and application cooldown",
      expectedImpact: Math.min(Math.max(inquiryPenalty, 5), 36),
      timelineDays: 60,
      rationale: "Reducing credit-seeking velocity increases perceived underwriting stability."
    },
    {
      title: "Debt-to-income optimization sequence",
      expectedImpact: Math.min(Math.max(dtiPenalty, 6), 40),
      timelineDays: 75,
      rationale: "Lowering obligations relative to income improves manual underwriting outcomes."
    }
  ].sort((a, b) => b.expectedImpact - a.expectedImpact);

  const approvalRiskScore = Math.max(1, Math.min(100, Math.round(
    (100 - input.creditScore / 8.5) +
    utilizationPenalty * 0.3 +
    latePenalty * 0.3 +
    collectionPenalty * 0.35 +
    inquiryPenalty * 0.2 +
    dtiPenalty * 0.2
  )));

  let profileTier: ForensicOutput["lenderPerception"]["profileTier"] = "near-prime";
  if (approvalRiskScore > 70) profileTier = "high-risk";
  if (approvalRiskScore < 38) profileTier = "prime-candidate";

  const lenderNarrative = profileTier === "high-risk"
    ? "Lenders likely see elevated repayment volatility. Repair sequencing is critical before major applications."
    : profileTier === "near-prime"
      ? "Profile has mixed signals. Optimizing utilization and removing errors can unlock materially better terms."
      : "Profile appears stable. Focus on strategic approvals and preserving clean reporting behavior.";

  const targetUtilization = 9;
  const totalRevolvingLimit = input.revolvingDebt > 0 && input.utilization > 0
    ? Math.round(input.revolvingDebt / (input.utilization / 100))
    : 0;
  const targetBalance = totalRevolvingLimit > 0 ? Math.round(totalRevolvingLimit * (targetUtilization / 100)) : 0;
  const payoffNeeded = Math.max(0, input.revolvingDebt - targetBalance);

  return {
    weaknessSummary: weaknesses,
    suppressionBreakdown,
    fastestImpactActions,
    approvalRiskScore,
    lenderPerception: {
      profileTier,
      narrative: lenderNarrative
    },
    utilizationOptimizationMap: {
      currentUtilization: input.utilization,
      targetUtilization,
      targetBalance,
      payoffNeeded
    }
  };
};

export const toForensicInputFromProfile = (profile: CreditProfile): ForensicInput => {
  const raw = (profile.rawInput ?? {}) as Record<string, unknown>;
  return {
    creditScore: profile.creditScore,
    utilization: profile.utilization,
    latePayments: profile.latePayments,
    collections: profile.collections,
    hardInquiries: profile.hardInquiries,
    oldestAccountYears: profile.oldestAccountYears,
    debtToIncome: profile.debtToIncome,
    revolvingDebt: Number(raw.revolvingDebt ?? 0),
    installmentDebt: Number(raw.installmentDebt ?? 0),
    monthlyIncome: Number(raw.monthlyIncome ?? 0)
  };
};
