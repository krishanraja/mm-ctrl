import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Sparkles,
  PenTool,
  Layers,
  TrendingUp,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/renderMarkdown';
import { useEdge } from '@/hooks/useEdge';
import { useEdgeSubscription } from '@/hooks/useEdgeSubscription';
import { EdgeProfileCard } from './EdgeProfileCard';
import { SmartProbeCard } from './SmartProbeCard';
import { EdgeOnboarding } from './EdgeOnboarding';
import { EdgePaywall, SAMPLE_ARTIFACTS } from './EdgePaywall';
import { DraftSheet } from './DraftSheet';
import { ArtifactPreview } from './ArtifactPreview';
import { SHARPEN_CAPABILITY_META, COVER_CAPABILITY_META } from '@/types/edge';
import type {
  EdgeCapability,
  ActionType,
  SharpenCapability,
  CoverCapability,
  IntelligenceGap,
} from '@/types/edge';

// ===== Pro teaser config =====

const TEASER_KEYS = ['board_memo', 'strategy_doc', 'email', 'meeting_agenda', 'systemize'] as const;
const TEASER_LABELS: Record<string, string> = {
  board_memo: 'Board Memo',
  strategy_doc: 'Strategy Doc',
  email: 'Email Draft',
  meeting_agenda: 'Meeting Agenda',
  systemize: 'Leadership Framework',
};

// ===== Main EdgeView Component =====

export default function EdgeView() {
  const {
    profile,
    strengths,
    weaknesses,
    intelligenceGaps,
    topGap,
    hasProfile,
    isLoading,
    isSynthesizing,
    synthesize,
    submitFeedback,
  } = useEdge();

  const { hasAccess } = useEdgeSubscription();
  const navigate = useNavigate();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallCapability, setPaywallCapability] = useState<string | undefined>();

  // DraftSheet state
  const [draftSheetOpen, setDraftSheetOpen] = useState(false);
  const [activeCapability, setActiveCapability] = useState<EdgeCapability | null>(null);
  const [activeTargetKey, setActiveTargetKey] = useState('');
  const [activeActionType, setActiveActionType] = useState<ActionType>('cover');

  // ArtifactPreview state
  const [artifactPreviewOpen, setArtifactPreviewOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedActionId, setGeneratedActionId] = useState<string | null>(null);

  // Pro teaser cycling state
  const [teaserIndex, setTeaserIndex] = useState(0);

  useEffect(() => {
    if (hasAccess) return; // no teaser for paid users
    const timer = setInterval(() => {
      setTeaserIndex((prev) => (prev + 1) % TEASER_KEYS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasAccess]);

  // Unified action handler for capabilities from pills
  const handleAction = useCallback(
    (capability: string, targetKey: string) => {
      const isFreeCapability = capability === 'lean_into';

      if (!isFreeCapability && !hasAccess) {
        const meta =
          SHARPEN_CAPABILITY_META[capability as SharpenCapability] ||
          COVER_CAPABILITY_META[capability as CoverCapability];
        setPaywallCapability(meta?.label || capability);
        setPaywallOpen(true);
        return;
      }

      const isSharpen = capability in SHARPEN_CAPABILITY_META;
      setActiveCapability(capability as EdgeCapability);
      setActiveTargetKey(targetKey);
      setActiveActionType(isSharpen ? 'sharpen' : 'cover');
      setDraftSheetOpen(true);
    },
    [hasAccess],
  );

  const handleGenerated = useCallback(
    (result: { actionId: string; content: string; title: string }) => {
      setDraftSheetOpen(false);
      setGeneratedContent(result.content);
      setGeneratedTitle(result.title);
      setGeneratedActionId(result.actionId);
      setArtifactPreviewOpen(true);
    },
    [],
  );

  const handleSmartProbeAction = useCallback(
    (gap: IntelligenceGap) => {
      switch (gap.resolution) {
        case 'voice_capture':
        case 'quick_confirm':
          navigate('/dashboard');
          break;
        case 'md_upload':
          navigate('/context');
          break;
        case 'diagnostic':
          navigate('/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    },
    [navigate],
  );

  const handleQuickAction = useCallback(
    (action: 'draft' | 'framework') => {
      if (!hasAccess) {
        setPaywallCapability(action === 'draft' ? 'Drafting' : 'Frameworks');
        setPaywallOpen(true);
        return;
      }
      if (action === 'framework' && strengths.length > 0) {
        setActiveCapability('systemize');
        setActiveTargetKey(strengths[0].key);
        setActiveActionType('sharpen');
        setDraftSheetOpen(true);
      } else if (action === 'draft' && weaknesses.length > 0) {
        const firstCap = weaknesses[0].capabilities[0] || 'email';
        setActiveCapability(firstCap);
        setActiveTargetKey(weaknesses[0].key);
        setActiveActionType('cover');
        setDraftSheetOpen(true);
      }
    },
    [hasAccess, strengths, weaknesses],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Synthesizing state
  if (isSynthesizing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 p-[2px]"
        >
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
        </motion.div>
        <p className="text-sm text-foreground font-medium">Synthesizing your Edge profile...</p>
        <p className="text-xs text-muted-foreground">Analyzing strengths, weaknesses, and gaps</p>
      </motion.div>
    );
  }

  // First-time / no profile: show onboarding
  if (!hasProfile) {
    return <EdgeOnboarding onComplete={synthesize} />;
  }

  // Current teaser sample
  const teaserKey = TEASER_KEYS[teaserIndex];
  const teaserContent = SAMPLE_ARTIFACTS[teaserKey] || '';
  const teaserLabel = TEASER_LABELS[teaserKey] || '';

  // Full Edge view
  return (
    <>
      <div className="space-y-5">
        {/* Hero summary card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 via-card to-purple-500/5 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Edge</h2>
              <p className="text-xs text-muted-foreground">Based on your Memory Web</p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.05 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-500 text-xs font-medium"
            >
              <TrendingUp className="h-3 w-3" />
              {strengths.length} strength{strengths.length !== 1 ? 's' : ''}
            </motion.span>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium"
            >
              <AlertTriangle className="h-3 w-3" />
              {weaknesses.length} gap{weaknesses.length !== 1 ? 's' : ''}
            </motion.span>
            {intelligenceGaps.length > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-medium"
              >
                <Brain className="h-3 w-3" />
                {intelligenceGaps.length} intel gap{intelligenceGaps.length !== 1 ? 's' : ''}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Profile Card: Expandable Strengths + Weaknesses pills */}
        <EdgeProfileCard
          strengths={strengths}
          weaknesses={weaknesses}
          onFeedback={submitFeedback}
          isPaid={hasAccess}
          onAction={handleAction}
        />

        {/* Ambient Pro teaser — free users only */}
        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-accent/10 bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">What Edge Pro generates</h3>
            </div>

            {/* Cycling blurred artifact preview */}
            <div className="relative rounded-xl border border-border overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={teaserKey}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 max-h-24 overflow-hidden text-xs"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(teaserContent) }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
              <div className="absolute bottom-0 inset-x-0 h-12 backdrop-blur-[2px] bg-background/40" />
            </div>

            {/* Label + soft CTA */}
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.span
                  key={teaserKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground font-medium"
                >
                  {teaserLabel}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() => {
                  setPaywallCapability(teaserLabel);
                  setPaywallOpen(true);
                }}
                className="text-xs text-accent hover:underline font-medium"
              >
                Unlock with Edge Pro &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Smart Probe: Top intelligence gap with resolution-specific action */}
        {topGap && (
          <SmartProbeCard
            gap={topGap}
            onDismiss={() => {}}
            onAction={handleSmartProbeAction}
          />
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          <button
            onClick={() => handleQuickAction('draft')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all',
              'bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90',
            )}
          >
            <PenTool className="h-4 w-4" />
            Draft Something
          </button>
          <button
            onClick={() => handleQuickAction('framework')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all',
              'bg-foreground/5 text-foreground hover:bg-foreground/10',
            )}
          >
            <Layers className="h-4 w-4" />
            Build a Framework
          </button>
        </motion.div>
      </div>

      <EdgePaywall
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        capability={paywallCapability}
      />

      <DraftSheet
        isOpen={draftSheetOpen}
        onClose={() => setDraftSheetOpen(false)}
        capability={activeCapability}
        targetKey={activeTargetKey}
        actionType={activeActionType}
        onGenerated={handleGenerated}
      />

      <ArtifactPreview
        isOpen={artifactPreviewOpen}
        onClose={() => setArtifactPreviewOpen(false)}
        content={generatedContent}
        title={generatedTitle}
        actionId={generatedActionId}
      />
    </>
  );
}
