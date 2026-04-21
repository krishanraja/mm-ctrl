import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface TranscriptReviewPanelProps {
  /** Final text (may be refined); initial value for the editor */
  transcript: string
  /** Unrefined ASR output when refinement ran */
  rawTranscript?: string
  refined?: boolean
  editedText: string
  onEditedTextChange: (value: string) => void
  onConfirm: () => void
  onDismiss?: () => void
  confirmLabel?: string
  className?: string
}

/**
 * Editable transcript step with optional "original" line for trust when GPT refinement ran.
 */
export function TranscriptReviewPanel({
  transcript,
  rawTranscript,
  refined,
  editedText,
  onEditedTextChange,
  onConfirm,
  onDismiss,
  confirmLabel = 'Use this transcript',
  className,
}: TranscriptReviewPanelProps) {
  const [showOriginal, setShowOriginal] = React.useState(false)
  const hasOriginal =
    refined &&
    rawTranscript != null &&
    rawTranscript.trim().length > 0 &&
    rawTranscript.trim() !== transcript.trim()

  return (
    <div className={cn('space-y-3 rounded-xl border border-border/60 bg-card/40 p-4', className)}>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Review transcript</p>
        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
          Edit if anything looks wrong. What you confirm is what we use.
        </p>
      </div>

      <Textarea
        value={editedText}
        onChange={(e) => onEditedTextChange(e.target.value)}
        rows={6}
        className="text-sm resize-y min-h-[120px] bg-background/80"
        aria-label="Edit transcript before continuing"
      />

      {hasOriginal && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showOriginal ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Original transcription (before cleanup)
          </button>
          {showOriginal && (
            <p className="text-xs text-muted-foreground/90 whitespace-pre-wrap rounded-md bg-muted/40 p-2 border border-border/40">
              {rawTranscript}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" onClick={onConfirm} className="flex-1 sm:flex-none">
          {confirmLabel}
        </Button>
        {onDismiss && (
          <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
