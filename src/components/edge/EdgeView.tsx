import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Sparkles,
  PenTool,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEdge } from '@/hooks/useEdge';
import { useEdgeSubscription } from '@/hooks/useEdgeSubscription';
import { EdgeProfileCard } from './EdgeProfileCard';
import { SmartProbeCard } from './SmartProbeCard';
import { EdgeOnboarding } from './EdgeOnboarding';
import { EdgePaywall } from './EdgePaywall';
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

// ===== Main EdgeView Component =====

export default function EdgeView() {
  const {
    strengths,
    weaknesses,
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

  // Unified action handler for capabilities from pills
  const handleAction = useCallback(
    (capability: string, targetKey: string) => {
      // Determine if this capability is free
      const isFreeCapability = capability === 'lean_into';

      if (!isFreeCapability && !hasAccess) {
        // Look up the label for the paywall message
        const meta =
          SHARPEN_CAPABILITY_META[capability as SharpenCapability] ||
          COVER_CAPABILITY_META[capability as CoverCapability];
        setPaywallCapability(meta?.label || capability);
        setPaywallOpen(true);
        return;
      }

      // Determine action type based on which capability set it belongs to
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
      // Route based on resolution type
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

  // Full Edge view
  return (
    <>
      <div className="space-y-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Your Edge Profile</h2>
        </motion.div>

        {/* Profile Card: Expandable Strengths + Weaknesses pills */}
        <EdgeProfileCard
          strengths={strengths}
          weaknesses={weaknesses}
          onFeedback={submitFeedback}
          isPaid={hasAccess}
          onAction={handleAction}
        />

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
