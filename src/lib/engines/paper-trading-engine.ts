import { RiskEvaluation, StrategySignal, TradeRecord, TradingMode } from "@/lib/types";

type ExecutionInput = {
  symbol: string;
  mode: TradingMode;
  markPrice: number;
  spreadBps: number;
  slippageBps: number;
  signal: StrategySignal;
  risk: RiskEvaluation;
  marketCondition: TradeRecord["marketCondition"];
};

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function applyExecutionPrice(
  markPrice: number,
  direction: "long" | "short",
  spreadBps: number,
  slippageBps: number,
): number {
  const spreadMove = markPrice * (spreadBps / 10000);
  const slippageMove = markPrice * (slippageBps / 10000);
  if (direction === "long") {
    return markPrice + spreadMove / 2 + slippageMove;
  }
  return markPrice - spreadMove / 2 - slippageMove;
}

export function createTrade(input: ExecutionInput): TradeRecord {
  const entryPrice = applyExecutionPrice(
    input.markPrice,
    input.signal.direction,
    input.spreadBps,
    input.slippageBps,
  );

  return {
    id: randomId("trade"),
    symbol: input.symbol,
    mode: input.mode,
    strategy: input.signal.strategy,
    direction: input.signal.direction,
    confidence: input.signal.confidence,
    entryPrice,
    stopLoss: input.risk.stopLoss,
    takeProfit: input.risk.takeProfit,
    quantity: input.risk.positionSize,
    spreadBps: input.spreadBps,
    slippageBps: input.slippageBps,
    rewardRiskRatio: input.risk.rewardRiskRatio,
    expectedValue: input.risk.expectedValue,
    riskAmount: input.risk.riskAmount,
    maxPossibleLoss: input.risk.maxPossibleLoss,
    entryReason: input.signal.entryReason,
    exitReason: null,
    marketCondition: input.marketCondition,
    lessonLearned: null,
    screenshotUrl: null,
    openedAt: new Date().toISOString(),
    closedAt: null,
    result: "OPEN",
    realizedPnl: 0,
    unrealizedPnl: 0,
  };
}

export function markToMarket(trade: TradeRecord, price: number): TradeRecord {
  const delta =
    trade.direction === "long" ? price - trade.entryPrice : trade.entryPrice - price;
  const unrealizedPnl = delta * trade.quantity;
  return { ...trade, unrealizedPnl };
}

export function closeTrade(
  trade: TradeRecord,
  exitPrice: number,
  reason: string,
): TradeRecord {
  const delta =
    trade.direction === "long"
      ? exitPrice - trade.entryPrice
      : trade.entryPrice - exitPrice;
  const pnl = delta * trade.quantity;

  return {
    ...trade,
    result: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN",
    realizedPnl: pnl,
    unrealizedPnl: 0,
    exitReason: reason,
    closedAt: new Date().toISOString(),
  };
}

export function evaluateExit(trade: TradeRecord, currentPrice: number): TradeRecord | null {
  if (trade.direction === "long") {
    if (currentPrice <= trade.stopLoss) {
      return closeTrade(trade, trade.stopLoss, "Stop loss hit.");
    }
    if (currentPrice >= trade.takeProfit) {
      return closeTrade(trade, trade.takeProfit, "Take profit reached.");
    }
  } else {
    if (currentPrice >= trade.stopLoss) {
      return closeTrade(trade, trade.stopLoss, "Stop loss hit.");
    }
    if (currentPrice <= trade.takeProfit) {
      return closeTrade(trade, trade.takeProfit, "Take profit reached.");
    }
  }
  return null;
}
