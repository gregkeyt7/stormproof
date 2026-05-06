import { NextResponse } from "next/server";
import { getStore } from "@/lib/state/runtime-store";
import { computeProfitAllocation } from "@/lib/engines/profit-manager";

export async function GET() {
  const store = getStore();
  const allocation = computeProfitAllocation(
    store.closedTrades,
    store.openTrades,
    store.profitSettings,
  );

  return NextResponse.json({
    taxReserveAmount: Number(allocation.taxReserveAmount.toFixed(2)),
    reinvestAmount: Number(allocation.reinvestAmount.toFixed(2)),
    withdrawalAmount: Number(allocation.withdrawalAmount.toFixed(2)),
    realizedProfit: Number(allocation.realizedProfit.toFixed(2)),
    unrealizedProfit: Number(allocation.unrealizedProfit.toFixed(2)),
  });
}
