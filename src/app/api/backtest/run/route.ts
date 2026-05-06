import { NextResponse } from "next/server";
import { runBacktestsForAllStrategies } from "@/lib/services/bot-orchestrator";

export async function POST() {
  const results = runBacktestsForAllStrategies();
  return NextResponse.json({
    message: "Backtests completed on historical mock dataset.",
    results,
  });
}
