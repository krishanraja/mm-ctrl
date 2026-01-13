/**
 * InsightGenerator Component
 * 
 * Generates personalized insights from voice input.
 * Calls backend edge function for AI analysis.
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/api';
import { InsightCard } from './InsightCard';

interface InsightGeneratorProps {
  transcript: string;
  onComplete?: () => void;
}

interface InsightResponse {
  insight: string;
  action_text: string;
  why_text: string;
}

export function InsightGenerator({ transcript, onComplete }: InsightGeneratorProps) {
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate insight from transcript
  useEffect(() => {
    const generateInsight = async () => {
      try {
        // Call submit-weekly-checkin edge function for insight generation
        const { data, error } = await invokeEdgeFunction<{
          insight: string;
          action_text: string;
          why_text: string;
          tags?: string[];
        }>(
          'submit-weekly-checkin',
          {
            transcript,
            asked_prompt_key: 'voice_entry',
            baseline_context: null, // Will be fetched by backend if user is authenticated
          },
          { retries: 1 }
        );

        if (error || !data) {
          throw new Error(error || 'Failed to generate insight');
        }

        setInsight({
          insight: data.insight || 'Processing your input...',
          action_text: data.action_text || 'No action generated',
          why_text: data.why_text || '',
        });
        setIsLoading(false);
        onComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate insight');
        setIsLoading(false);
      }
    };

    if (transcript) {
      generateInsight();
    }
  }, [transcript, onComplete]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating your insight...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <InsightCard
      insight={insight.insight}
      action={insight.action_text}
      why={insight.why_text}
    />
  );
}
