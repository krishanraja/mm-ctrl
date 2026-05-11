import { Zap, ArrowRight, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillExportCardProps {
  isPaidUser: boolean;
  onClick: () => void;
  onUpgrade: () => void;
  className?: string;
}

/**
 * Entry-point card for the Agent Skill Builder on the Context Export page.
 * Edge Pro gated, same as the voice-driven custom export above it. Clicking
 * the CTA opens SkillCaptureSheet; clicking Upgrade opens the Stripe
 * checkout via useEdgeSubscription.subscribe.
 */
export function SkillExportCard({ isPaidUser, onClick, onUpgrade, className }: SkillExportCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-4",
      isPaidUser ? "border-accent/20 bg-accent/5" : "border-border bg-card",
      className,
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isPaidUser ? "bg-accent/10" : "bg-secondary",
        )}>
          {isPaidUser ? (
            <Zap className="h-5 w-5 text-accent" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Automate a weekly pain</span>
            {!isPaidUser && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">
                Pro
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Pick something you do every week and we'll turn it into an AI skill that triggers automatically.
          </p>

          {isPaidUser ? (
            <button
              onClick={onClick}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-accent bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              Start with a pain
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
