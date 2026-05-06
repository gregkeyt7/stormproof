import { generateHistoricalSnapshots, generateMarketSnapshot } from "@/lib/data/mock-market";
import { analyzeMarket } from "@/lib/engines/ai-market-brain";
import { runBacktest } from "@/lib/engines/backtest-engine";
import { evaluateLiveModeEligibility } from "@/lib/engines/live-gate-engine";
import { evaluateRisk } from "@/lib/engines/risk-engine";
import {
  createTrade,
  evaluateExit,
  markToMarket,
} from "@/lib/engines/paper-trading-engine";
import { evaluateRecentPerformance } from "@/lib/engines/self-correction-engine";
import {
  generateStrategySignals,
  selectBestSignal,
  strategyNames,
} from "@/lib/engines/strategy-engine";
import { recordTradeLesson } from "@/lib/engines/trade-journal-engine";
import { getStore, pushLog } from "@/lib/state/runtime-store";
import {
  BacktestMetrics,
  MarketSnapshot,
  StrategyName,
  TradeRecord,
} from "@/lib/types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function validateTradeWindow(): { allowed: boolean; reason?: string } {
  const store = getStore();
  const drawdownPct =
    ((store.peakBalance - store.accountBalance) / Math.max(store.peakBalance, 1)) * 100;
  const recentDailyTrades =
    store.dailyTradeCount === 0
      ? []
      : store.closedTrades.slice(-store.dailyTradeCount);
  const dailyPnl = recentDailyTrades.reduce(
    (sum, trade) => sum + trade.realizedPnl,
    0,
  );
  const dailyLossPct = (Math.abs(Math.min(0, dailyPnl)) / Math.max(store.accountBalance, 1)) * 100;

  if (store.emergencyStopActive) {
    return { allowed: false, reason: "Emergency stop is active." };
  }
  if (store.cooldownTicks > 0) {
    return { allowed: false, reason: "Cooldown active after recent losses." };
  }
  if (store.dailyTradeCount >= store.riskSettings.maxTradesPerDay) {
    return { allowed: false, reason: "Max trades per day reached." };
  }
  if (store.openTrades.length >= store.riskSettings.maxOpenTrades) {
    return { allowed: false, reason: "Max open trades reached." };
  }
  if (drawdownPct >= store.riskSettings.maxDrawdownPct) {
    return { allowed: false, reason: "Max drawdown hit. Trading halted." };
  }
  if (dailyLossPct >= store.riskSettings.maxDailyLossPct) {
    return { allowed: false, reason: "Max daily loss hit. Trading halted." };
  }
  return { allowed: true };
}

function settleOpenTrades(currentPrice: number): void {
  const store = getStore();
  const nextOpen: TradeRecord[] = [];

  for (const openTrade of store.openTrades) {
    const marked = markToMarket(openTrade, currentPrice);
    const closed = evaluateExit(marked, currentPrice);
    if (closed) {
      const learned = recordTradeLesson(closed);
      store.closedTrades.push(learned);
      store.accountBalance += learned.realizedPnl;
      store.dailyTradeCount += 1;
      pushLog(`Trade ${learned.id} closed: ${learned.result} ${learned.realizedPnl.toFixed(2)}.`);
    } else {
      nextOpen.push(marked);
    }
  }
  store.openTrades = nextOpen;
  store.peakBalance = Math.max(store.peakBalance, store.accountBalance);
}

export function runBotTick(symbol = "BTCUSDT"): string {
  const store = getStore();
  const timeGate = validateTradeWindow();
  let snapshot: MarketSnapshot;
  try {
    snapshot = generateMarketSnapshot(symbol);
  } catch (error) {
    store.emergencyStopActive = true;
    pushLog(
      `Market data error encountered. Trading halted. ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    return "No trade: market data/API error detected. Emergency stop has been activated.";
  }
  settleOpenTrades(snapshot.price);

  if (!timeGate.allowed) {
    pushLog(`No trade: ${timeGate.reason ?? "Unknown gate."}`);
    return `No trade executed: ${timeGate.reason}`;
  }

  const analysis = analyzeMarket(snapshot);
  store.strategyConfidence = analysis.confidence;

  if (analysis.dangerous) {
    pushLog("Market flagged as dangerous. Trade skipped.");
    return "No trade: market flagged dangerous by AI market brain.";
  }

  const signals = generateStrategySignals(snapshot, analysis);
  const selected = selectBestSignal(signals, store.riskSettings.minConfidence);
  if (!selected.shouldTrade || selected.strategy === "no_trade") {
    pushLog("No validated setup met strategy confidence and risk rules.");
    return "No trade: no validated high-probability setup.";
  }

  const risk = evaluateRisk(
    {
      accountBalance: store.accountBalance,
      price: snapshot.price,
      spreadBps: snapshot.spreadBps,
      slippageBps: clamp(snapshot.volatilityPct * 4, 1, 20),
    },
    selected,
    store.riskSettings,
  );

  if (!risk.allowed) {
    pushLog(`Risk check blocked trade: ${risk.reasons.join(" ")}`);
    return `No trade: ${risk.reasons.join(" ")}`;
  }

  const trade = createTrade({
    symbol: snapshot.symbol,
    mode: store.mode,
    markPrice: snapshot.price,
    spreadBps: snapshot.spreadBps,
    slippageBps: clamp(snapshot.volatilityPct * 4, 1, 20),
    signal: selected,
    risk,
    marketCondition: analysis.regime,
  });

  store.openTrades.push(trade);
  pushLog(
    `Opened ${trade.mode.toUpperCase()} ${trade.strategy} ${trade.direction} trade with confidence ${trade.confidence.toFixed(1)}%.`,
  );

  // Simulate partial lifecycle for paper testing.
  if (store.mode === "paper" || Math.random() < 0.6) {
    const closeMove = (Math.random() - 0.45) * (selected.targetDistancePct / 100);
    const mark = snapshot.price * (1 + closeMove);
    settleOpenTrades(mark);
  }

  const review = evaluateRecentPerformance(store.closedTrades);
  if (review.lossAction === "paper_fallback" && store.mode === "live") {
    store.mode = "paper";
    store.cooldownTicks = store.riskSettings.cooldownAfterConsecutiveLosses;
    pushLog("Self-correction switched bot from live mode to paper mode.");
  } else if (review.lossAction === "cooldown") {
    store.cooldownTicks = store.riskSettings.cooldownAfterConsecutiveLosses;
    pushLog("Self-correction activated cooldown.");
  } else if (store.cooldownTicks > 0) {
    store.cooldownTicks -= 1;
  }

  return `Cycle complete: ${trade.strategy} signal processed in ${store.mode.toUpperCase()} mode.`;
}

export function setEmergencyStop(active: boolean): string {
  const store = getStore();
  store.emergencyStopActive = active;
  if (active) {
    store.mode = "paper";
    pushLog("Emergency stop activated. Live trading halted.");
    return "Emergency stop enabled. Bot forced to paper mode.";
  }
  pushLog("Emergency stop released by user.");
  return "Emergency stop released. Paper mode remains active until manually switched.";
}

export function requestModeChange(targetMode: "paper" | "live"): string {
  const store = getStore();
  if (targetMode === "paper") {
    store.mode = "paper";
    pushLog("Mode switched to paper.");
    return "Mode switched to paper trading.";
  }

  store.userConfirmedLiveMode = true;
  store.apiKeysConfigured =
    Boolean(process.env.BINANCE_API_KEY) && Boolean(process.env.BINANCE_API_SECRET);

  const summary = evaluateRecentPerformance(store.closedTrades);
  if (!summary.summary.shouldContinueLive) {
    store.mode = "paper";
    return "Live mode blocked: recent losses require paper-mode retraining.";
  }

  const gate = evaluateLiveModeEligibility({
    userConfirmed: store.userConfirmedLiveMode,
    apiKeysConfigured: store.apiKeysConfigured,
    riskConfigured: Boolean(store.riskSettings),
    emergencyKillSwitchArmed: store.killSwitchArmed,
    drawdownPct:
      ((store.peakBalance - store.accountBalance) / Math.max(store.peakBalance, 1)) * 100,
    paperTrades: store.closedTrades.filter((trade) => trade.mode === "paper"),
  });

  if (!gate.allowed) {
    store.mode = "paper";
    return `Live mode blocked: ${gate.reasons.join(" ")}`;
  }

  if (store.emergencyStopActive) {
    store.mode = "paper";
    return "Live mode blocked: emergency stop is currently active.";
  }

  store.mode = "live";
  pushLog("Mode switched to live with tiny position sizing policy.");
  return "Live mode enabled with risk caps and tiny position sizing.";
}

export function runBacktestsForAllStrategies(): BacktestMetrics[] {
  const snapshots = generateHistoricalSnapshots("BTCUSDT", 240);
  return strategyNames()
    .filter((name): name is StrategyName => name !== "no_trade")
    .map((strategy) =>
      runBacktest({
        snapshots,
        startingBalance: 1000,
        strategy,
      }),
    );
}
