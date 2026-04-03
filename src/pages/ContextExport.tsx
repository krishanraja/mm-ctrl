/**
 * ContextExport Page
 * "Brief My AI" - export portable context for any AI tool.
 * Desktop: two-column (selectors left, preview right).
 * Mobile: stacked with sticky action buttons at bottom.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Download,
  FileText,
  MessageSquare,
  Code2,
  Terminal,
  Sparkles,
  Bot,
  Users,
  Target,
  Mail,
  TrendingUp,
  PenTool,
  Layers,
  GitBranch,
  Compass,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDevice } from '@/hooks/useDevice';
import { useAuth } from '@/hooks/useAuth';
import { useMemoryExport } from '@/hooks/useMemoryExport';
import { useExportRecommendations } from '@/hooks/useExportRecommendations';
import { DesktopSidebar } from '@/components/memory-web/DesktopSidebar';
import { BottomNav } from '@/components/memory-web/BottomNav';
import { AppHeader } from '@/components/memory-web/AppHeader';
import { supabase } from '@/integrations/supabase/client';
import type { ExportFormat, ExportUseCase } from '@/types/memory';
import type { ExportRecommendation } from '@/types/edge';

const ICON_MAP: Record<string, typeof Bot> = {
  PenTool,
  Layers,
  GitBranch,
  Compass,
  BookOpen,
  Users,
  TrendingUp,
  Target,
};

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  icon: typeof Bot;
  instruction: string;
}[] = [
  {
    value: 'chatgpt',
    label: 'ChatGPT',
    icon: Bot,
    instruction:
      'Go to Settings > Personalization > Custom Instructions. Paste this into "What would you like ChatGPT to know about you?"',
  },
  {
    value: 'claude',
    label: 'Claude',
    icon: Sparkles,
    instruction:
      'Start a new conversation. Paste this at the beginning of your first message.',
  },
  {
    value: 'gemini',
    label: 'Gemini',
    icon: MessageSquare,
    instruction:
      'In a new chat, paste this as your first message with the prefix "Context about me:"',
  },
  {
    value: 'cursor',
    label: 'Cursor',
    icon: Code2,
    instruction: 'Save this as .cursorrules in your project root.',
  },
  {
    value: 'claude-code',
    label: 'Claude Code',
    icon: Terminal,
    instruction: 'Save this as CLAUDE.md in your project root.',
  },
  {
    value: 'markdown',
    label: 'Raw Markdown',
    icon: FileText,
    instruction: 'Use this anywhere that accepts markdown.',
  },
];

const USE_CASE_OPTIONS: {
  value: ExportUseCase;
  label: string;
  icon: typeof Target;
  description: string;
}[] = [
  {
    value: 'general',
    label: 'General Advisor',
    icon: Bot,
    description: 'All-purpose context for any AI conversation',
  },
  {
    value: 'meeting',
    label: 'Meeting Prep',
    icon: Users,
    description: 'Context optimized for preparing for meetings',
  },
  {
    value: 'decision',
    label: 'Decision Support',
    icon: Target,
    description: 'Focus on goals, blockers, and decision history',
  },
  {
    value: 'code',
    label: 'Code Review',
    icon: Code2,
    description: 'Technical preferences and project context',
  },
  {
    value: 'email',
    label: 'Email Drafting',
    icon: Mail,
    description: 'Communication style and relationship context',
  },
  {
    value: 'strategy',
    label: 'Strategic Planning',
    icon: TrendingUp,
    description: 'Business context, objectives, and patterns',
  },
];

export default function ContextExport() {
  const { isMobile } = useDevice();
  const { exportResult, isExporting: isGenerating, generateExport } = useMemoryExport();
  const { recommendations, hasRecommendations } = useExportRecommendations();
  const { userId, email } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('claude');
  const [selectedUseCase, setSelectedUseCase] = useState<ExportUseCase>('general');
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<'positive' | 'negative' | null>(null);

  const activeFormatOption = FORMAT_OPTIONS.find(
    (f) => f.value === selectedFormat
  );

  const triggerFeedbackPrompt = useCallback(() => {
    setFeedbackSubmitted(null);
    setShowFeedback(true);
  }, []);

  const submitExportFeedback = useCallback(async (rating: 'positive' | 'negative') => {
    setFeedbackSubmitted(rating);
    try {
      await supabase.from('feedback' as any).insert({
        user_id: userId,
        user_email: email,
        feedback_text: JSON.stringify({
          type: 'export_rating',
          export_target: selectedFormat,
          use_case: selectedUseCase,
          rating,
        }),
        page_context: 'context-export-rating',
        user_agent: navigator.userAgent,
      });
    } catch {
      // Non-blocking; silently fail
    }
    setTimeout(() => setShowFeedback(false), 1800);
  }, [userId, email, selectedFormat, selectedUseCase]);

  // Generate export when format or use case changes
  useEffect(() => {
    generateExport(selectedFormat, selectedUseCase);
  }, [selectedFormat, selectedUseCase, generateExport]);

  const handleCopy = useCallback(async () => {
    if (!exportResult?.content) return;
    try {
      await navigator.clipboard.writeText(exportResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => triggerFeedbackPrompt(), 2200);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, [exportResult?.content, triggerFeedbackPrompt]);

  const handleDownload = useCallback(() => {
    if (!exportResult?.content) return;
    const filename =
      selectedFormat === 'cursor'
        ? '.cursorrules'
        : selectedFormat === 'claude-code'
        ? 'CLAUDE.md'
        : `mindmaker-context-${selectedFormat}.md`;

    const blob = new Blob([exportResult.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => triggerFeedbackPrompt(), 500);
  }, [exportResult?.content, selectedFormat, triggerFeedbackPrompt]);

  // Shared content for both layouts
  const selectorsContent = (
    <div className="space-y-6">
      {/* Format Selector */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Export Format
        </h2>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFormat === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedFormat(option.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  isSelected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/30'
                )}
                title={option.instruction}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended for You */}
      {hasRecommendations && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">
              Recommended for You
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2.5">
            Based on your profile
          </p>
          <div className="flex flex-col gap-2">
            {recommendations.map((rec: ExportRecommendation, i: number) => {
              const Icon = ICON_MAP[rec.iconName] || Bot;
              const isSelected = selectedUseCase === rec.useCase;
              return (
                <motion.button
                  key={rec.useCase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedUseCase(rec.useCase)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg text-left transition-all border',
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-card hover:border-accent/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5 flex-shrink-0',
                      isSelected ? 'text-accent' : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-accent' : 'text-foreground'
                        )}
                      >
                        {rec.label}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          rec.badgeVariant === 'teal'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        )}
                      >
                        {rec.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {rec.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Use Case Selector */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {hasRecommendations ? 'All Use Cases' : 'Use Case'}
        </h2>
        <div className={cn(
          'grid gap-2',
          isMobile ? 'grid-cols-2' : 'grid-cols-2'
        )}>
          {USE_CASE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedUseCase === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedUseCase(option.value)}
                className={cn(
                  'flex flex-col items-start gap-1.5 p-3 rounded-lg text-left transition-all border',
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-card hover:border-accent/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-accent' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const previewContent = (
    <div className="space-y-3">
      {/* Instruction banner */}
      {activeFormatOption && (
        <motion.div
          key={selectedFormat}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-accent/5 border border-accent/10 px-4 py-2.5"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeFormatOption.instruction}
          </p>
        </motion.div>
      )}

      {/* Preview area */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
          <span className="text-xs font-medium text-muted-foreground">
            Preview
          </span>
          {isGenerating && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">
                Generating...
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-4 overflow-y-auto scrollbar-hide overscroll-contain',
          isMobile ? 'flex-1 min-h-0' : 'max-h-[600px]'
        )}>
          {exportResult?.content ? (
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
              {exportResult.content}
            </pre>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {isGenerating
                ? 'Generating your context...'
                : 'Select a format and use case to generate your portable context.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCopy}
        disabled={!exportResult?.content || isGenerating}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
          'border border-accent bg-accent/10 text-accent hover:bg-accent/20',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              Copied!
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <button
        onClick={handleDownload}
        disabled={!exportResult?.content || isGenerating}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
          'border border-border bg-card text-foreground hover:bg-secondary',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Download className="h-4 w-4" />
        {!isMobile && 'Download .md'}
      </button>
    </div>
  );

  const feedbackCard = (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
        >
          {feedbackSubmitted ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground text-center"
            >
              Thanks for the feedback!
            </motion.p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-foreground/80">
                Did this export improve your AI conversation?
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => submitExportFeedback('positive')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </button>
                <button
                  onClick={() => submitExportFeedback('negative')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Not really
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="ml-1 p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 min-h-screen">
          <div className="max-w-6xl mx-auto px-8 py-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-semibold text-foreground">
                What Your AI Knows About You
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {exportResult
                  ? `${exportResult.token_count.toLocaleString()} tokens | Last updated ${new Date(exportResult.last_updated).toLocaleDateString()}`
                  : 'Generate your portable context for any AI tool'}
              </p>
            </motion.div>

            {/* Two-column layout */}
            <div className="flex gap-8">
              {/* Left: Selectors */}
              <div className="w-[420px] flex-shrink-0 space-y-6">
                {selectorsContent}
                <div className="pt-2">{actionButtons}</div>
                <div className="pt-2">{feedbackCard}</div>
              </div>

              {/* Right: Preview */}
              <div className="flex-1 min-w-0">{previewContent}</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Mobile layout - scrollable
  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <AppHeader />

      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-accent" />
          <h1 className="text-base font-semibold text-foreground">
            Export Context
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {exportResult
            ? `${exportResult.token_count.toLocaleString()} tokens`
            : 'Generate your portable context'}
        </p>
      </div>

      {/* Content - scrollable */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-20 space-y-4">
        {selectorsContent}
        <div>{actionButtons}</div>
        {feedbackCard}
        {previewContent}
      </main>

      <BottomNav />
    </div>
  );
}
