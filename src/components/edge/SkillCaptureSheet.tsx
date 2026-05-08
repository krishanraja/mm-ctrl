import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, MessageSquare, Loader2, Send, Zap } from "lucide-react";
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
import { TranscriptReviewPanel } from "@/components/voice/TranscriptReviewPanel";
import { cn } from "@/lib/utils";

interface SkillCaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transcript: string) => void;
  isGenerating: boolean;
  generationError: string | null;
}

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
}: SkillCaptureSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 max-h-[85vh] overflow-y-auto">
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
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
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
}: {
  onClose: () => void;
  onSubmit: (transcript: string) => void;
  isGenerating: boolean;
  generationError: string | null;
}) {
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [textInput, setTextInput] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [editReviewText, setEditReviewText] = useState("");

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
    if (inputText) onSubmit(inputText);
  }, [inputText, onSubmit]);

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
          <h3 className="text-lg font-bold text-foreground">Describe your workflow</h3>
          <p className="text-xs text-muted-foreground">
            What do you do every week that you wish AI could help with?
          </p>
        </div>
      </div>

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
