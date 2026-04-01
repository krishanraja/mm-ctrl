import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAMEWORK_TAG_CONFIG } from "@/types/briefing";
import type { BriefingSegment, FrameworkTag } from "@/types/briefing";

interface SegmentCardProps {
  segment: BriefingSegment;
  index: number;
  isActive: boolean;
  onFeedback: (reaction: "useful" | "not_useful") => void;
}

export function SegmentCard({ segment, index, isActive, onFeedback }: SegmentCardProps) {
  const [feedback, setFeedback] = useState<"useful" | "not_useful" | null>(null);
  const tagConfig = FRAMEWORK_TAG_CONFIG[segment.framework_tag as FrameworkTag];

  const handleFeedback = (reaction: "useful" | "not_useful") => {
    if (feedback) return; // Already submitted
    setFeedback(reaction);
    onFeedback(reaction);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isActive && "border-l-2 border-l-accent shadow-sm"
      )}
    >
      <CardContent className="p-4 space-y-2">
        {/* Framework tag */}
        {tagConfig && (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium border", tagConfig.className)}
          >
            {tagConfig.label}
          </Badge>
        )}

        {/* Headline */}
        <p className="text-sm font-semibold leading-snug">{segment.headline}</p>

        {/* Analysis */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {segment.analysis}
        </p>

        {/* Feedback */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleFeedback("useful")}
            disabled={feedback !== null}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "useful"
                ? "text-accent bg-accent/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("not_useful")}
            disabled={feedback !== null}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "not_useful"
                ? "text-muted-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          {segment.source && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {segment.source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
