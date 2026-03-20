/**
 * Team Instructions Sheet
 *
 * Bottom sheet for generating contextual team instructions.
 * Two states: form input and results display.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, ArrowLeft, Plus, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { useTeamInstructions } from '@/hooks/useTeamInstructions';
import type { TeamInstructionRequest } from '@/types/team-instructions';

interface TeamInstructionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamInstructionsSheet({ isOpen, onClose }: TeamInstructionsSheetProps) {
  const { instructions, isGenerating, error, generateInstructions, copyToClipboard, reset } =
    useTeamInstructions();

  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [briefDescription, setBriefDescription] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleAddFocusArea = useCallback(() => {
    const trimmed = focusAreaInput.trim();
    if (trimmed && !focusAreas.includes(trimmed)) {
      setFocusAreas((prev) => [...prev, trimmed]);
      setFocusAreaInput('');
    }
  }, [focusAreaInput, focusAreas]);

  const handleRemoveFocusArea = useCallback((area: string) => {
    setFocusAreas((prev) => prev.filter((a) => a !== area));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!recipientName.trim() || !recipientRole.trim() || !briefDescription.trim()) return;
    haptics.medium();
    const params: TeamInstructionRequest = {
      recipientName: recipientName.trim(),
      recipientRole: recipientRole.trim(),
      briefDescription: briefDescription.trim(),
      ...(focusAreas.length > 0 && { focusAreas }),
    };
    await generateInstructions(params);
  }, [recipientName, recipientRole, briefDescription, focusAreas, generateInstructions]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard();
    if (ok) {
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyToClipboard]);

  const handleBack = useCallback(() => {
    reset();
    setCopied(false);
  }, [reset]);

  const handleClose = useCallback(() => {
    onClose();
    // Reset state after animation completes
    setTimeout(() => {
      setRecipientName('');
      setRecipientRole('');
      setBriefDescription('');
      setFocusAreas([]);
      setFocusAreaInput('');
      reset();
      setCopied(false);
    }, 300);
  }, [onClose, reset]);

  const canGenerate = recipientName.trim() && recipientRole.trim() && briefDescription.trim();

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
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] bg-background rounded-t-2xl border-t border-border shadow-2xl flex flex-col"
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {instructions && (
                  <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <h2 className="text-lg font-semibold text-foreground">
                  {instructions ? 'Instructions Ready' : 'Team Instructions'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait">
                {!instructions ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Recipient Name */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Who is this for?
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full px-3 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                      />
                    </div>

                    {/* Recipient Role */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Their role
                      </label>
                      <input
                        type="text"
                        value={recipientRole}
                        onChange={(e) => setRecipientRole(e.target.value)}
                        placeholder="e.g. Marketing Lead"
                        className="w-full px-3 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                      />
                    </div>

                    {/* Brief Description */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        What should they know / do?
                      </label>
                      <textarea
                        value={briefDescription}
                        onChange={(e) => setBriefDescription(e.target.value)}
                        placeholder="e.g. Brief her on the Q3 product launch. Cover timeline, brand guidelines, and competitor positioning."
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Focus Areas */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Focus areas <span className="text-muted-foreground/40">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={focusAreaInput}
                          onChange={(e) => setFocusAreaInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFocusArea();
                            }
                          }}
                          placeholder="e.g. Timeline"
                          className="flex-1 px-3 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleAddFocusArea}
                          disabled={!focusAreaInput.trim()}
                          className="h-10 w-10 rounded-xl shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {focusAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {focusAreas.map((area) => (
                            <motion.span
                              key={area}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium"
                            >
                              {area}
                              <button
                                onClick={() => handleRemoveFocusArea(area)}
                                className="hover:text-accent/70 transition-colors"
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-400"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={!canGenerate || isGenerating}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </span>
                      ) : (
                        'Generate Instructions'
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Copy Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCopy}
                        variant="ghost"
                        className="h-9 px-3 rounded-lg text-sm gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy all
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Sections */}
                    {instructions.sections.map((section, i) => (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="p-4 rounded-xl bg-foreground/5 border border-border"
                      >
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          {section.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
