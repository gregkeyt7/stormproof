import { JournalSummary, LossAction, TradeRecord } from "@/lib/types";

type PerformanceReview = {
  lossAction: LossAction;
  reason: string;
  summary: JournalSummary;
};

export function summarizeJournal(trades: TradeRecord[]): JournalSummary {
  const recent = trades.slice(-20);
  const wins = recent.filter((trade) => trade.result === "WIN");
  const losses = recent.filter((trade) => trade.result === "LOSS");

  const worked: string[] = [];
  const failed: string[] = [];
  const improvements: string[] = [];

  if (wins.length > 0) {
    worked.push("Risk caps prevented catastrophic losses.");
    worked.push("Take-profit logic captured favorable moves.");
  }

  if (losses.length > wins.length) {
    failed.push("Recent loss rate exceeded win rate.");
    failed.push("Market conditions likely mismatched active strategy.");
  }

  if (recent.some((trade) => trade.marketCondition === "volatile")) {
    improvements.push("Reduce trade frequency during volatile regime.");
  }
  if (recent.some((trade) => trade.strategy === "scalping")) {
    improvements.push("Tighten spread/slippage filter in scalping mode.");
  }
  if (improvements.length === 0) {
    improvements.push("Continue paper validation until 100+ trades are logged.");
  }

  const shouldContinueLive = losses.length <= wins.length;

  return {
    worked: worked.length > 0 ? worked : ["No stable edge confirmed yet."],
    failed: failed.length > 0 ? failed : ["No critical failure pattern detected."],
    improvements,
    shouldContinueLive,
  };
}

export function evaluateRecentPerformance(trades: TradeRecord[]): PerformanceReview {
  const recent = trades.slice(-12);
  const losses = recent.filter((trade) => trade.result === "LOSS");
  const consecutiveLosses = recent
    .slice()
    .reverse()
    .findIndex((trade) => trade.result !== "LOSS");

  const streak = consecutiveLosses === -1 ? losses.length : consecutiveLosses;
  const summary = summarizeJournal(trades);

  if (streak >= 3) {
    return {
      lossAction: "paper_fallback",
      reason: "Loss streak hit 3 trades. Switching to paper mode for protection.",
      summary,
    };
  }

  if (losses.length >= 6) {
    return {
      lossAction: "cooldown",
      reason: "High recent loss ratio. Applying cooldown and no-trade period.",
      summary,
    };
  }

  return {
    lossAction: "continue",
    reason: "Performance is within acceptable guardrails.",
    summary,
  };
}
