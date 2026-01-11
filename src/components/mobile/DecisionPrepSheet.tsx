import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronDown, ChevronUp, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DecisionPrepSheetProps {
  context?: {
    type: 'board' | 'vendor' | 'team';
    title: string;
    date?: string;
  };
  baselineData?: any;
}

export const DecisionPrepSheet: React.FC<DecisionPrepSheetProps> = ({
  context = { type: 'board', title: 'Board Meeting' },
  baselineData,
}) => {
  const [expandedPoints, setExpandedPoints] = useState<Set<number>>(new Set());
  const [reviewedPoints, setReviewedPoints] = useState<Set<number>>(new Set());

  // Generate prep content based on context and baseline
  const prepContent = React.useMemo(() => {
    const talkingPoints = [
      {
        id: 1,
        title: 'AI Literacy Position',
        content: `Your current AI literacy tier is ${baselineData?.benchmarkTier || 'Establishing'}, placing you in the top ${Math.round((baselineData?.benchmarkScore || 50) / 100 * 100)}% of leaders.`,
        examples: [
          'Highlight specific areas where you lead peers',
          'Acknowledge areas for growth with clear action plan',
        ],
      },
      {
        id: 2,
        title: 'Strategic Tensions',
        content: baselineData?.tensions?.[0]?.summary_line || 'Key strategic gaps identified in assessment',
        examples: [
          'Frame as opportunities, not problems',
          'Show clear path to resolution',
        ],
      },
      {
        id: 3,
        title: 'Risk Mitigation',
        content: baselineData?.riskSignals?.[0]?.description || 'Governance and risk management priorities',
        examples: [
          'Demonstrate proactive risk management',
          'Show concrete steps being taken',
        ],
      },
    ];

    const questions = context.type === 'vendor' ? [
      'What specific ROI can you demonstrate for similar implementations?',
      'How do you handle data privacy and security compliance?',
      'What is your approach to change management and user adoption?',
      'Can you provide references from similar organizations?',
      'What is your total cost of ownership over 3 years?',
    ] : context.type === 'team' ? [
      'How do we align on AI investment priorities?',
      'What are our risk tolerance levels for AI experimentation?',
      'How do we measure success for AI initiatives?',
      'What governance framework do we need?',
      'How do we build team capability systematically?',
    ] : [
      'What is our AI strategy for the next 12 months?',
      'How are we managing AI-related risks?',
      'What investments are we making in AI capability?',
      'How do we measure ROI on AI initiatives?',
      'What is our competitive position in AI adoption?',
    ];

    return { talkingPoints, questions };
  }, [context, baselineData]);

  const togglePoint = (id: number) => {
    setExpandedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleReviewed = (id: number) => {
    setReviewedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `${context.title} Prep`,
        text: 'AI Strategy Talking Points',
      });
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    const content = prepContent.talkingPoints.map((p) => `${p.title}: ${p.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${context.title}-prep.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{context.title} Prep</h3>
          {context.date && (
            <p className="text-sm text-muted-foreground">Scheduled: {context.date}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Talking Points */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Talking Points</h4>
        <div className="space-y-2">
          {prepContent.talkingPoints.map((point, index) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`border rounded-xl cursor-pointer transition-all ${
                  reviewedPoints.has(point.id)
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-muted'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-foreground">{point.title}</h5>
                        {reviewedPoints.has(point.id) && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-2">{point.content}</p>
                      <AnimatePresence>
                        {expandedPoints.has(point.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1"
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Examples:
                            </p>
                            {point.examples?.map((example, i) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                • {example}
                              </p>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePoint(point.id)}
                      >
                        {expandedPoints.has(point.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleReviewed(point.id)}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            reviewedPoints.has(point.id)
                              ? 'text-emerald-600'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Questions to Ask */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Questions to Ask</h4>
        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <div className="space-y-3">
              {prepContent.questions.map((question, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm text-foreground flex-1">{question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Profile Match */}
      {baselineData && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Based on Your Profile</h4>
          <Card className="border rounded-xl bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                This prep is tailored to your {baselineData.benchmarkTier || 'Establishing'} tier
                and focuses on your top strategic tensions and risk signals.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
