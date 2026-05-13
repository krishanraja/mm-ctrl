import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, AlertTriangle, Compass, Sparkles, Lock, Mic } from "lucide-react";
import { useUserPains } from "@/hooks/useUserPains";
import { useRevealOnMount } from "@/hooks/useRevealOnMount";
import { cn } from "@/lib/utils";
import type { SkillSeed } from "@/types/skill";

interface AutomatePainCardProps {
  isPaidUser: boolean;
  onUpgrade: () => void;
}

/**
 * Edge view entry point for the Skill Builder. Reflects the leader's declared
 * blockers + active decisions back as chips and lets them tap one to seed a
 * new skill. Hidden when the leader has no pains yet (briefing onboarding
 * picker covers that gap better than another empty state).
 *
 * Tap → navigate('/context', { state: { seed } }) where the ContextExport
 * page consumes the seed and auto-opens the SkillCaptureSheet pre-anchored.
 * This keeps a single source of truth for the sheet without overloading
 * BriefingContext or threading a global "openSkillBuilder" through the tree.
 */
export function AutomatePainCard({ isPaidUser, onUpgrade }: AutomatePainCardProps) {
  const navigate = useNavigate();
  const { pains, loading } = useUserPains(5);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPains = !loading && pains.length > 0;
  // Reveal the card whenever it's ready to render (with chips or empty-state).
  useRevealOnMount(containerRef, !loading);

  // While loading, render nothing to avoid layout shift.
  if (loading) return null;

  const handleSeedTap = (seed: SkillSeed) => {
    if (!isPaidUser) {
      onUpgrade();
      return;
    }
    navigate("/context", { state: { seed } });
  };

  const handleEmptyStateTap = () => {
    if (!isPaidUser) {
      onUpgrade();
      return;
    }
    // No seed: ContextExport will open the SkillCaptureSheet in pick-a-pain /
    // examples mode so the leader can voice their own pain from scratch.
    navigate("/context", { state: { openSkillBuilder: true } });
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "rounded-2xl border p-4 space-y-3",
        isPaidUser
          ? "border-accent/20 bg-gradient-to-br from-accent/5 via-card to-amber-500/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            isPaidUser
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
              : "bg-secondary",
          )}>
            {isPaidUser ? (
              <Zap className="w-4 h-4 text-amber-500" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Automate a recurring pain
              </h3>
              {!isPaidUser && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">
                  Pro
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              In about 60 seconds we'll turn it into a Claude skill that runs whenever you say the trigger.
            </p>
          </div>
        </div>
      </div>

      {hasPains ? (
        <div className="flex flex-wrap gap-1.5">
          {pains.map((pain, i) => {
            const Icon = pain.kind === "blocker" ? AlertTriangle : Compass;
            return (
              <button
                key={`${pain.kind}-${pain.fact_id ?? pain.decision_id ?? i}`}
                onClick={() => handleSeedTap(pain)}
                className={cn(
                  "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors max-w-full",
                  pain.kind === "blocker"
                    ? "border-orange-500/30 bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:text-orange-300"
                    : "border-blue-500/30 bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:text-blue-300",
                )}
                title={pain.text}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{pain.label ?? pain.text}</span>
                <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        // No declared pains yet: keep the entry point visible so the feature
        // is always discoverable. Tapping opens the capture sheet in
        // voice-first mode with no seed.
        <button
          onClick={handleEmptyStateTap}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed transition-colors text-left",
            isPaidUser
              ? "border-accent/30 hover:border-accent/50 hover:bg-accent/5"
              : "border-border hover:border-foreground/20 hover:bg-foreground/5",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              Voice a recurring pain
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Tap and describe something you do every week.
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </button>
      )}

      {!isPaidUser && hasPains && (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <Sparkles className="w-3 h-3" />
          Unlock with Edge Pro
        </button>
      )}
    </motion.div>
  );
}
