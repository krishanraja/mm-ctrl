import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Play, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Briefing } from "@/types/briefing";

interface BriefingCardProps {
  briefing: Briefing;
  hasListened: boolean;
  onPlay: () => void;
}

export function BriefingCard({ briefing, hasListened, onPlay }: BriefingCardProps) {
  // Collapse to minimal row if already listened
  if (hasListened) {
    return (
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        animate={{ opacity: 0.6, height: "auto" }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50"
      >
        <Check className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Briefing heard</span>
      </motion.div>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-accent" />
              </div>
              <CardTitle className="text-base">Your Briefing</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-normal">
              {durationMin} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {segmentCount} {segmentCount === 1 ? "story" : "stories"} picked for you today
            </p>
            <p className="text-sm leading-relaxed line-clamp-2">{teaser}</p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={onPlay}
          >
            <Play className="w-3 h-3 mr-2 fill-current" />
            Listen Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
