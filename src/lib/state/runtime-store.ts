import {
  DEFAULT_PROFIT_SETTINGS,
  DEFAULT_RISK_SETTINGS,
} from "@/lib/constants";
import { computeProfitAllocation } from "@/lib/engines/profit-manager";
import { evaluateLiveModeEligibility } from "@/lib/engines/live-gate-engine";
import {
  DashboardSummary,
  EquityPoint,
  ProfitSettings,
  RiskSettings,
  StrategyPerformancePoint,
  TradeRecord,
  TradingMode,
} from "@/lib/types";

type RuntimeStore = {
  mode: TradingMode;
  accountBalance: number;
  peakBalance: number;
  emergencyStopActive: boolean;
  killSwitchArmed: boolean;
  userConfirmedLiveMode: boolean;
  apiKeysConfigured: boolean;
  riskSettings: RiskSettings;
  profitSettings: ProfitSettings;
  openTrades: TradeRecord[];
  closedTrades: TradeRecord[];
  logs: string[];
  dailyTradeCount: number;
  cooldownTicks: number;
  strategyConfidence: number;
};

const STORE_KEY = "__RAYLIX_STORE__";

function createInitialStore(): RuntimeStore {
  return {
    mode: "paper",
    accountBalance: 20,
    peakBalance: 20,
    emergencyStopActive: false,
    killSwitchArmed: true,
    userConfirmedLiveMode: false,
    apiKeysConfigured: false,
    riskSettings: DEFAULT_RISK_SETTINGS,
    profitSettings: DEFAULT_PROFIT_SETTINGS,
    openTrades: [],
    closedTrades: [],
    logs: [],
    dailyTradeCount: 0,
    cooldownTicks: 0,
    strategyConfidence: 0,
  };
}

export function getStore(): RuntimeStore {
  const globalState = globalThis as typeof globalThis & {
    [STORE_KEY]?: RuntimeStore;
  };
  if (!globalState[STORE_KEY]) {
    globalState[STORE_KEY] = createInitialStore();
  }
  return globalState[STORE_KEY];
}

export function pushLog(message: string): void {
  const store = getStore();
  store.logs.push(`${new Date().toISOString()} ${message}`);
  if (store.logs.length > 500) {
    store.logs.splice(0, store.logs.length - 500);
  }
}

function calculateWinRate(trades: TradeRecord[]): number {
  const closed = trades.filter((trade) => trade.result !== "OPEN");
  if (closed.length === 0) return 0;
  const wins = closed.filter((trade) => trade.result === "WIN").length;
  return (wins / closed.length) * 100;
}

function calculateDrawdownPct(balance: number, peakBalance: number): number {
  if (peakBalance <= 0) return 0;
  return ((peakBalance - balance) / peakBalance) * 100;
}

function buildEquityCurve(trades: TradeRecord[], startingBalance: number): EquityPoint[] {
  let running = startingBalance;
  const points: EquityPoint[] = [{ day: "Start", equity: startingBalance }];
  trades.slice(-30).forEach((trade, index) => {
    running += trade.realizedPnl;
    points.push({
      day: `T${index + 1}`,
      equity: Number(running.toFixed(2)),
    });
  });
  return points;
}

function buildStrategyPerformance(trades: TradeRecord[]): StrategyPerformancePoint[] {
  const byStrategy = new Map<
    TradeRecord["strategy"],
    { wins: number; total: number; pnl: number }
  >();

  for (const trade of trades) {
    const record = byStrategy.get(trade.strategy) ?? {
      wins: 0,
      total: 0,
      pnl: 0,
    };
    record.total += 1;
    record.pnl += trade.realizedPnl;
    if (trade.result === "WIN") record.wins += 1;
    byStrategy.set(trade.strategy, record);
  }

  return [...byStrategy.entries()].map(([strategy, value]) => ({
    strategy,
    tradeCount: value.total,
    pnl: Number(value.pnl.toFixed(2)),
    winRate: value.total === 0 ? 0 : (value.wins / value.total) * 100,
  }));
}

export function buildDashboardSummary(): DashboardSummary {
  const store = getStore();
  const recentDailyTrades =
    store.dailyTradeCount === 0
      ? []
      : store.closedTrades.slice(-store.dailyTradeCount);
  const profit = computeProfitAllocation(
    store.closedTrades,
    store.openTrades,
    store.profitSettings,
  );
  const drawdown = calculateDrawdownPct(store.accountBalance, store.peakBalance);
  const liveModeEligible = evaluateLiveModeEligibility({
    userConfirmed: store.userConfirmedLiveMode,
    apiKeysConfigured: store.apiKeysConfigured,
    riskConfigured: Boolean(store.riskSettings),
    emergencyKillSwitchArmed: store.killSwitchArmed,
    drawdownPct: drawdown,
    paperTrades: store.closedTrades.filter((trade) => trade.mode === "paper"),
  });

  return {
    accountBalance: Number(store.accountBalance.toFixed(2)),
    dailyPnl: Number(
      recentDailyTrades
        .reduce((sum, trade) => sum + trade.realizedPnl, 0)
        .toFixed(2),
    ),
    realizedPnl: Number(profit.realizedProfit.toFixed(2)),
    unrealizedPnl: Number(profit.unrealizedProfit.toFixed(2)),
    winRate: Number(calculateWinRate(store.closedTrades).toFixed(2)),
    drawdown: Number(drawdown.toFixed(2)),
    strategyConfidence: Number(store.strategyConfidence.toFixed(2)),
    taxReserveAmount: Number(profit.taxReserveAmount.toFixed(2)),
    mode: store.mode,
    emergencyStopActive: store.emergencyStopActive,
    maxDailyLossPct: store.riskSettings.maxDailyLossPct,
    maxDrawdownPct: store.riskSettings.maxDrawdownPct,
    liveModeEligible,
    openTrades: store.openTrades,
    closedTrades: store.closedTrades.slice().reverse(),
    equityCurve: buildEquityCurve(store.closedTrades, 20),
    strategyPerformance: buildStrategyPerformance(store.closedTrades),
  };
}

