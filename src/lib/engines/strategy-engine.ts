import {
  MarketAnalysis,
  MarketSnapshot,
  StrategyName,
  StrategySignal,
} from "@/lib/types";

function trendFollowingSignal(
  snapshot: MarketSnapshot,
  analysis: MarketAnalysis,
): StrategySignal {
  const direction = analysis.trendDirection === "down" ? "short" : "long";
  const strongTrend = Math.abs(snapshot.indicators.trendScore) > 0.55;
  const volumeConfirmed = snapshot.volume > 45;
  const shouldTrade = strongTrend && volumeConfirmed && analysis.regime !== "dangerous";

  return {
    strategy: "trend_following",
    direction,
    confidence: shouldTrade ? analysis.confidence + 8 : analysis.confidence - 10,
    entryReason: "EMA crossover + higher-timeframe trend + volume confirmation.",
    stopDistancePct: 0.6,
    targetDistancePct: 1.4,
    shouldTrade,
  };
}

function breakoutSignal(
  snapshot: MarketSnapshot,
  analysis: MarketAnalysis,
): StrategySignal {
  const aboveResistance = snapshot.price > snapshot.indicators.resistance * 1.001;
  const belowSupport = snapshot.price < snapshot.indicators.support * 0.999;
  const direction = belowSupport ? "short" : "long";
  const shouldTrade =
    (aboveResistance || belowSupport) &&
    snapshot.volume > 55 &&
    snapshot.volatilityPct > 0.7 &&
    !analysis.dangerous;

  return {
    strategy: "breakout",
    direction,
    confidence: shouldTrade ? analysis.confidence + 6 : analysis.confidence - 12,
    entryReason: "Support/resistance break + volume spike + volatility expansion + retest.",
    stopDistancePct: 0.5,
    targetDistancePct: 1.5,
    shouldTrade,
  };
}

function meanReversionSignal(
  snapshot: MarketSnapshot,
  analysis: MarketAnalysis,
): StrategySignal {
  const rsi = snapshot.indicators.rsi;
  const price = snapshot.price;
  const direction =
    rsi < 30 || price < snapshot.indicators.bollingerLower ? "long" : "short";
  const shouldTrade =
    (rsi < 28 || rsi > 72) &&
    Math.abs(price - snapshot.indicators.vwap) / price > 0.004 &&
    analysis.regime !== "trending" &&
    !analysis.dangerous;

  return {
    strategy: "mean_reversion",
    direction,
    confidence: shouldTrade ? analysis.confidence + 4 : analysis.confidence - 8,
    entryReason: "RSI extreme + Bollinger + VWAP distance + reversal confirmation.",
    stopDistancePct: 0.45,
    targetDistancePct: 1.1,
    shouldTrade,
  };
}

function scalpingSignal(
  snapshot: MarketSnapshot,
  analysis: MarketAnalysis,
): StrategySignal {
  const spreadTight = snapshot.spreadBps < 10;
  const slippageTight = snapshot.volatilityPct < 1.4;
  const microTrend = Math.abs(snapshot.indicators.emaFast - snapshot.price) / snapshot.price < 0.002;
  const direction = snapshot.indicators.emaFast >= snapshot.indicators.emaSlow ? "long" : "short";
  const shouldTrade = spreadTight && slippageTight && microTrend && !analysis.dangerous;

  return {
    strategy: "scalping",
    direction,
    confidence: shouldTrade ? analysis.confidence + 3 : analysis.confidence - 15,
    entryReason: "Fast MA alignment + micro trend + strict spread/slippage filter.",
    stopDistancePct: 0.25,
    targetDistancePct: 0.6,
    shouldTrade,
  };
}

function noTradeSignal(reasons: string[]): StrategySignal {
  return {
    strategy: "no_trade",
    direction: "long",
    confidence: 0,
    entryReason: reasons.join(" "),
    stopDistancePct: 0,
    targetDistancePct: 0,
    shouldTrade: false,
  };
}

export function generateStrategySignals(
  snapshot: MarketSnapshot,
  analysis: MarketAnalysis,
): StrategySignal[] {
  const signals = [
    trendFollowingSignal(snapshot, analysis),
    breakoutSignal(snapshot, analysis),
    meanReversionSignal(snapshot, analysis),
    scalpingSignal(snapshot, analysis),
  ];

  const safetyReasons: string[] = [];
  if (analysis.dangerous) safetyReasons.push("Market brain flagged dangerous regime.");
  if (snapshot.spreadBps > 18) safetyReasons.push("Spread is above hard limit.");
  if (analysis.confidence < 58) safetyReasons.push("Confidence below safe threshold.");
  if (snapshot.dataDelayMs > 1500) safetyReasons.push("Data delay too high.");

  if (safetyReasons.length > 0) {
    signals.push(noTradeSignal(safetyReasons));
  }

  return signals;
}

export function selectBestSignal(
  signals: StrategySignal[],
  minConfidence: number,
): StrategySignal {
  const tradableSignals = signals
    .filter((signal) => signal.shouldTrade && signal.strategy !== "no_trade")
    .sort((a, b) => b.confidence - a.confidence);

  const best = tradableSignals[0];
  if (!best || best.confidence < minConfidence) {
    return {
      strategy: "no_trade",
      direction: "long",
      confidence: best?.confidence ?? 0,
      entryReason: "No validated high-probability setup passed safety constraints.",
      stopDistancePct: 0,
      targetDistancePct: 0,
      shouldTrade: false,
    };
  }

  return best;
}

export function strategyNames(): StrategyName[] {
  return ["trend_following", "breakout", "mean_reversion", "scalping", "no_trade"];
}
