import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, AlertTriangle, Compass, Sparkles, Lock } from "lucide-react";
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
  const hasContent = !loading && pains.length > 0;
  useRevealOnMount(containerRef, hasContent);

  // No pains yet → no card. Edge view's existing CTAs cover the cold-start
  // case, and showing an empty automate panel would just take up real estate.
  if (!hasContent) return null;

  const handleSeedTap = (seed: SkillSeed) => {
    if (!isPaidUser) {
      onUpgrade();
      return;
    }
    navigate("/context", { state: { seed } });
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
                Automate one of these
              </h3>
              {!isPaidUser && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">
                  Pro
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Turn a pain you've already told us about into a Claude skill.
            </p>
          </div>
        </div>
      </div>

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
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {!isPaidUser && (
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
