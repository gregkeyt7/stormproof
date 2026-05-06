"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

type EquityPoint = {
  day: string;
  equity: number;
};

type StrategyPoint = {
  strategy: string;
  winRate: number;
  pnl: number;
};

type DashboardChartsProps = {
  equityCurve: EquityPoint[];
  strategyPerformance: StrategyPoint[];
};

export function DashboardCharts({ equityCurve, strategyPerformance }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Equity Curve</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="equity" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Strategy Performance</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategyPerformance}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
              <XAxis dataKey="strategy" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="winRate" fill="#818cf8" />
              <Bar dataKey="pnl" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
