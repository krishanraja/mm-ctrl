import { useState } from 'react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/sharpen/VoiceInput';
import { InsightCard } from '@/components/sharpen/InsightCard';
import { CopyablePrompt } from '@/components/sharpen/CopyablePrompt';
import { LoadingState } from '@/components/sharpen/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CoachResult {
  whats_working: string;
  one_thing_to_try: string;
  upgraded_prompt: string;
  why_this_works: string;
  model_hint?: string | null;
}

export default function PromptCoach() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);

  const handleVoiceTranscript = (text: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('prompt-coach', {
        body: { prompt: prompt.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (error) {
      console.error('Prompt coach error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAnother = () => {
    setPrompt('');
    setResult(null);
  };

  const handleApplyUpgrade = () => {
    if (result?.upgraded_prompt) {
      setPrompt(result.upgraded_prompt);
      setResult(null);
      toast.success('Upgraded prompt applied');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container-width flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg text-foreground">Prompt Coach</span>
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTryAnother}
              className="text-muted-foreground"
            >
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
                Check your prompt before you use it
              </h1>
              <p className="text-muted-foreground text-lg">
                Paste or speak what you're about to ask AI
              </p>
            </div>

            {/* Input */}
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="For example: Summarize this document for me..."
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
                  disabled={!prompt.trim() || isLoading}
                  className="btn-hero-cta flex-1 h-14 text-base"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Check my prompt
                </Button>
              </div>
            </div>

            {/* Hint */}
            <p className="text-center text-muted-foreground text-sm mt-6">
              Quick feedback before you hit send
            </p>
          </div>
        )}

        {isLoading && (
          <LoadingState message="Reviewing your prompt..." />
        )}

        {result && (
          <div className="max-w-2xl mx-auto space-y-4 fade-in-up">
            {/* What's Working */}
            <InsightCard
              icon={<span className="text-lg">✓</span>}
              title="What's working"
              variant="default"
            >
              {result.whats_working}
            </InsightCard>

            {/* One Thing to Try */}
            <InsightCard
              icon={<Sparkles className="h-5 w-5" />}
              title="One thing to try"
              variant="highlight"
            >
              {result.one_thing_to_try}
            </InsightCard>

            {/* Upgraded Prompt */}
            <div className="pt-4">
              <CopyablePrompt 
                prompt={result.upgraded_prompt}
                title="Upgraded version"
              />
              <Button
                variant="outline"
                onClick={handleApplyUpgrade}
                className="w-full mt-3 h-12 text-base"
              >
                Use this version
              </Button>
            </div>

            {/* Why This Works */}
            <div className="pt-4 border-t border-border">
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">Why this works:</strong> {result.why_this_works}
              </p>
            </div>

            {/* Model Hint */}
            {result.model_hint && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="mr-2">🤖</span>
                  {result.model_hint}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
