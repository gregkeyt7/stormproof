type BusinessInput = {
  businessAgeMonths: number;
  monthlyRevenue: number;
  vendorTradelines: number;
  hasEin: boolean;
  hasDuns: boolean;
  hasBusinessBankAccount: boolean;
  entityType: string;
};

type BusinessPlanStep = {
  step: string;
  detail: string;
  timeline: string;
  priority: "critical" | "high" | "medium";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildBusinessCreditPlan(input: BusinessInput) {
  const foundationScore = clamp(
    (input.hasEin ? 18 : 0) +
      (input.hasDuns ? 16 : 0) +
      (input.hasBusinessBankAccount ? 16 : 0) +
      (input.entityType === "llc" || input.entityType === "sCorp" || input.entityType === "cCorp" ? 12 : 6),
    0,
    62,
  );

  const maturityScore = clamp(
    (input.businessAgeMonths >= 24 ? 18 : input.businessAgeMonths >= 12 ? 12 : input.businessAgeMonths >= 6 ? 8 : 4) +
      (input.monthlyRevenue >= 20000 ? 12 : input.monthlyRevenue >= 10000 ? 8 : input.monthlyRevenue >= 5000 ? 5 : 2) +
      clamp(input.vendorTradelines * 2, 0, 12),
    0,
    38,
  );

  const readinessScore = clamp(Math.round(foundationScore + maturityScore), 0, 100);

  const steps: BusinessPlanStep[] = [];
  if (!input.hasEin || !input.hasDuns || !input.hasBusinessBankAccount) {
    steps.push({
      step: "Complete fundability prerequisites",
      detail: "Finalize EIN, D-U-N-S, and dedicated business banking before credit applications.",
      timeline: "Week 1",
      priority: "critical",
    });
  }

  steps.push({
    step: "Align business identity everywhere",
    detail: "Use identical legal name, address, phone, and website across secretary records, IRS, and vendor files.",
    timeline: "Week 1-2",
    priority: "high",
  });

  steps.push({
    step: "Build 5-8 reporting vendor tradelines",
    detail: `Increase active reporting tradelines from ${input.vendorTradelines} to at least 5 to improve profile depth and PAYDEX visibility.`,
    timeline: "Week 2-8",
    priority: "high",
  });

  steps.push({
    step: "Strategic revolving sequencing",
    detail: "After 60-90 days of positive trade reporting, apply to no more than two lenders per cycle.",
    timeline: "Month 2-4",
    priority: "high",
  });

  steps.push({
    step: "Lender narrative and document packet",
    detail: "Prepare bank statements, P&L, tax docs, and use-of-funds narrative to reduce perceived underwriting risk.",
    timeline: "Month 2+",
    priority: "medium",
  });

  const lenderRiskSignals = [
    input.monthlyRevenue < 5000 ? "Low and volatile revenue compared with requested leverage." : "Revenue trend supports moderate underwriting confidence.",
    input.vendorTradelines < 3 ? "Thin tradeline file weakens PAYDEX predictability." : "Tradeline depth improves payment behavior confidence.",
    input.businessAgeMonths < 12 ? "Young entity age may cap approvals and limits." : "Business age supports stronger funding tiers.",
  ];

  const vendorSuggestions = [
    "Office and operational vendors reporting net terms monthly",
    "Fuel and fleet cards once PAYDEX history is established",
    "Industry-specific suppliers with net-30/45 options and bureau reporting",
  ];

  return {
    readinessScore,
    lenderRiskSignals,
    vendorSuggestions,
    steps,
  };
}
