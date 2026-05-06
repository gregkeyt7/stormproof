import { NextResponse } from "next/server";
import { summarizeTradeJournal } from "@/lib/engines/trade-journal-engine";
import { getStore } from "@/lib/state/runtime-store";

export async function GET() {
  const store = getStore();
  const summary = summarizeTradeJournal(store.closedTrades);
  return NextResponse.json(summary);
}
