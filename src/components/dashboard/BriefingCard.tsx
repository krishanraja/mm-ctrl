import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Play, Check, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Briefing, BriefingSegment } from "@/types/briefing";
import { FRAMEWORK_TAG_CONFIG, BRIEFING_TYPES } from "@/types/briefing";
import { usePollAudio } from "@/hooks/useBriefing";
import { useBriefingContext } from "@/contexts/BriefingContext";

function RotatingHeadlines({ segments }: { segments: BriefingSegment[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (segments.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % segments.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [segments.length]);

  const headline = segments[index]?.headline;
  if (!headline) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="text-xs leading-relaxed line-clamp-2 text-muted-foreground/80"
      >
        {headline}
      </motion.p>
    </AnimatePresence>
  );
}

interface BriefingCardProps {
  briefing: Briefing;
  hasListened: boolean;
  onPlay: () => void;
  onCustomBriefing?: () => void;
  customBriefingCount?: number;
}

export function BriefingCard({
  briefing,
  hasListened,
  onPlay,
  onCustomBriefing,
  customBriefingCount = 0,
}: BriefingCardProps) {
  const { audioUrl, polling, exhausted, retry } = usePollAudio(
    briefing.audio_url ? null : briefing.id
  );
  const { setBriefing } = useBriefingContext();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (audioUrl && !briefing.audio_url) {
      setBriefing({ ...briefing, audio_url: audioUrl });
    }
  }, [audioUrl, briefing, setBriefing]);

  const hasAudio = !!(briefing.audio_url || audioUrl);
  const waitingForAudio = !hasAudio && (polling || !exhausted);

  const segmentCount = briefing.segments?.length || 0;
  const durationMin = briefing.audio_duration_seconds
    ? Math.ceil(briefing.audio_duration_seconds / 60)
    : 3;

  const briefingTypeConfig = BRIEFING_TYPES.find(t => t.type === (briefing.briefing_type || 'default'));
  const briefingLabel = briefingTypeConfig?.label || "Your Briefing";

  const teaser = briefing.segments?.[0]?.headline || "Your personalised news briefing is ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio className="w-3.5 h-3.5 text-accent" />
              </div>
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => setExpanded((prev) => !prev)}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold">{briefingLabel}</p>
                  <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0.5 whitespace-nowrap">
                    {durationMin} min
                  </Badge>
                  {hasListened && (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                  <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {segmentCount} {segmentCount === 1 ? "story" : "stories"} picked for you today
                </p>

                <AnimatePresence mode="wait">
                  {expanded ? (
                    <motion.div
                      key="expanded"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-1.5 mt-1 overflow-hidden"
                    >
                      {briefing.segments?.map((seg, i) => {
                        const tagConfig = FRAMEWORK_TAG_CONFIG[seg.framework_tag];
                        return (
                          <div key={i} className="flex items-start gap-2">
                            <span
                              className={cn(
                                "text-[8px] font-bold uppercase px-1 py-0.5 rounded border flex-shrink-0 mt-0.5 min-w-[80px] text-center",
                                tagConfig?.className || "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {tagConfig?.label || seg.framework_tag}
                            </span>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {seg.headline}
                            </p>
                          </div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {waitingForAudio && briefing.segments?.length > 0 ? (
                        <RotatingHeadlines segments={briefing.segments} />
                      ) : (
                        <p className="text-xs leading-relaxed line-clamp-2 text-muted-foreground/80">{teaser}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {hasAudio ? (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-3"
                  onClick={onPlay}
                >
                  <Play className="w-3 h-3 fill-current mr-1" />
                  Listen
                </Button>
              ) : exhausted ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-[11px]"
                  onClick={retry}
                >
                  Retry
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  className="relative bg-accent text-accent-foreground h-8 w-[72px] overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-foreground/15 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                  <span className="relative z-10 text-xs">Audio...</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bottom row: Custom Briefing button + custom briefing count */}
          {onCustomBriefing && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <button
                onClick={onCustomBriefing}
                className="flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Custom Briefing
              </button>
              {customBriefingCount > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  +{customBriefingCount} custom
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
