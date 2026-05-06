import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { TradeRecord } from "@/lib/types";

type TradeTableProps = {
  title: string;
  trades: TradeRecord[];
};

export function TradeTable({ title, trades }: TradeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">{title}</div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-2">Pair</th>
              <th className="px-4 py-2">Strategy</th>
              <th className="px-4 py-2">Mode</th>
              <th className="px-4 py-2">R:R</th>
              <th className="px-4 py-2">Result</th>
              <th className="px-4 py-2">P/L</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                  No trades yet.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="border-t border-slate-900">
                  <td className="px-4 py-2 text-slate-200">{trade.symbol}</td>
                  <td className="px-4 py-2 text-slate-300">{trade.strategy}</td>
                  <td className="px-4 py-2 text-slate-300">{trade.mode}</td>
                  <td className="px-4 py-2 text-slate-300">{trade.rewardRiskRatio.toFixed(2)}:1</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        trade.result === "WIN"
                          ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300"
                          : trade.result === "LOSS"
                            ? "rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-300"
                            : "rounded-full bg-slate-600/30 px-2 py-1 text-xs text-slate-300"
                      }
                    >
                      {trade.result}
                    </span>
                  </td>
                  <td className={trade.realizedPnl >= 0 ? "px-4 py-2 text-emerald-300" : "px-4 py-2 text-rose-300"}>
                    {formatCurrency(trade.realizedPnl)} ({formatPercent(trade.realizedPnl / Math.max(trade.riskAmount, 1))})
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
