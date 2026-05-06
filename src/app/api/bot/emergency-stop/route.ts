import { NextResponse } from "next/server";
import { setEmergencyStop } from "@/lib/services/bot-orchestrator";
import { buildDashboardSummary } from "@/lib/state/runtime-store";

export async function POST() {
  const message = setEmergencyStop(true);
  const summary = buildDashboardSummary();
  return NextResponse.json({ message, summary });
}

export async function DELETE() {
  const message = setEmergencyStop(false);
  const summary = buildDashboardSummary();
  return NextResponse.json({ message, summary });
}
