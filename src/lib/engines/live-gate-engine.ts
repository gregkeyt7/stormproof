import {
  PAPER_QUALIFICATION_MAX_DRAWDOWN,
  PAPER_QUALIFICATION_TRADES,
  PAPER_QUALIFICATION_WIN_RATE,
} from "@/lib/constants";
import { LiveModeGate, TradeRecord } from "@/lib/types";

type LiveGateInput = {
  userConfirmed: boolean;
  apiKeysConfigured: boolean;
  riskConfigured: boolean;
  emergencyKillSwitchArmed: boolean;
  drawdownPct: number;
  paperTrades: TradeRecord[];
};

export function evaluateLiveModeEligibility(input: LiveGateInput): LiveModeGate {
  const reasons: string[] = [];
  const paperClosed = input.paperTrades.filter((trade) => trade.result !== "OPEN");
  const wins = paperClosed.filter((trade) => trade.result === "WIN");
  const winRate = paperClosed.length === 0 ? 0 : (wins.length / paperClosed.length) * 100;

  if (!input.userConfirmed) reasons.push("User confirmation not completed.");
  if (!input.apiKeysConfigured) reasons.push("Exchange API keys are not configured.");
  if (!input.riskConfigured) reasons.push("Risk settings are incomplete.");
  if (!input.emergencyKillSwitchArmed) {
    reasons.push("Emergency kill switch is not armed.");
  }
  if (paperClosed.length < PAPER_QUALIFICATION_TRADES) {
    reasons.push(
      `Paper history requires ${PAPER_QUALIFICATION_TRADES} closed trades (current: ${paperClosed.length}).`,
    );
  }
  if (winRate < PAPER_QUALIFICATION_WIN_RATE) {
    reasons.push(
      `Paper win rate ${winRate.toFixed(1)}% is below ${PAPER_QUALIFICATION_WIN_RATE.toFixed(1)}%.`,
    );
  }
  if (input.drawdownPct > PAPER_QUALIFICATION_MAX_DRAWDOWN) {
    reasons.push(
      `Drawdown ${input.drawdownPct.toFixed(2)}% is above ${PAPER_QUALIFICATION_MAX_DRAWDOWN.toFixed(2)}%.`,
    );
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
