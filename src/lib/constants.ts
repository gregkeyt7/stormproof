import { ProfitSettings, RiskSettings } from "@/lib/types";

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  maxRiskPerTradePct: 1,
  maxDailyLossPct: 3,
  maxOpenTrades: 2,
  maxDrawdownPct: 10,
  minRewardRiskRatio: 2,
  minConfidence: 62,
  cooldownAfterConsecutiveLosses: 2,
  maxTradesPerDay: 8,
  maxSpreadBps: 18,
  maxSlippageBps: 12,
  minimumSafeBalance: 20,
};

export const DEFAULT_PROFIT_SETTINGS: ProfitSettings = {
  dailyGoalUsd: 2,
  weeklyGoalUsd: 8,
  taxReservePct: 25,
  reinvestPct: 50,
  withdrawalPct: 25,
};

export const PAPER_QUALIFICATION_TRADES = 100;
export const PAPER_QUALIFICATION_WIN_RATE = 55;
export const PAPER_QUALIFICATION_MAX_DRAWDOWN = 8;
