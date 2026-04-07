import { motion } from "framer-motion";
import {
  Radio,
  TrendingUp,
  Layers,
  Target,
  Briefcase,
  Mic,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BriefingType, BriefingTypeConfig } from "@/types/briefing";
import { BRIEFING_TYPES } from "@/types/briefing";

const ICON_MAP: Record<string, typeof Radio> = {
  Radio,
  TrendingUp,
  Layers,
  Target,
  Briefcase,
  Mic,
};

interface BriefingTypePickerProps {
  selected: BriefingType | null;
  onSelect: (type: BriefingType) => void;
  hasProAccess: boolean;
  onProGated?: () => void;
  layout?: "grid" | "horizontal";
}

export function BriefingTypePicker({
  selected,
  onSelect,
  hasProAccess,
  onProGated,
  layout = "grid",
}: BriefingTypePickerProps) {
  const handleSelect = (config: BriefingTypeConfig) => {
    if (config.isProOnly && !hasProAccess) {
      onProGated?.();
      return;
    }
    onSelect(config.type);
  };

  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-2 gap-2"
          : "flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      )}
    >
      {BRIEFING_TYPES.map((config, i) => {
        const Icon = ICON_MAP[config.icon] || Radio;
        const isSelected = selected === config.type;
        const isLocked = config.isProOnly && !hasProAccess;

        return (
          <motion.button
            key={config.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => handleSelect(config)}
            className={cn(
              "relative flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
              layout === "horizontal" && "min-w-[140px] flex-shrink-0",
              isSelected
                ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                : "border-border bg-card hover:border-accent/30 hover:bg-accent/[0.02]",
              isLocked && "opacity-70"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-accent/15" : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isSelected ? "text-accent" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    isSelected ? "text-accent" : "text-foreground"
                  )}
                >
                  {config.label}
                </p>
                {isLocked && (
                  <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                {config.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
