import { MarketSnapshot } from "@/lib/types";

type MarketState = {
  lastPrice: number;
  drift: number;
};

const stateBySymbol = new Map<string, MarketState>();

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function nextState(symbol: string): MarketState {
  const existing = stateBySymbol.get(symbol);
  if (existing) {
    const updated: MarketState = {
      lastPrice: Math.max(1, existing.lastPrice * (1 + randomBetween(-0.008, 0.008))),
      drift: Math.max(-1, Math.min(1, existing.drift + randomBetween(-0.1, 0.1))),
    };
    stateBySymbol.set(symbol, updated);
    return updated;
  }

  const initial: MarketState = {
    lastPrice: 30000,
    drift: randomBetween(-0.25, 0.25),
  };
  stateBySymbol.set(symbol, initial);
  return initial;
}

export function generateMarketSnapshot(symbol = "BTCUSDT"): MarketSnapshot {
  const state = nextState(symbol);
  const base = state.lastPrice;
  const spreadBps = randomBetween(4, 22);
  const volatilityPct = randomBetween(0.3, 2.8);
  const bid = base * (1 - spreadBps / 20000);
  const ask = base * (1 + spreadBps / 20000);
  const support = base * (1 - randomBetween(0.002, 0.008));
  const resistance = base * (1 + randomBetween(0.002, 0.009));
  const rsi = randomBetween(18, 84);
  const emaFast = base * (1 + state.drift / 200);
  const emaSlow = base * (1 + state.drift / 300);
  const vwap = base * (1 + randomBetween(-0.002, 0.002));
  const range = base * randomBetween(0.004, 0.02);

  return {
    symbol,
    timestamp: new Date().toISOString(),
    price: base,
    bid,
    ask,
    spreadBps,
    volume: randomBetween(12, 95),
    volatilityPct,
    indicators: {
      rsi,
      macd: randomBetween(-2.5, 2.5),
      macdSignal: randomBetween(-2, 2),
      emaFast,
      emaSlow,
      vwap,
      support,
      resistance,
      bollingerUpper: base + range,
      bollingerLower: base - range,
      trendScore: Math.max(-1, Math.min(1, state.drift + randomBetween(-0.2, 0.2))),
    },
    candlestickPattern: rsi > 65 ? "bearish" : rsi < 35 ? "bullish" : "neutral",
    newsRiskHigh: Math.random() < 0.08,
    dataDelayMs: randomBetween(80, 1800),
    liquidityScore: randomBetween(22, 95),
  };
}

export function generateHistoricalSnapshots(
  symbol: string,
  count: number,
): MarketSnapshot[] {
  return Array.from({ length: count }, () => generateMarketSnapshot(symbol));
}
