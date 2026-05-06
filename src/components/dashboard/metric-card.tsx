import { motion } from "framer-motion";

type MetricCardProps = {
  label: string;
  value: string;
  helpText?: string;
  tone?: "neutral" | "positive" | "negative";
};

export function MetricCard({
  label,
  value,
  helpText,
  tone = "neutral",
}: MetricCardProps) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-slate-100";

  return (
    <motion.div
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {helpText ? <p className="mt-2 text-xs text-slate-400">{helpText}</p> : null}
    </motion.div>
  );
}
