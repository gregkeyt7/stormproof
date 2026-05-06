import { z } from "zod";
import { NextResponse } from "next/server";
import { requestModeChange } from "@/lib/services/bot-orchestrator";
import { buildDashboardSummary } from "@/lib/state/runtime-store";

const bodySchema = z.object({
  targetMode: z.enum(["paper", "live"]),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid mode payload." },
      { status: 400 },
    );
  }

  const message = requestModeChange(parsed.data.targetMode);
  const summary = buildDashboardSummary();
  return NextResponse.json({ message, summary });
}
