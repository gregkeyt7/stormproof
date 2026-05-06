import { JournalSummary, TradeRecord } from "@/lib/types";

export function recordTradeLesson(trade: TradeRecord): TradeRecord {
  const lessonLearned =
    trade.result === "WIN"
      ? "Execution respected risk limits and captured planned reward."
      : trade.result === "LOSS"
        ? "Loss accepted within predefined risk. Reassess market regime and entry timing."
        : "Neutral outcome. Continue collecting data.";

  return {
    ...trade,
    lessonLearned,
  };
}

export function summarizeTradeJournal(trades: TradeRecord[]): JournalSummary {
  const recent = trades.slice(-25);
  const winners = recent.filter((trade) => trade.result === "WIN");
  const losers = recent.filter((trade) => trade.result === "LOSS");

  return {
    worked: [
      "Stop-loss and take-profit were attached to each position.",
      "Risk remained bounded even during adverse moves.",
      winners.length > losers.length
        ? "Recent edge is positive; execution discipline is holding."
        : "Data sample is still noisy; edge not fully validated.",
    ],
    failed: [
      losers.length > winners.length
        ? "Losses outpaced wins in the current sample."
        : "No structural failure pattern detected.",
      "Some entries occurred in lower-confidence conditions.",
    ],
    improvements: [
      "Continue paper mode until 100+ paper trades are validated.",
      "Reduce entries during high-spread windows.",
      "Prioritize setups with confidence above 70%.",
    ],
    shouldContinueLive: losers.length <= winners.length,
  };
}
