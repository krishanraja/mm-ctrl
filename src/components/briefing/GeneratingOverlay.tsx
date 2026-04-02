import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Filter, Mic } from "lucide-react";

type Phase = "idle" | "scanning" | "personalising" | "preparing";

interface GeneratingOverlayProps {
  phase: Phase;
  isVisible: boolean;
}

const PHASE_CONFIG: Record<Exclude<Phase, "idle">, { icon: typeof Radio; label: string }> = {
  scanning: {
    icon: Radio,
    label: "Scanning today's news...",
  },
  personalising: {
    icon: Filter,
    label: "Finding what matters to you...",
  },
  preparing: {
    icon: Mic,
    label: "Preparing your briefing...",
  },
};

export function GeneratingOverlay({ phase, isVisible }: GeneratingOverlayProps) {
  if (!isVisible || phase === "idle") return null;

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center gap-4 py-16"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"
        >
          <Icon className="w-6 h-6 text-accent" />
        </motion.div>
        <p className="text-sm text-muted-foreground">{config.label}</p>
      </motion.div>
    </AnimatePresence>
  );
}
