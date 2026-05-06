import { z } from "zod";

const simulatorInputSchema = z.object({
  currentScore: z.number().min(300).max(850),
  utilization: z.number().min(0).max(100),
  totalDebt: z.number().min(0),
  inquiryCount: z.number().min(0).max(20),
  plannedPaydown: z.number().min(0),
  newAccounts: z.number().min(0).max(6),
  balanceTransfer: z.boolean(),
  requestedCliPercent: z.number().min(0).max(200)
});

export type SimulatorInput = z.infer<typeof simulatorInputSchema>;

export function runCreditSimulation(input: unknown) {
  const data = simulatorInputSchema.parse(input);

  const utilizationAfterPaydown = data.totalDebt > 0
    ? Math.max(0, data.utilization - (data.plannedPaydown / data.totalDebt) * data.utilization)
    : data.utilization;
  const utilizationAfterCli = Math.max(0, utilizationAfterPaydown - data.requestedCliPercent * 0.2);

  const utilizationLift = Math.max(0, (data.utilization - utilizationAfterCli) * 1.2);
  const inquiryPenalty = data.newAccounts * 6 + data.inquiryCount * 2;
  const balanceTransferLift = data.balanceTransfer ? 12 : 0;
  const netDelta = Math.round(utilizationLift + balanceTransferLift - inquiryPenalty);

  const projectedScore = Math.max(300, Math.min(850, data.currentScore + netDelta));
  const approvalOdds = Math.max(10, Math.min(96, projectedScore < 580 ? 22 : projectedScore < 670 ? 47 : projectedScore < 740 ? 72 : 89));

  const lenderPerception = projectedScore < 620
    ? "Subprime risk lens; expect conservative underwriting."
    : projectedScore < 700
      ? "Near-prime profile; approvals improve with clean recent behavior."
      : "Prime profile trajectory; stronger terms likely with stable DTI.";

  return {
    projectedScore,
    delta: netDelta,
    utilizationAfter: Number(utilizationAfterCli.toFixed(1)),
    approvalOdds,
    lenderPerception,
    assumptions: [
      "No new late payments reported during simulation window.",
      "Balances update at statement cycle intervals.",
      "Lender models vary by bureau and product."
    ]
  };
}
