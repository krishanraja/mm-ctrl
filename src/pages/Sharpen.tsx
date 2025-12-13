import { useState } from 'react';
import { ArrowLeft, Send, Lightbulb, Target, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/sharpen/VoiceInput';
import { InsightCard } from '@/components/sharpen/InsightCard';
import { CopyablePrompt } from '@/components/sharpen/CopyablePrompt';
import { LoadingState } from '@/components/sharpen/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SharpenResult {
  whats_working: string;
  whats_missing: string;
  next_move: string;
  teaching_moment: string;
  upgraded_question: string;
}

export default function Sharpen() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SharpenResult | null>(null);

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Please describe a situation first');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('sharpen-analyze', {
        body: { userInput: input.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (error) {
      console.error('Sharpen analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAnother = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container-width flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img 
              src="/mindmaker-favicon.png" 
              alt="Mindmaker" 
              className="h-8 w-8"
            />
            <span className="font-semibold text-lg text-foreground">Sharpen</span>
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTryAnother}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Try another
            </Button>
          )}
        </div>
      </header>

      <main className="container-width py-8 pb-24">
        {!result && !isLoading && (
          <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                See what you're missing in 2 minutes
              </h1>
              <p className="text-muted-foreground text-lg">
                Describe a recent decision where you wondered if AI could have helped
              </p>
            </div>

            {/* Input */}
            <div className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="For example: I spent two hours writing a board update and I'm not sure if I covered everything they'd want to know..."
                className="min-h-[160px] text-base resize-none border-border focus:border-accent"
                disabled={isLoading}
              />

              <div className="flex items-center justify-between gap-4">
                <VoiceInput 
                  onTranscript={handleVoiceTranscript}
                  isDisabled={isLoading}
                />
                
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className="btn-hero-cta flex-1 h-14 text-base"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Sharpen my thinking
                </Button>
              </div>
            </div>

            {/* Hint */}
            <p className="text-center text-muted-foreground text-sm mt-6">
              Your secret weapon before any AI conversation
            </p>
          </div>
        )}

        {isLoading && (
          <LoadingState message="Analyzing your situation..." />
        )}

        {result && (
          <div className="max-w-2xl mx-auto space-y-4 fade-in-up">
            {/* What's Working */}
            <InsightCard
              icon={<span className="text-lg">✓</span>}
              title="What you got right"
              variant="default"
            >
              {result.whats_working}
            </InsightCard>

            {/* What's Missing */}
            <InsightCard
              icon={<Lightbulb className="h-5 w-5" />}
              title="What you're missing"
              variant="highlight"
            >
              {result.whats_missing}
            </InsightCard>

            {/* Next Move */}
            <InsightCard
              icon={<Target className="h-5 w-5" />}
              title="Your next move"
              variant="action"
            >
              {result.next_move}
            </InsightCard>

            {/* Upgraded Prompt */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Here's exactly how to ask AI about this:
              </p>
              <CopyablePrompt 
                prompt={result.upgraded_question}
                title="Ready to use"
              />
            </div>

            {/* Teaching Moment */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {result.teaching_moment}
                </p>
              </div>
            </div>

            {/* CTA to Prompt Coach */}
            <div className="pt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/coach')}
                className="w-full h-14 text-base border-2 hover:bg-accent/5 hover:border-accent"
              >
                <span className="mr-2">🎯</span>
                Practice with Prompt Coach
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-center text-muted-foreground text-sm mt-3">
                Test any prompt before you use it
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
