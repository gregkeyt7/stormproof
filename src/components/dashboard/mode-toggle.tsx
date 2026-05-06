"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { TradingMode } from "@/lib/types";

type ModeToggleProps = {
  mode: TradingMode;
  onChange: (targetMode: TradingMode) => Promise<void>;
  disabled?: boolean;
};

export function ModeToggle({ mode, onChange, disabled = false }: ModeToggleProps) {
  const isPaper = mode === "paper";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trading mode</p>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          {isPaper ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span>{isPaper ? "Paper mode active" : "Live mode active"}</span>
        </div>
      </div>
      <button
        onClick={() => {
          void onChange(isPaper ? "live" : "paper");
        }}
        disabled={disabled}
        className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
      >
        {isPaper ? "Request Live Mode" : "Return to Paper Mode"}
      </button>
      <p className="mt-3 text-xs text-slate-400">
        Live mode requires emergency stop, API keys, configured risk settings, and minimum paper performance.
      </p>
    </div>
  );
}
