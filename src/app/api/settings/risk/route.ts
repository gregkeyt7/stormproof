import { z } from "zod";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/state/runtime-store";

const riskSchema = z.object({
  maxRiskPerTradePct: z.number().min(0.1).max(3),
  maxDailyLossPct: z.number().min(0.5).max(10),
  maxOpenTrades: z.number().int().min(1).max(5),
  maxDrawdownPct: z.number().min(2).max(30),
  minRewardRiskRatio: z.number().min(1.5).max(5),
  minConfidence: z.number().min(40).max(95),
  cooldownAfterConsecutiveLosses: z.number().int().min(1).max(10),
  maxTradesPerDay: z.number().int().min(1).max(20),
  maxSpreadBps: z.number().min(2).max(60),
  maxSlippageBps: z.number().min(1).max(60),
  minimumSafeBalance: z.number().min(10).max(5000),
});

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.riskSettings);
}

export async function POST(request: Request) {
  const payload = riskSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid risk settings." }, { status: 400 });
  }
  const store = getStore();
  store.riskSettings = payload.data;
  return NextResponse.json({ message: "Risk settings updated.", settings: store.riskSettings });
}
