import { NextResponse } from "next/server";
import { buildDashboardSummary } from "@/lib/state/runtime-store";

export async function GET() {
  const summary = buildDashboardSummary();
  return NextResponse.json(summary);
}
