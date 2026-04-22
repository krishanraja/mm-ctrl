import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Radio, Sparkles, Play, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import {
  BriefingSheet,
  MiniPlayer,
  CustomBriefingSheet,
  VoiceSteerBar,
  InterestChipsRow,
  SuggestedInterestsCard,
} from "@/components/briefing";
import { InterestsSheet } from "@/components/briefing/InterestsSheet";
import { BottomNav } from "@/components/memory-web/BottomNav";
import { AppHeader } from "@/components/memory-web/AppHeader";
import {
  useTodaysBriefing,
  useGenerateBriefing,
  useAutoGenerateBriefing,
} from "@/hooks/useBriefing";
import { useBriefingContext } from "@/contexts/BriefingContext";
import { useMemoryWeb } from "@/hooks/useMemoryWeb";
import { useBriefingInterests } from "@/hooks/useBriefingInterests";
import { useSuggestedInterests } from "@/hooks/useSuggestedInterests";
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
  const {
    all: declaredInterests,
    loading: interestsLoading,
    remove: removeInterest,
    refetch: refetchInterests,
  } = useBriefingInterests();
  const {
    suggestions,
    loading: suggestionsLoading,
    accept: acceptSuggestion,
    dismiss: dismissSuggestion,
    acceptAll: acceptAllSuggestions,
    refetch: refetchSuggestions,
  } = useSuggestedInterests();

  // Mirror MobileMemoryDashboard: only auto-generate after the user has
  // declared (or we've inferred high-confidence) at least 3 interests so the
  // briefing isn't generic on the first visit.
  const hasDeclaredOrInferred = declaredInterests.length >= 3;

  const { generating: autoGenerating, phase: autoPhase } =
    useAutoGenerateBriefing(
      defaultBriefing,
      loading,
      hasData && hasDeclaredOrInferred,
      refetch,
    );
  const { generate, generating, phase } = useGenerateBriefing();
  const { setBriefing, setSheetOpen, playback } = useBriefingContext();
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [interestsSheetOpen, setInterestsSheetOpen] = useState(false);
  const [presetCustomPrompt, setPresetCustomPrompt] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (defaultBriefing) setBriefing(defaultBriefing);
  }, [defaultBriefing, setBriefing]);

  const handlePlayBriefing = (b: Briefing) => {
    setBriefing(b);
    setSheetOpen(true);
  };

  const [refreshingBriefing, setRefreshingBriefing] = useState(false);
  const handleRefreshBriefing = async () => {
    setRefreshingBriefing(true);
    try {
      await generate("default", undefined, { force: true });
      await refetch();
    } finally {
      setRefreshingBriefing(false);
    }
  };

  const handleCustomGenerate = async (
    briefingType: BriefingType,
    customContext?: string,
  ) => {
    const id = await generate(briefingType, customContext);
    if (id) {
      setCustomSheetOpen(false);
      setPresetCustomPrompt(null);
      await refetch();
    }
  };

  // Voice nudge that classifies as `request_custom` opens the custom sheet
  // pre-filled with the requested prompt so the user just confirms.
  const handleVoiceCustomRequest = (prompt: string) => {
    setPresetCustomPrompt(prompt);
    setCustomSheetOpen(true);
  };

  const handleNudgeApplied = async () => {
    await Promise.all([refetchInterests(), refetchSuggestions()]);
  };

  const isGenerating = generating || autoGenerating;
  const currentPhase = autoGenerating ? autoPhase : phase;

  // "Earlier this week" = briefings older than today's default that aren't
  // custom. We bucket by ISO date so timezones don't shuffle them around.
  const earlierBriefings = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return briefings.filter((b) => {
      if (b.briefing_type && b.briefing_type !== "default") return false;
      if (defaultBriefing && b.id === defaultBriefing.id) return false;
      const key = (b.created_at || "").slice(0, 10);
      return key && key !== todayKey;
    });
  }, [briefings, defaultBriefing]);

  const liveStatus = (() => {
    if (loading) return "Loading...";
    if (isGenerating) return "Personalising...";
    if (defaultBriefing) {
      const created = new Date(defaultBriefing.created_at);
      const minutesAgo = Math.max(
        1,
        Math.round((Date.now() - created.getTime()) / 60000),
      );
      if (minutesAgo < 60) return `Updated ${minutesAgo} min ago`;
      const hours = Math.round(minutesAgo / 60);
      return `Updated ${hours}h ago`;
    }
    return "Ready when you are";
  })();

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
          {/* 1. Header with live status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Radio className="w-4.5 h-4.5 text-accent" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  Your Briefing
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full",
                      isGenerating
                        ? "bg-amber-500 animate-pulse"
                        : defaultBriefing
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  {liveStatus}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInterestsSheetOpen(true)}
              className="gap-1 text-xs h-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tune
            </Button>
          </div>

          {/* 2. Hero card OR pre-personalisation OR cold-start */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : !hasData ? (
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
          ) : !hasDeclaredOrInferred &&
            !defaultBriefing &&
            !suggestionsLoading &&
            suggestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Pick a few topics first
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We need 3+ interests to make this feel like your
                    briefing.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setInterestsSheetOpen(true)}
                size="sm"
                className="w-full"
              >
                Choose what you want briefed on
              </Button>
            </motion.div>
          ) : !defaultBriefing && isGenerating ? (
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
                    Personalising your first briefing...
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
              <motion.div className="mt-3 h-1 rounded-full bg-accent/20 overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: "5%" }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 20, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          ) : defaultBriefing ? (
            <BriefingCard
              briefing={defaultBriefing}
              hasListened={playback.hasListened}
              onPlay={() => handlePlayBriefing(defaultBriefing)}
              onRefresh={handleRefreshBriefing}
              refreshing={refreshingBriefing}
              onCustomBriefing={() => setCustomSheetOpen(true)}
              customBriefingCount={customBriefings.length}
            />
          ) : null}

          {/* 3. Voice Steer bar — the hero CTA */}
          {hasData && (
            <VoiceSteerBar
              briefingId={defaultBriefing?.id ?? null}
              onCustomRequest={handleVoiceCustomRequest}
              onApplied={handleNudgeApplied}
            />
          )}

          {/* 4. Suggested interests (auto-inferred, conditional) */}
          <SuggestedInterestsCard
            suggestions={suggestions}
            loading={suggestionsLoading}
            onAccept={acceptSuggestion}
            onDismiss={dismissSuggestion}
            onAcceptAll={acceptAllSuggestions}
          />

          {/* 5. What's in this briefing — chip row */}
          {hasData && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  In this briefing
                </p>
                {declaredInterests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInterestsSheetOpen(true)}
                    className="text-[11px] text-accent hover:underline"
                  >
                    Manage
                  </button>
                )}
              </div>
              <InterestChipsRow
                interests={declaredInterests}
                loading={interestsLoading}
                onRemove={removeInterest}
                onAdd={() => setInterestsSheetOpen(true)}
                emptyHint="No interests yet — voice steer above or tap Tune."
              />
            </div>
          )}

          {/* 6. Custom briefings today */}
          {customBriefings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                Custom Briefings Today
              </p>
              {customBriefings.map((b) => {
                const typeConfig = BRIEFING_TYPES.find(
                  (t) => t.type === b.briefing_type,
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

          {/* 7. Earlier this week (collapsed) */}
          {earlierBriefings.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center justify-between w-full px-1"
              >
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Earlier this week ({earlierBriefings.length})
                </p>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-transform",
                    showHistory && "rotate-180",
                  )}
                />
              </button>
              {showHistory && (
                <div className="space-y-1.5">
                  {earlierBriefings.map((b) => {
                    const created = new Date(b.created_at);
                    const dayLabel = created.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const minutes = b.audio_duration_seconds
                      ? Math.ceil(b.audio_duration_seconds / 60)
                      : 3;
                    return (
                      <Card
                        key={b.id}
                        className="cursor-pointer hover:border-accent/30 transition-colors"
                        onClick={() => handlePlayBriefing(b)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {dayLabel}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {b.headline || `${minutes} min briefing`}
                            </p>
                          </div>
                          <Play className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 8. More options */}
          {hasData && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCustomSheetOpen(true)}
                className="text-[11px] text-muted-foreground hover:text-accent transition-colors"
              >
                More options →
              </button>
            </div>
          )}
        </motion.div>
      </main>

      <MiniPlayer />
      <BottomNav />
      <BriefingSheet />
      <CustomBriefingSheet
        isOpen={customSheetOpen}
        onClose={() => {
          setCustomSheetOpen(false);
          setPresetCustomPrompt(null);
        }}
        onGenerate={handleCustomGenerate}
        isGenerating={generating}
        initialContext={presetCustomPrompt ?? undefined}
      />
      <InterestsSheet
        open={interestsSheetOpen}
        onOpenChange={setInterestsSheetOpen}
        onSaved={() => {
          void refetchInterests();
          void refetchSuggestions();
        }}
      />
    </div>
  );
}

export default BriefingPage;
