import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Play, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Briefing } from "@/types/briefing";
import { usePollAudio } from "@/hooks/useBriefing";
import { useBriefingContext } from "@/contexts/BriefingContext";

interface BriefingCardProps {
  briefing: Briefing;
  hasListened: boolean;
  onPlay: () => void;
}

export function BriefingCard({ briefing, hasListened, onPlay }: BriefingCardProps) {
  // Poll for audio if not yet available
  const { audioUrl, polling } = usePollAudio(
    briefing.audio_url ? null : briefing.id
  );
  const { setBriefing } = useBriefingContext();

  // Update briefing with audio URL when it arrives
  React.useEffect(() => {
    if (audioUrl && !briefing.audio_url) {
      setBriefing({ ...briefing, audio_url: audioUrl });
    }
  }, [audioUrl, briefing, setBriefing]);

  const hasAudio = !!(briefing.audio_url || audioUrl);

  // Collapse to minimal row if already listened
  if (hasListened) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
        <Check className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Briefing heard</span>
      </div>
    );
  }

  const segmentCount = briefing.segments?.length || 0;
  const durationMin = briefing.audio_duration_seconds
    ? Math.ceil(briefing.audio_duration_seconds / 60)
    : 3;

  // Teaser: first segment headline
  const teaser = briefing.segments?.[0]?.headline || "Your personalised news briefing is ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold">Your Briefing</p>
                  <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                    {durationMin} min
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {segmentCount} {segmentCount === 1 ? "story" : "stories"} picked for you today
                </p>
                <p className="text-xs leading-relaxed line-clamp-1 text-muted-foreground/80">{teaser}</p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              disabled={!hasAudio && polling}
              className="flex-shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-3"
              onClick={onPlay}
            >
              {!hasAudio && polling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current mr-1" />
                  Listen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
