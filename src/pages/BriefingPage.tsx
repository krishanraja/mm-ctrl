import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Sparkles, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import {
  BriefingSheet,
  MiniPlayer,
  CustomBriefingSheet,
} from "@/components/briefing";
import { BottomNav } from "@/components/memory-web/BottomNav";
import { AppHeader } from "@/components/memory-web/AppHeader";
import {
  useTodaysBriefing,
  useGenerateBriefing,
  useAutoGenerateBriefing,
} from "@/hooks/useBriefing";
import { useBriefingContext } from "@/contexts/BriefingContext";
import { useMemoryWeb } from "@/hooks/useMemoryWeb";
import { BRIEFING_TYPES } from "@/types/briefing";
import type { Briefing, BriefingType } from "@/types/briefing";

function BriefingPage() {
  const {
    briefing: defaultBriefing,
    briefings,
    customBriefings,
    loading,
    refetch,
  } = useTodaysBriefing();
  const { facts } = useMemoryWeb();
  const hasData = facts.length > 0;
  const { generating: autoGenerating, phase: autoPhase } =
    useAutoGenerateBriefing(defaultBriefing, loading, hasData, refetch);
  const { generate, generating, phase } = useGenerateBriefing();
  const { setBriefing, setSheetOpen, playback } = useBriefingContext();
  const [customSheetOpen, setCustomSheetOpen] = useState(false);

  // Sync default briefing into context
  useEffect(() => {
    if (defaultBriefing) setBriefing(defaultBriefing);
  }, [defaultBriefing, setBriefing]);

  const handlePlayBriefing = (b: Briefing) => {
    setBriefing(b);
    setSheetOpen(true);
  };

  const handleCustomGenerate = async (
    briefingType: BriefingType,
    customContext?: string
  ) => {
    const id = await generate(briefingType, customContext);
    if (id) {
      setCustomSheetOpen(false);
      await refetch();
    }
  };

  const isGenerating = generating || autoGenerating;
  const currentPhase = autoGenerating ? autoPhase : phase;

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 scrollbar-hide">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 py-4"
        >
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Radio className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Your Briefings
                </h1>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomSheetOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Custom
            </Button>
          </div>

          {/* Loading / auto-generating state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {/* Auto-generating default briefing */}
          {!loading && !defaultBriefing && isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/20 bg-accent/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-accent animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Preparing your briefing...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPhase === "scanning"
                      ? "Scanning today's news..."
                      : currentPhase === "personalising"
                      ? "Finding what matters to you..."
                      : "Almost ready..."}
                  </p>
                </div>
              </div>
              <motion.div
                className="mt-3 h-1 rounded-full bg-accent/20 overflow-hidden"
              >
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: "5%" }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 20, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Default briefing card */}
          {!loading && defaultBriefing && (
            <BriefingCard
              briefing={defaultBriefing}
              hasListened={playback.hasListened}
              onPlay={() => handlePlayBriefing(defaultBriefing)}
              onCustomBriefing={() => setCustomSheetOpen(true)}
              customBriefingCount={customBriefings.length}
            />
          )}

          {/* Custom briefings today */}
          {customBriefings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Custom Briefings
              </p>
              {customBriefings.map((b) => {
                const typeConfig = BRIEFING_TYPES.find(
                  (t) => t.type === b.briefing_type
                );
                const durationMin = b.audio_duration_seconds
                  ? Math.ceil(b.audio_duration_seconds / 60)
                  : 3;
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-accent/30 transition-colors"
                      onClick={() => handlePlayBriefing(b)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Play className="w-3.5 h-3.5 text-accent fill-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {typeConfig?.label || b.briefing_type}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal px-1.5 py-0"
                            >
                              {durationMin} min
                            </Badge>
                          </div>
                          {b.custom_context && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">
                              {b.custom_context}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty state when no data yet */}
          {!loading && !hasData && !defaultBriefing && (
            <div className="text-center py-12">
              <Radio className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Tell us about yourself first
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Once you share your role and goals, we will generate your
                personalised daily briefing
              </p>
            </div>
          )}
        </motion.div>
      </main>

      <MiniPlayer />
      <BottomNav />
      <BriefingSheet />
      <CustomBriefingSheet
        isOpen={customSheetOpen}
        onClose={() => setCustomSheetOpen(false)}
        onGenerate={handleCustomGenerate}
        isGenerating={generating}
      />
    </div>
  );
}

export default BriefingPage;
