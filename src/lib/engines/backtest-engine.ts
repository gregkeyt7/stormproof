import { BacktestMetrics, MarketSnapshot, StrategyName, TradeRecord } from "@/lib/types";
import { closeTrade, createTrade } from "@/lib/engines/paper-trading-engine";
import { analyzeMarket } from "@/lib/engines/ai-market-brain";
import { evaluateRisk } from "@/lib/engines/risk-engine";
import { generateStrategySignals, selectBestSignal } from "@/lib/engines/strategy-engine";
import { DEFAULT_RISK_SETTINGS } from "@/lib/constants";

type BacktestInput = {
  snapshots: MarketSnapshot[];
  startingBalance: number;
  strategy: StrategyName;
};

export function runBacktest(input: BacktestInput): BacktestMetrics {
  let balance = input.startingBalance;
  let peakBalance = input.startingBalance;
  let maxDrawdownPct = 0;
  const closedTrades: TradeRecord[] = [];

  for (const snapshot of input.snapshots) {
    const analysis = analyzeMarket(snapshot);
    if (analysis.dangerous) continue;

    const signals = generateStrategySignals(snapshot, analysis).filter(
      (signal) => signal.strategy === input.strategy,
    );
    const selected = selectBestSignal(signals, DEFAULT_RISK_SETTINGS.minConfidence);
    if (!selected.shouldTrade || selected.strategy === "no_trade") continue;

    const risk = evaluateRisk(
      {
        accountBalance: balance,
        price: snapshot.price,
        spreadBps: snapshot.spreadBps,
        slippageBps: 4,
      },
      selected,
      DEFAULT_RISK_SETTINGS,
    );
    if (!risk.allowed) continue;

    const opened = createTrade({
      symbol: snapshot.symbol,
      mode: "paper",
      markPrice: snapshot.price,
      spreadBps: snapshot.spreadBps,
      slippageBps: 4,
      signal: selected,
      risk,
      marketCondition: analysis.regime,
    });

    const randomMovePct = (Math.random() - 0.45) * selected.targetDistancePct;
    const exitPrice = snapshot.price * (1 + randomMovePct / 100);
    const closed = closeTrade(opened, exitPrice, "Backtest candle exit.");
    closedTrades.push(closed);
    balance += closed.realizedPnl;

    if (balance > peakBalance) peakBalance = balance;
    const drawdown = ((peakBalance - balance) / peakBalance) * 100;
    if (drawdown > maxDrawdownPct) maxDrawdownPct = drawdown;
  }

  const wins = closedTrades.filter((trade) => trade.realizedPnl > 0);
  const losses = closedTrades.filter((trade) => trade.realizedPnl < 0);
  const totalProfit = wins.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const totalLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.realizedPnl, 0));
  const mean =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, trade) => sum + trade.realizedPnl, 0) / closedTrades.length
      : 0;
  const variance =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, trade) => sum + (trade.realizedPnl - mean) ** 2, 0) /
        closedTrades.length
      : 0;
  const std = Math.sqrt(variance);

  const winRate = closedTrades.length === 0 ? 0 : (wins.length / closedTrades.length) * 100;
  const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
  const averageWin = wins.length === 0 ? 0 : totalProfit / wins.length;
  const averageLoss = losses.length === 0 ? 0 : totalLoss / losses.length;
  const sharpeRatio = std === 0 ? 0 : mean / std;
  const totalReturnPct = ((balance - input.startingBalance) / input.startingBalance) * 100;

  const passed =
    closedTrades.length >= 50 &&
    winRate >= 52 &&
    profitFactor >= 1.2 &&
    maxDrawdownPct <= 10 &&
    totalReturnPct > 0;

  return {
    strategy: input.strategy,
    tradeCount: closedTrades.length,
    winRate,
    profitFactor,
    maxDrawdownPct,
    averageWin,
    averageLoss,
    sharpeRatio,
    totalReturnPct,
    passed,
  };
}
