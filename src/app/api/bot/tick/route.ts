import { NextResponse } from "next/server";
import { runBotTick } from "@/lib/services/bot-orchestrator";
import { buildDashboardSummary } from "@/lib/state/runtime-store";

export async function POST() {
  const message = runBotTick("BTCUSDT");
  const summary = buildDashboardSummary();
  return NextResponse.json({ message, summary });
}
