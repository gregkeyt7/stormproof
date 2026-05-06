import { z } from "zod";
import { RiskEvaluation, RiskSettings, StrategySignal } from "@/lib/types";

const riskInputSchema = z.object({
  accountBalance: z.number().positive(),
  price: z.number().positive(),
  spreadBps: z.number().nonnegative(),
  slippageBps: z.number().nonnegative(),
});

type RiskInput = z.infer<typeof riskInputSchema>;

export function evaluateRisk(
  input: RiskInput,
  signal: StrategySignal,
  settings: RiskSettings,
): RiskEvaluation {
  const validated = riskInputSchema.parse(input);
  const reasons: string[] = [];

  if (!signal.shouldTrade || signal.strategy === "no_trade") {
    reasons.push("Selected strategy did not produce a tradable signal.");
  }
  if (validated.accountBalance < settings.minimumSafeBalance) {
    reasons.push("Account balance is below minimum safe sizing threshold.");
  }
  if (validated.spreadBps > settings.maxSpreadBps) {
    reasons.push("Spread is above configured risk limit.");
  }
  if (validated.slippageBps > settings.maxSlippageBps) {
    reasons.push("Slippage estimate exceeds configured limit.");
  }

  const riskAmount = validated.accountBalance * (settings.maxRiskPerTradePct / 100);
  const stopDistance = validated.price * (signal.stopDistancePct / 100);
  const targetDistance = validated.price * (signal.targetDistancePct / 100);
  const rewardRiskRatio = stopDistance > 0 ? targetDistance / stopDistance : 0;
  const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
  const expectedValue =
    (signal.confidence / 100) * targetDistance -
    (1 - signal.confidence / 100) * stopDistance;

  if (rewardRiskRatio < settings.minRewardRiskRatio) {
    reasons.push(
      `Reward-to-risk ratio ${rewardRiskRatio.toFixed(2)} is below ${settings.minRewardRiskRatio.toFixed(2)}.`,
    );
  }
  if (signal.confidence < settings.minConfidence) {
    reasons.push("Signal confidence is below minimum threshold.");
  }
  if (positionSize <= 0 || !Number.isFinite(positionSize)) {
    reasons.push("Position sizing failed validation.");
  }

  const stopLoss =
    signal.direction === "long"
      ? validated.price - stopDistance
      : validated.price + stopDistance;
  const takeProfit =
    signal.direction === "long"
      ? validated.price + targetDistance
      : validated.price - targetDistance;

  const maxPossibleLoss = riskAmount + validated.price * (validated.slippageBps / 10000);

  return {
    allowed: reasons.length === 0,
    reasons,
    positionSize,
    riskAmount,
    expectedValue,
    rewardRiskRatio,
    maxPossibleLoss,
    stopLoss,
    takeProfit,
  };
}
