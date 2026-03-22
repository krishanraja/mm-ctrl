/**
 * LLMImportWizard Component
 *
 * 3-step bottom sheet wizard for importing memories from Claude/ChatGPT.
 * Step 1: Copy a prompt to paste into your LLM
 * Step 2: Paste the LLM's response
 * Step 3: Extract and import memories
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUserMemory } from '@/hooks/useUserMemory';
import { useQueryClient } from '@tanstack/react-query';
import { memoryKeys } from '@/hooks/useMemoryQueries';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

interface LLMImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (factsExtracted: number) => void;
}

type WizardStep = 'copy-prompt' | 'paste-response' | 'importing';

const EXTRACTION_PROMPT = `I'd like you to help me create a summary of everything you know about me from our conversations. Please write a natural-language summary covering these areas. Only include things you're confident about — skip any section where you don't have information.

**About Me**: My name, role, title, team, who I report to, and my professional background.

**My Business**: The company I work at, its industry, size, growth stage, and any relevant business context.

**My Goals**: My main objectives, quarterly priorities, success metrics, and what I'm working toward.

**My Challenges**: Obstacles I'm facing, time constraints, team challenges, organizational blockers, or things I've expressed frustration about.

**My Preferences**: How I prefer to communicate, make decisions, delegate, give/receive feedback, and my working style.

Please write this as a flowing narrative — a few paragraphs per section. Be specific with names, numbers, and details where you have them.`;

const STEPS: WizardStep[] = ['copy-prompt', 'paste-response', 'importing'];

export const LLMImportWizard: React.FC<LLMImportWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<WizardStep>('copy-prompt');
  const [pastedText, setPastedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ success: boolean; factsExtracted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { extractFromTranscript, isExtracting } = useUserMemory();
  const queryClient = useQueryClient();

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptics?.light?.();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EXTRACTION_PROMPT);
      setCopied(true);
      haptics?.light?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
      toast.error('Could not copy automatically — please select and copy the text');
    }
  }, []);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setError(null);
    setResult(null);

    try {
      const extractionResult = await extractFromTranscript(pastedText, undefined, 'markdown');

      if (extractionResult.success) {
        const count = extractionResult.facts_extracted || 0;
        setResult({ success: true, factsExtracted: count });
        queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
        haptics?.success?.();
        toast.success(`${count} memories extracted from your AI chat`);
      } else {
        setError(extractionResult.error || 'Failed to extract memories');
        haptics?.error?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      haptics?.error?.();
    }
  }, [pastedText, extractFromTranscript, queryClient]);

  const handleClose = useCallback(() => {
    setStep('copy-prompt');
    setPastedText('');
    setCopied(false);
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleDone = useCallback(() => {
    if (result) {
      onSuccess?.(result.factsExtracted);
    }
    handleClose();
  }, [result, onSuccess, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.8 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "h-[85vh] bg-background rounded-t-3xl",
              "border-t border-border shadow-2xl",
              "flex flex-col"
            )}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Progress bar */}
            <div className="w-full bg-secondary h-1">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Import from AI Chat</h2>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait">
                {/* Step 1: Copy Prompt */}
                {step === 'copy-prompt' && (
                  <motion.div
                    key="copy-prompt"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Step 1 of 3</p>
                      <h3 className="text-xl font-semibold text-foreground">Copy this prompt</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paste it into Claude or ChatGPT to get a summary of what they know about you.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="bg-secondary/50 rounded-xl p-4 text-sm leading-relaxed text-foreground/90 max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
                        {EXTRACTION_PROMPT}
                      </div>
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="outline"
                        className={cn(
                          "absolute top-2 right-2 border-0",
                          copied && "bg-green-500/10 text-green-600"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Paste Response */}
                {step === 'paste-response' && (
                  <motion.div
                    key="paste-response"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Step 2 of 3</p>
                      <h3 className="text-xl font-semibold text-foreground">Paste the response</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paste what Claude or ChatGPT replied with below.
                      </p>
                    </div>

                    <Textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste the AI's response here..."
                      rows={12}
                      className="resize-none font-mono text-sm"
                    />

                    <p className="text-xs text-muted-foreground text-right">
                      {pastedText.length.toLocaleString()} characters
                    </p>
                  </motion.div>
                )}

                {/* Step 3: Importing / Results */}
                {step === 'importing' && (
                  <motion.div
                    key="importing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center gap-6 py-12"
                  >
                    {/* Processing */}
                    {!result && !error && (
                      <>
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className={cn(
                              'w-20 h-20 rounded-full',
                              'bg-gradient-to-r from-accent via-primary to-accent',
                              'p-[2px]'
                            )}
                          >
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-accent" />
                            </div>
                          </motion.div>
                        </div>
                        <div className="text-center">
                          <p className="text-foreground font-medium">Extracting memories...</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            This only takes a moment
                          </p>
                        </div>
                      </>
                    )}

                    {/* Success */}
                    {result?.success && (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                          className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
                        >
                          <Check className="w-10 h-10 text-green-600" />
                        </motion.div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {result.factsExtracted} memories extracted
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your AI now knows more about you
                          </p>
                        </div>
                      </>
                    )}

                    {/* Error */}
                    {error && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <div className="text-center">
                          <p className="text-foreground font-medium">Something went wrong</p>
                          <p className="text-sm text-destructive mt-1">{error}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-border pb-safe">
              {step === 'copy-prompt' && (
                <Button onClick={() => setStep('paste-response')} className="w-full border-0">
                  Next
                </Button>
              )}

              {step === 'paste-response' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('copy-prompt')}
                    className="flex-1 border-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={pastedText.trim().length < 50}
                    className="flex-1 border-0"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Import Memories
                  </Button>
                </div>
              )}

              {step === 'importing' && result?.success && (
                <Button onClick={handleDone} className="w-full border-0">
                  Done
                </Button>
              )}

              {step === 'importing' && error && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-0"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => { setStep('paste-response'); setError(null); }}
                    className="flex-1 border-0"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LLMImportWizard;
