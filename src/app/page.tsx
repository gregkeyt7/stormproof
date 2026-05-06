"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Brain, CircleAlert, Shield } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { EmergencyStopButton } from "@/components/dashboard/emergency-stop-button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { SectionCard } from "@/components/dashboard/section-card";
import { TradeTable } from "@/components/dashboard/trade-table";
import { BacktestMetrics, DashboardSummary, TradeRecord } from "@/lib/types";

const defaultSummary: DashboardSummary = {
  accountBalance: 20,
  dailyPnl: 0,
  realizedPnl: 0,
  unrealizedPnl: 0,
  winRate: 0,
  drawdown: 0,
  strategyConfidence: 0,
  taxReserveAmount: 0,
  mode: "paper",
  emergencyStopActive: false,
  maxDailyLossPct: 3,
  maxDrawdownPct: 10,
  liveModeEligible: {
    allowed: false,
    reasons: ["Collect paper-trading history before enabling live mode."],
  },
  openTrades: [],
  closedTrades: [],
  equityCurve: [],
  strategyPerformance: [],
};

export default function HomePage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [status, setStatus] = useState<string>("Loading dashboard...");
  const [isTicking, setIsTicking] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtests, setBacktests] = useState<BacktestMetrics[]>([]);

  const refresh = async () => {
    const response = await fetch("/api/dashboard/summary");
    if (!response.ok) {
      throw new Error("Failed to load dashboard summary.");
    }
    const payload = (await response.json()) as DashboardSummary;
    setSummary(payload);
  };

  const onModeToggle = async (targetMode: "paper" | "live") => {
    const response = await fetch("/api/bot/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetMode }),
    });
    const payload = (await response.json()) as {
      message: string;
      summary: DashboardSummary;
    };
    setStatus(payload.message);
    setSummary(payload.summary);
  };

  const onEmergencyStop = async () => {
    const response = await fetch("/api/bot/emergency-stop", {
      method: "POST",
    });
    const payload = (await response.json()) as {
      message: string;
      summary: DashboardSummary;
    };
    setStatus(payload.message);
    setSummary(payload.summary);
  };

  const onEmergencyRelease = async () => {
    const response = await fetch("/api/bot/emergency-stop", {
      method: "DELETE",
    });
    const payload = (await response.json()) as {
      message: string;
      summary: DashboardSummary;
    };
    setStatus(payload.message);
    setSummary(payload.summary);
  };

  const runBotCycle = async () => {
    setIsTicking(true);
    try {
      const response = await fetch("/api/bot/tick", { method: "POST" });
      const payload = (await response.json()) as {
        message: string;
        summary: DashboardSummary;
      };
      setStatus(payload.message);
      setSummary(payload.summary);
    } finally {
      setIsTicking(false);
    }
  };

  const runBacktests = async () => {
    setIsBacktesting(true);
    try {
      const response = await fetch("/api/backtest/run", { method: "POST" });
      const payload = (await response.json()) as {
        message: string;
        results: BacktestMetrics[];
      };
      setBacktests(payload.results);
      setStatus(payload.message);
    } finally {
      setIsBacktesting(false);
    }
  };

  useEffect(() => {
    refresh()
      .then(() => setStatus("Dashboard ready. Paper mode is active by default."))
      .catch(() =>
        setStatus(
          "Dashboard loaded with in-memory state. Add PostgreSQL + Prisma migration for persistent storage.",
        ),
      );
  }, []);

  const openTrades: TradeRecord[] = useMemo(
    () => summary.openTrades.slice(0, 8),
    [summary.openTrades],
  );
  const closedTrades: TradeRecord[] = useMemo(
    () => summary.closedTrades.slice(0, 12),
    [summary.closedTrades],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Personal AI Trading System
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                RAYLIX TRADER™
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Capital-protection-first automation. No profit guarantees. No
                all-in behavior. Paper-first training with hard safety rails.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModeToggle
                mode={summary.mode}
                onChange={onModeToggle}
                disabled={summary.emergencyStopActive}
              />
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <EmergencyStopButton onStop={onEmergencyStop} />
                {summary.emergencyStopActive ? (
                  <button
                    type="button"
                    onClick={onEmergencyRelease}
                    className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                  >
                    Release Emergency Stop
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={runBotCycle}
                  disabled={isTicking}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTicking ? "Running..." : "Run Bot Cycle"}
                </button>
                <button
                  type="button"
                  onClick={runBacktests}
                  disabled={isBacktesting}
                  className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBacktesting ? "Backtesting..." : "Run Backtests"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
            <CircleAlert className="h-4 w-4 text-cyan-300" />
            <span>{status}</span>
          </div>
        </motion.header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Account Balance"
            value={`$${summary.accountBalance.toFixed(2)}`}
            helpText="Starting size can be as low as $20."
          />
          <MetricCard
            label="Daily P/L"
            value={`${summary.dailyPnl >= 0 ? "+" : ""}$${summary.dailyPnl.toFixed(2)}`}
            tone={summary.dailyPnl >= 0 ? "positive" : "negative"}
            helpText={`Max daily loss guard: ${summary.maxDailyLossPct.toFixed(1)}%`}
          />
          <MetricCard
            label="Win Rate"
            value={`${summary.winRate.toFixed(1)}%`}
            helpText="Tracks closed trades only."
          />
          <MetricCard
            label="Drawdown"
            value={`${summary.drawdown.toFixed(2)}%`}
            tone={
              summary.drawdown > summary.maxDrawdownPct * 0.6
                ? "negative"
                : "neutral"
            }
            helpText={`Hard stop at ${summary.maxDrawdownPct.toFixed(1)}%`}
          />
          <MetricCard
            label="AI Confidence"
            value={`${summary.strategyConfidence.toFixed(1)}%`}
            helpText="Derived from market brain + strategy consensus."
          />
          <MetricCard
            label="Tax Reserve"
            value={`$${summary.taxReserveAmount.toFixed(2)}`}
            helpText="Planning reserve only. Not tax filing."
          />
          <MetricCard
            label="Open Trades"
            value={summary.openTrades.length.toString()}
            helpText="Max open trades risk-limited."
          />
          <MetricCard
            label="Closed Trades"
            value={summary.closedTrades.length.toString()}
            helpText="Paper and live trade journal history."
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <SectionCard
            title="Core Mission"
            icon={<Shield className="h-4 w-4" />}
            description="Protect capital first, trade only high-probability setups, and switch back to paper if performance degrades."
          >
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Risk per trade: 1% default</li>
              <li>• Minimum reward:risk ratio: 2:1</li>
              <li>• Mandatory stop loss + take profit</li>
              <li>• No martingale, no doubling down, no revenge trading</li>
              <li>
                • Live mode locked until paper mode threshold is met (100 trades)
              </li>
            </ul>
          </SectionCard>

          <SectionCard
            title="AI Market Brain"
            icon={<Brain className="h-4 w-4" />}
            description="Classifies regime and applies no-trade safeguards in dangerous market conditions."
          >
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Trend, volatility, volume, RSI, MACD, VWAP checks</li>
              <li>• Flags: dangerous / high-opportunity / low-volume / volatile</li>
              <li>• Strategy confidence scoring before execution</li>
              <li>• News-risk and spread checks can block entries</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Live Mode Gate"
            icon={<Bot className="h-4 w-4" />}
            description="Live mode unlocks only after hard qualification checks pass."
          >
            <p
              className={`text-sm font-medium ${
                summary.liveModeEligible.allowed
                  ? "text-emerald-300"
                  : "text-amber-300"
              }`}
            >
              {summary.liveModeEligible.allowed
                ? "Eligible for live mode."
                : "Not eligible yet. Keep paper trading."}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {summary.liveModeEligible.reasons.slice(0, 4).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <SectionCard
          title="Settings Panel Snapshot"
          description="Current risk and allocation defaults that can be persisted in risk_settings and tax_reserves tables."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase text-slate-500">Risk per trade</p>
              <p className="mt-1 font-semibold text-slate-100">1% default</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase text-slate-500">Max daily loss</p>
              <p className="mt-1 font-semibold text-slate-100">
                {summary.maxDailyLossPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase text-slate-500">Max drawdown</p>
              <p className="mt-1 font-semibold text-slate-100">
                {summary.maxDrawdownPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              <p className="text-xs uppercase text-slate-500">Profit split</p>
              <p className="mt-1 font-semibold text-slate-100">25% tax / 50% reinvest / 25% withdraw</p>
            </div>
          </div>
        </SectionCard>

        <DashboardCharts
          equityCurve={summary.equityCurve}
          strategyPerformance={summary.strategyPerformance}
        />

        {backtests.length > 0 ? (
          <SectionCard
            title="Backtest Results"
            description="Strategies should pass here before continued paper validation."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {backtests.map((row) => (
                <div
                  key={row.strategy}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {row.strategy}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Trades: {row.tradeCount}
                  </p>
                  <p className="text-xs text-slate-400">
                    Win rate: {row.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    PF: {row.profitFactor.toFixed(2)} | DD:{" "}
                    {row.maxDrawdownPct.toFixed(2)}%
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      row.passed ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {row.passed ? "Passed" : "Needs optimization"}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-2">
          <TradeTable title="Open Trades" trades={openTrades} />
          <TradeTable title="Closed Trades" trades={closedTrades} />
        </section>
      </div>
    </main>
  );
}
