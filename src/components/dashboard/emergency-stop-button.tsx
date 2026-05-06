"use client";

import { motion } from "framer-motion";
import { AlertOctagon } from "lucide-react";

type EmergencyStopButtonProps = {
  onStop: () => Promise<void>;
  disabled?: boolean;
};

export function EmergencyStopButton({ onStop, disabled }: EmergencyStopButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={() => {
        void onStop();
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AlertOctagon size={16} />
      Emergency Stop
    </motion.button>
  );
}
