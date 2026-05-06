import { ProfitSettings, TradeRecord } from "@/lib/types";

type ProfitAllocation = {
  realizedProfit: number;
  unrealizedProfit: number;
  taxReserveAmount: number;
  reinvestAmount: number;
  withdrawalAmount: number;
};

export function computeProfitAllocation(
  closedTrades: TradeRecord[],
  openTrades: TradeRecord[],
  settings: ProfitSettings,
): ProfitAllocation {
  const realizedProfit = closedTrades.reduce(
    (sum, trade) => sum + trade.realizedPnl,
    0,
  );
  const unrealizedProfit = openTrades.reduce(
    (sum, trade) => sum + trade.unrealizedPnl,
    0,
  );

  const positiveProfit = Math.max(0, realizedProfit);
  const taxReserveAmount = positiveProfit * (settings.taxReservePct / 100);
  const reinvestAmount = positiveProfit * (settings.reinvestPct / 100);
  const withdrawalAmount = positiveProfit * (settings.withdrawalPct / 100);

  return {
    realizedProfit,
    unrealizedProfit,
    taxReserveAmount,
    reinvestAmount,
    withdrawalAmount,
  };
}
