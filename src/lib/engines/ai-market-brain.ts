import { MarketAnalysis, MarketSnapshot } from "@/lib/types";

export function analyzeMarket(snapshot: MarketSnapshot): MarketAnalysis {
  const reasons: string[] = [];
  const { indicators } = snapshot;

  const trendBias = indicators.emaFast - indicators.emaSlow;
  const macdBias = indicators.macd - indicators.macdSignal;
  const trendDirection =
    trendBias > 0 && macdBias > 0
      ? "up"
      : trendBias < 0 && macdBias < 0
        ? "down"
        : "sideways";

  const lowVolume = snapshot.volume < 30;
  const volatile = snapshot.volatilityPct > 2.4;
  const spreadWide = snapshot.spreadBps > 18;
  const delayedData = snapshot.dataDelayMs > 1500;
  const dangerous =
    snapshot.newsRiskHigh || spreadWide || delayedData || snapshot.liquidityScore < 35;

  if (snapshot.newsRiskHigh) reasons.push("News risk is elevated.");
  if (spreadWide) reasons.push("Spread is too high for safe execution.");
  if (volatile) reasons.push("Volatility is elevated.");
  if (lowVolume) reasons.push("Volume is too low.");
  if (delayedData) reasons.push("Market data delay exceeds safety threshold.");
  if (snapshot.liquidityScore < 35) reasons.push("Liquidity zone flagged as unsafe.");

  let regime: MarketAnalysis["regime"] = "ranging";
  if (dangerous) regime = "dangerous";
  else if (volatile) regime = "volatile";
  else if (lowVolume) regime = "low_volume";
  else if (Math.abs(indicators.trendScore) > 0.65) regime = "trending";
  else if (
    indicators.rsi > 35 &&
    indicators.rsi < 65 &&
    snapshot.price > indicators.support &&
    snapshot.price < indicators.resistance
  ) {
    regime = "high_opportunity";
  }

  const confidenceBase =
    48 +
    Math.abs(indicators.trendScore) * 20 +
    Math.max(0, 10 - Math.abs(indicators.rsi - 50)) +
    (snapshot.newsRiskHigh ? -20 : 6) +
    (spreadWide ? -12 : 6) +
    (volatile ? -8 : 4);

  const confidence = Math.max(0, Math.min(100, confidenceBase));

  return {
    regime,
    confidence,
    trendDirection,
    dangerous,
    highOpportunity: regime === "high_opportunity" || confidence > 75,
    reasons,
  };
}
