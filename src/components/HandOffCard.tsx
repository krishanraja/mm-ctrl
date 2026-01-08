/**
 * Mindmaker Control - Hand Off Card
 * 
 * For hands-off leaders, the product must never imply they should build tools.
 * 
 * Delegation mode (one tap):
 * - Button label: "Hand this off cleanly"
 * - Generates: delegation brief with context, constraints, success criteria, risks
 * - Export: Copy button (no integrations v1)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowLeft, FileText } from 'lucide-react';
import { StructuredResponse, generateDelegationBrief } from '@/utils/decisionResponseComposer';
import { transitions, variants } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface HandOffCardProps {
  response: StructuredResponse;
  transcript: string;
  onClose: () => void;
}

export const HandOffCard: React.FC<HandOffCardProps> = ({
  response,
  transcript,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate the delegation brief
  const delegationBrief = useMemo(() => {
    return generateDelegationBrief(response, transcript);
  }, [response, transcript]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(delegationBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [delegationBrief]);

  return (
    <motion.div
      className="w-full max-w-md"
      variants={variants.responseCard}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitions.default}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Delegation Brief</span>
        </div>
      </div>

      {/* Brief Preview Card */}
      <motion.div
        className="bg-card rounded-2xl p-6 mb-6"
        variants={variants.cardFocus}
        transition={transitions.card}
      >
        {/* Context Section */}
        <BriefSection
          title="Context"
          content={response.what_this_is}
        />

        {/* Constraints Section */}
        <BriefSection
          title="Constraints"
          content={response.what_you_might_be_missing}
          bulletPoints={['Report back before any commitments are made']}
        />

        {/* Success Criteria */}
        <BriefSection
          title="Success Criteria"
          bulletPoints={[
            'Clear recommendation with supporting evidence',
            'Key risks identified with mitigation options',
            'Timeline for decision and implementation',
          ]}
        />

        {/* Risks to Watch */}
        <BriefSection
          title="Risks to Watch"
          bulletPoints={[
            response.what_you_might_be_missing,
            'Watch for confident claims without clear ownership',
          ]}
        />

        {/* Next Step */}
        <BriefSection
          title="Next Step"
          content={response.what_to_decide_next}
          isLast
        />
      </motion.div>

      {/* Copy Action */}
      <motion.button
        onClick={handleCopy}
        className={cn(
          "w-full py-4 rounded-2xl font-medium",
          "flex items-center justify-center gap-3",
          "transition-colors",
          copied 
            ? "bg-green-600/20 text-green-500" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={transitions.fast}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={transitions.fast}
            >
              <Check className="w-5 h-5" />
              <span>Copied to clipboard</span>
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={transitions.fast}
            >
              <Copy className="w-5 h-5" />
              <span>Copy delegation brief</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Hint */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Paste into email, Slack, or your task manager
      </p>
    </motion.div>
  );
};

// Helper component for brief sections
interface BriefSectionProps {
  title: string;
  content?: string;
  bulletPoints?: string[];
  isLast?: boolean;
}

const BriefSection: React.FC<BriefSectionProps> = ({ 
  title, 
  content, 
  bulletPoints,
  isLast = false 
}) => {
  return (
    <div className={cn("pb-4", !isLast && "border-b border-border mb-4")}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      
      {content && (
        <p className="text-foreground">{content}</p>
      )}
      
      {bulletPoints && bulletPoints.length > 0 && (
        <ul className="space-y-1.5">
          {bulletPoints.map((point, idx) => (
            <li key={idx} className="text-foreground flex items-start gap-2">
              <span className="text-primary mt-1.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HandOffCard;
