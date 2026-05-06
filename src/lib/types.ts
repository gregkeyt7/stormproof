export type TradingMode = "paper" | "live";

export type MarketRegime =
  | "trending"
  | "ranging"
  | "volatile"
  | "low_volume"
  | "dangerous"
  | "high_opportunity";

export type StrategyName =
  | "trend_following"
  | "breakout"
  | "mean_reversion"
  | "scalping"
  | "no_trade";

export type TradeResult = "OPEN" | "WIN" | "LOSS" | "BREAKEVEN" | "CANCELLED";

export type SignalDirection = "long" | "short";

export type LossAction = "continue" | "paper_fallback" | "cooldown";

export type TradeRecord = {
  id: string;
  symbol: string;
  mode: TradingMode;
  strategy: StrategyName;
  direction: SignalDirection;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  spreadBps: number;
  slippageBps: number;
  rewardRiskRatio: number;
  expectedValue: number;
  riskAmount: number;
  maxPossibleLoss: number;
  entryReason: string;
  exitReason: string | null;
  marketCondition: MarketRegime;
  lessonLearned: string | null;
  screenshotUrl: string | null;
  openedAt: string;
  closedAt: string | null;
  result: TradeResult;
  realizedPnl: number;
  unrealizedPnl: number;
};

export type RiskSettings = {
  maxRiskPerTradePct: number;
  maxDailyLossPct: number;
  maxOpenTrades: number;
  maxDrawdownPct: number;
  minRewardRiskRatio: number;
  minConfidence: number;
  cooldownAfterConsecutiveLosses: number;
  maxTradesPerDay: number;
  maxSpreadBps: number;
  maxSlippageBps: number;
  minimumSafeBalance: number;
};

export type ProfitSettings = {
  dailyGoalUsd: number;
  weeklyGoalUsd: number;
  taxReservePct: number;
  reinvestPct: number;
  withdrawalPct: number;
};

export type StrategyPerformancePoint = {
  strategy: StrategyName;
  winRate: number;
  pnl: number;
  tradeCount: number;
};

export type EquityPoint = {
  day: string;
  equity: number;
};

export type MarketSnapshot = {
  symbol: string;
  timestamp: string;
  price: number;
  bid: number;
  ask: number;
  spreadBps: number;
  volume: number;
  volatilityPct: number;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    emaFast: number;
    emaSlow: number;
    vwap: number;
    support: number;
    resistance: number;
    bollingerUpper: number;
    bollingerLower: number;
    trendScore: number;
  };
  candlestickPattern: "bullish" | "bearish" | "neutral";
  newsRiskHigh: boolean;
  dataDelayMs: number;
  liquidityScore: number;
};

export type MarketAnalysis = {
  regime: MarketRegime;
  confidence: number;
  trendDirection: "up" | "down" | "sideways";
  dangerous: boolean;
  highOpportunity: boolean;
  reasons: string[];
};

export type StrategySignal = {
  strategy: StrategyName;
  direction: SignalDirection;
  confidence: number;
  entryReason: string;
  stopDistancePct: number;
  targetDistancePct: number;
  shouldTrade: boolean;
};

export type RiskEvaluation = {
  allowed: boolean;
  reasons: string[];
  positionSize: number;
  riskAmount: number;
  expectedValue: number;
  rewardRiskRatio: number;
  maxPossibleLoss: number;
  stopLoss: number;
  takeProfit: number;
};

export type LiveModeGate = {
  allowed: boolean;
  reasons: string[];
};

export type BacktestMetrics = {
  strategy: StrategyName;
  tradeCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  averageWin: number;
  averageLoss: number;
  sharpeRatio: number;
  totalReturnPct: number;
  passed: boolean;
};

export type JournalSummary = {
  worked: string[];
  failed: string[];
  improvements: string[];
  shouldContinueLive: boolean;
};

export type BotLogRecord = {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
};

export type DashboardSummary = {
  accountBalance: number;
  dailyPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number;
  drawdown: number;
  strategyConfidence: number;
  taxReserveAmount: number;
  mode: TradingMode;
  emergencyStopActive: boolean;
  maxDailyLossPct: number;
  maxDrawdownPct: number;
  liveModeEligible: LiveModeGate;
  openTrades: TradeRecord[];
  closedTrades: TradeRecord[];
  equityCurve: EquityPoint[];
  strategyPerformance: StrategyPerformancePoint[];
};
