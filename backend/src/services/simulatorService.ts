type SimulationInput = {
  currentScore: number;
  utilization: number;
  latePayments: number;
  collections: number;
  inquiries: number;
  newAccounts: number;
  balanceTransfer: number;
  creditLimitIncrease: number;
  payoffAmount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function simulateCreditScenario(input: SimulationInput) {
  const utilizationDropByPayoff = input.payoffAmount > 0 ? Math.min(45, input.payoffAmount / 2000) : 0;
  const utilizationDropByTransfer = input.balanceTransfer * 0.35;
  const utilizationDropByCli = input.creditLimitIncrease / 5000;
  const utilizationAfter = clamp(
    input.utilization - utilizationDropByPayoff - utilizationDropByTransfer - utilizationDropByCli,
    0,
    100
  );

  const utilizationLift = clamp((input.utilization - utilizationAfter) * 1.25, 0, 80);
  const derogatoryPenalty = input.latePayments * 6 + input.collections * 10;
  const inquiryPenalty = input.inquiries * 2.4 + input.newAccounts * 6;
  const netDelta = Math.round(utilizationLift - inquiryPenalty - derogatoryPenalty * 0.18);

  const projectedScore = clamp(input.currentScore + netDelta, 300, 850);
  const approvalOddsBefore = clamp(
    input.currentScore < 580 ? 20 : input.currentScore < 670 ? 48 : input.currentScore < 740 ? 70 : 88,
    5,
    98
  );
  const approvalOddsAfter = clamp(
    projectedScore < 580 ? 22 : projectedScore < 670 ? 54 : projectedScore < 740 ? 78 : 93,
    8,
    99
  );

  const lenderPerceptionShift =
    projectedScore > input.currentScore
      ? "Underwriting profile improves with stronger utilization optics and lower immediate risk signals."
      : "Underwriting profile remains fragile; prioritize profile cleanup before additional applications.";

  return {
    projectedScore,
    scoreDelta: projectedScore - input.currentScore,
    utilizationAfter: Number(utilizationAfter.toFixed(1)),
    approvalOddsBefore,
    approvalOddsAfter,
    lenderPerceptionShift,
    keyAssumptions: [
      "No new derogatories occur during simulation horizon.",
      "All score impacts are directional estimates and may vary by lender model.",
      "Statement-cycle timing affects when score changes appear."
    ]
  };
}

export { simulateCreditScenario as runCreditSimulation };
