import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, MessageSquare, Loader2, Send, Zap, Sparkles, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVoice } from "@/hooks/useVoice";
import { useUserPains } from "@/hooks/useUserPains";
import { TranscriptReviewPanel } from "@/components/voice/TranscriptReviewPanel";
import { cn } from "@/lib/utils";
import type { SkillSeed } from "@/types/skill";

interface SkillCaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transcript: string, seed?: SkillSeed | null) => void;
  isGenerating: boolean;
  generationError: string | null;
  /**
   * Optional seed passed from an entry point (Edge view chip, Memory blocker,
   * Briefing decision_trigger). When present, the sheet skips the picker and
   * shows the seed banner + a pre-populated text scaffold so the user only
   * has to add the steps they follow.
   */
  initialSeed?: SkillSeed | null;
}

/**
 * Curated examples for users who arrive without a seed and don't know what
 * makes a good skill candidate. Tapping pre-fills the text input.
 */
const SKILL_EXAMPLES: Array<{ label: string; scaffold: string }> = [
  {
    label: "Monday board update",
    scaffold:
      'Every Monday I take the sales team Slack updates and turn them into a board update. The format is exec summary first, then pipeline changes, then risks. My investors hate bullet points and want flowing paragraphs. The trigger is: "draft the board update".',
  },
  {
    label: "Weekly hiring sync",
    scaffold:
      'Every Friday I prep notes for my hiring sync. I pull the open roles, this week\'s candidate movement, and any offers out. The format is: role, stage, next step, blocker. I want it scannable in under 30 seconds.',
  },
  {
    label: "RFP triage",
    scaffold:
      'Whenever a new RFP comes in I need to triage it: are we a fit, what\'s the timeline, who would own it, and a go/no-go recommendation. I always check for must-have requirements we can\'t meet first.',
  },
  {
    label: "Investor update",
    scaffold:
      'Every month I write an investor update. Format: TLDR, key metrics (revenue, burn, runway), wins this month, asks. I always include one specific ask at the end.',
  },
];

type InputMode = "voice" | "text";
type CaptureState = "idle" | "recording" | "transcribing";

/**
 * Bottom sheet (mobile) / dialog (desktop) for capturing a workflow
 * description. Voice or text input. On submit, the parent calls
 * useSkillExport.generateSkill and (on success) opens SkillPreviewSheet.
 */
export function SkillCaptureSheet({
  isOpen,
  onClose,
  onSubmit,
  isGenerating,
  generationError,
  initialSeed,
}: SkillCaptureSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Describe your workflow</SheetTitle>
            <SheetDescription>
              Speak or type the workflow you want to turn into an Agent Skill.
            </SheetDescription>
          </SheetHeader>
          <CaptureContent
            onClose={onClose}
            onSubmit={onSubmit}
            isGenerating={isGenerating}
            generationError={generationError}
            initialSeed={initialSeed}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Describe your workflow</DialogTitle>
          <DialogDescription>
            Speak or type the workflow you want to turn into an Agent Skill.
          </DialogDescription>
        </DialogHeader>
        <CaptureContent
          onClose={onClose}
          onSubmit={onSubmit}
          isGenerating={isGenerating}
          generationError={generationError}
          initialSeed={initialSeed}
        />
      </DialogContent>
    </Dialog>
  );
}

function CaptureContent({
  onClose,
  onSubmit,
  isGenerating,
  generationError,
  initialSeed,
}: {
  onClose: () => void;
  onSubmit: (transcript: string, seed?: SkillSeed | null) => void;
  isGenerating: boolean;
  generationError: string | null;
  initialSeed?: SkillSeed | null;
}) {
  // When the user arrives with a pre-anchored pain, default to text mode +
  // pre-populate a scaffold so they only have to fill in the steps. Voice is
  // still one tap away. With no seed, voice stays the default (existing UX).
  const [inputMode, setInputMode] = useState<InputMode>(initialSeed ? "text" : "voice");
  const [textInput, setTextInput] = useState<string>(() =>
    initialSeed ? scaffoldForSeed(initialSeed) : "",
  );
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [editReviewText, setEditReviewText] = useState("");
  const [activeSeed, setActiveSeed] = useState<SkillSeed | null>(initialSeed ?? null);

  const { pains, loading: painsLoading } = useUserPains(5);

  // If the parent re-opens the sheet with a different seed (e.g. user
  // navigates to /context twice from different entry points), refresh the
  // scaffold without dropping their typed content if they haven't seeded yet.
  useEffect(() => {
    if (!initialSeed) return;
    if (activeSeed?.text === initialSeed.text && activeSeed?.kind === initialSeed.kind) return;
    setActiveSeed(initialSeed);
    setInputMode("text");
    setTextInput(scaffoldForSeed(initialSeed));
    setVoiceTranscript(null);
  }, [initialSeed, activeSeed?.text, activeSeed?.kind]);

  const visiblePains = useMemo(() => {
    // Drop the currently-anchored seed from the picker so it doesn't show up
    // as a chip the user has already accepted.
    if (!activeSeed) return pains;
    return pains.filter(
      (p) => !(p.text === activeSeed.text && p.kind === activeSeed.kind),
    );
  }, [pains, activeSeed]);

  const handlePickPain = useCallback((seed: SkillSeed) => {
    setActiveSeed(seed);
    setInputMode("text");
    setTextInput(scaffoldForSeed(seed));
    setVoiceTranscript(null);
  }, []);

  const handleClearSeed = useCallback(() => {
    setActiveSeed(null);
    setTextInput("");
  }, []);

  const handleExample = useCallback((scaffold: string, label: string) => {
    setActiveSeed({ kind: "example", text: scaffold, label });
    setInputMode("text");
    setTextInput(scaffold);
    setVoiceTranscript(null);
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setVoiceTranscript(text);
    setCaptureState("idle");
  }, []);

  const {
    isRecording,
    isProcessing: isTranscribing,
    duration,
    browserCaptionPreview,
    pendingReview,
    confirmPendingTranscript,
    dismissPendingReview,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoice({
    maxDuration: 300,
    deferTranscriptCallback: true,
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    if (pendingReview) {
      setEditReviewText(pendingReview.transcript);
      setCaptureState("idle");
    }
  }, [pendingReview]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setCaptureState("transcribing");
    } else {
      setVoiceTranscript(null);
      resetRecording();
      startRecording();
      setCaptureState("recording");
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleConfirmVoiceReview = useCallback(async () => {
    await confirmPendingTranscript(editReviewText);
  }, [confirmPendingTranscript, editReviewText]);

  const inputText = inputMode === "voice" ? voiceTranscript : textInput.trim();
  const canSubmit = !!inputText && inputText.length >= 20 && !isGenerating;

  const handleSubmit = useCallback(() => {
    if (!inputText) return;
    // "example" seeds are scaffolds, not real pains from the leader's profile.
    // We forward them as-is so the LLM benefits from the anchoring, but they
    // don't carry fact_id / decision_id.
    onSubmit(inputText, activeSeed);
  }, [inputText, activeSeed, onSubmit]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
          <Zap className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {activeSeed ? "Automate this pain" : "Describe your workflow"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {activeSeed
              ? "Add the steps you follow today and we'll turn it into a skill that triggers automatically."
              : "What do you do every week that you wish AI could help with?"}
          </p>
        </div>
      </div>

      {/* Active seed banner — shown when arriving from an entry point or
          after the user picked a pain from the chip row below. */}
      <AnimatePresence>
        {activeSeed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              "rounded-xl border p-3 flex items-start gap-2.5",
              seedTone(activeSeed.kind),
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {activeSeed.kind === "example" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-medium opacity-70">
                {seedKindLabel(activeSeed.kind)}
              </p>
              <p className="text-sm text-foreground leading-snug mt-0.5">
                {activeSeed.text}
              </p>
            </div>
            <button
              onClick={handleClearSeed}
              aria-label="Clear seed"
              className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pain picker — only when there's no active seed yet AND the user has
          declared blockers/decisions worth pulling from. Keeps the sheet
          focused for arrivals from an entry point. */}
      {!activeSeed && !painsLoading && visiblePains.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Or start from a pain you've already told us about
          </p>
          <div className="flex flex-wrap gap-1.5">
            {visiblePains.map((pain, i) => (
              <button
                key={`${pain.kind}-${pain.fact_id ?? pain.decision_id ?? i}`}
                onClick={() => handlePickPain(pain)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors text-left max-w-full",
                  pain.kind === "blocker"
                    ? "border-orange-200/60 bg-orange-50/40 text-orange-700 hover:bg-orange-50"
                    : "border-blue-200/60 bg-blue-50/40 text-blue-700 hover:bg-blue-50",
                )}
                title={pain.text}
              >
                <span className="line-clamp-1">{pain.label ?? pain.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Curated examples — fallback anchor when the user hasn't told us
          about any blockers/decisions yet. Hidden once an active seed is set. */}
      {!activeSeed && (!visiblePains.length || painsLoading) && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Need ideas? Try one of these
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex.scaffold, ex.label)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary/40 text-foreground hover:bg-secondary transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice input */}
      <AnimatePresence mode="wait">
        {inputMode === "voice" && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Tap the mic and walk us through the steps. Mention what triggers it,
              the format you want, and any rules that always apply. 2 to 5 minutes is plenty.
            </p>

            <div className="flex flex-col items-center gap-3">
              <motion.button
                onClick={handleVoiceToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isTranscribing || isGenerating}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors",
                  isRecording
                    ? "bg-destructive shadow-destructive/25"
                    : "bg-accent shadow-accent/25",
                  (isTranscribing || isGenerating) && "opacity-50 cursor-not-allowed",
                )}
              >
                {isRecording ? (
                  <MicOff className="w-7 h-7 text-white" />
                ) : (
                  <Mic className="w-7 h-7 text-white" />
                )}
              </motion.button>

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatTime(duration)}
                  </span>
                  <p className="text-xs text-muted-foreground/50">Tap to stop recording</p>
                </motion.div>
              )}

              {isTranscribing && (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transcribing...
                  </div>
                </div>
              )}

              {isRecording && browserCaptionPreview ? (
                <p className="text-xs text-muted-foreground/70 text-center italic max-w-full">
                  Live caption (approx.): {browserCaptionPreview}
                </p>
              ) : null}

              {pendingReview && !isRecording && !isTranscribing && (
                <TranscriptReviewPanel
                  transcript={pendingReview.transcript}
                  rawTranscript={pendingReview.rawTranscript}
                  refined={pendingReview.refined}
                  editedText={editReviewText}
                  onEditedTextChange={setEditReviewText}
                  onConfirm={handleConfirmVoiceReview}
                  onDismiss={() => {
                    dismissPendingReview();
                    setVoiceTranscript(null);
                  }}
                  confirmLabel="Use this transcript"
                  className="w-full"
                />
              )}

              {voiceTranscript && !isRecording && !isTranscribing && !pendingReview && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-xl bg-foreground/5 border border-foreground/10 p-3"
                >
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Your description:
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {voiceTranscript}
                  </p>
                </motion.div>
              )}

              {!isRecording && !isTranscribing && !voiceTranscript && !pendingReview && (
                <p className="text-xs text-muted-foreground/50">
                  Tap to speak (up to 5 minutes)
                </p>
              )}
            </div>

            <button
              onClick={() => setInputMode("text")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mx-auto"
            >
              <MessageSquare className="w-3 h-3" />
              Type instead
            </button>
          </motion.div>
        )}

        {inputMode === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Describe a workflow you do at least weekly. Include what triggers it,
              the steps you follow, and the format you want the output in.
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={'e.g. "Every Monday I take my sales team Slack updates and turn them into a board update. Format is exec summary first, then pipeline, then risks. My investors hate bullet points."'}
              autoFocus
              rows={6}
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-foreground/5 border border-foreground/10",
                "text-foreground placeholder:text-foreground/30",
                "focus:outline-none focus:ring-2 focus:ring-accent/30",
                "resize-none text-sm",
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/70">
                {textInput.trim().length}/20 characters minimum
              </p>
              <button
                onClick={() => {
                  setInputMode("voice");
                  setTextInput("");
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <Mic className="w-3 h-3" />
                Switch to voice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / generating state */}
      {generationError && (
        <p className="text-sm text-destructive text-center">{generationError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={onClose}
          variant="ghost"
          className="flex-1 text-muted-foreground"
          disabled={isGenerating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Generate Skill
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scaffoldForSeed(seed: SkillSeed): string {
  // For "example" seeds the scaffold IS the full starter text — just return it.
  if (seed.kind === "example") return seed.text;

  // For real pains, build a prompt the user can fill in. We frame it as
  // open-ended ("walk me through...") because the LLM only generates a useful
  // skill when the leader describes their actual procedure, not just the pain.
  const lead =
    seed.kind === "blocker"
      ? `One thing I keep getting stuck on: ${seed.text}`
      : seed.kind === "decision"
      ? `A decision I keep wrestling with: ${seed.text}`
      : seed.kind === "mission"
      ? `A priority I work on weekly: ${seed.text}`
      : seed.kind === "briefing_segment"
      ? `A briefing flagged this as a decision trigger for me: ${seed.text}`
      : seed.text;

  return [
    lead,
    ``,
    `Here is how I currently handle it:`,
    `[add the steps you follow today]`,
    ``,
    `The format / output I want:`,
    `[describe the shape - paragraphs, bullets, sections, length]`,
  ].join("\n");
}

function seedKindLabel(kind: SkillSeed["kind"]): string {
  switch (kind) {
    case "blocker": return "From your blockers";
    case "decision": return "From your active decisions";
    case "mission": return "From your missions";
    case "briefing_segment": return "From a briefing decision trigger";
    case "example": return "Starter example";
    default: return "Anchored pain";
  }
}

function seedTone(kind: SkillSeed["kind"]): string {
  switch (kind) {
    case "blocker":
      return "border-orange-200/60 bg-orange-50/50 text-orange-900";
    case "decision":
    case "briefing_segment":
      return "border-blue-200/60 bg-blue-50/50 text-blue-900";
    case "mission":
      return "border-emerald-200/60 bg-emerald-50/50 text-emerald-900";
    case "example":
    default:
      return "border-accent/20 bg-accent/5 text-foreground";
  }
}
