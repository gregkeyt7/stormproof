import { z } from "zod";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/state/runtime-store";

const profitSchema = z.object({
  dailyGoalUsd: z.number().min(0),
  weeklyGoalUsd: z.number().min(0),
  taxReservePct: z.number().min(0).max(100),
  reinvestPct: z.number().min(0).max(100),
  withdrawalPct: z.number().min(0).max(100),
});

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.profitSettings);
}

export async function POST(request: Request) {
  const payload = profitSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid profit settings." }, { status: 400 });
  }
  const total = payload.data.taxReservePct + payload.data.reinvestPct + payload.data.withdrawalPct;
  if (Math.abs(total - 100) > 0.001) {
    return NextResponse.json(
      { message: "Tax reserve + reinvest + withdrawal percentages must sum to 100." },
      { status: 400 },
    );
  }
  const store = getStore();
  store.profitSettings = payload.data;
  return NextResponse.json({ message: "Profit settings updated.", settings: store.profitSettings });
}
