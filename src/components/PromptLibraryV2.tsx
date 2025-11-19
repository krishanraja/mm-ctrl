import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedPromptCard } from '@/components/ui/enhanced-prompt-card';
import { aggregateLeaderResults, isContentLocked } from '@/utils/aggregateLeaderResults';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContactData } from './ContactCollectionForm';

interface PromptLibraryV2Props {
  assessmentId: string;
  contactData: ContactData;
}

export const PromptLibraryV2: React.FC<PromptLibraryV2Props> = ({
  assessmentId,
  contactData,
}) => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyingAll, setCopyingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPrompts();
  }, [assessmentId]);

  const loadPrompts = async () => {
    setIsLoading(true);
    const data = await aggregateLeaderResults(assessmentId, true);
    setResults(data);
    setIsLoading(false);
  };

  const handleCopyAll = async () => {
    if (!results?.promptSets) return;
    
    setCopyingAll(true);
    
    const allPromptsText = results.promptSets
      .map((set: any) => {
        const prompts = Array.isArray(set.prompts_json) ? set.prompts_json : [];
        return `## ${set.title}\n\n${prompts.join('\n\n')}`;
      })
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(allPromptsText);
      toast({
        title: 'All Prompts Copied!',
        description: 'Your complete prompt library is ready to use',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
    
    setCopyingAll(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!results?.promptSets || results.promptSets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No prompts available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your AI Command Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {contactData.fullName}, based on your leadership profile and priorities, here are your personalized AI prompts. 
            Each set is tailored to your role, communication style, and strategic objectives.
          </p>
        </CardContent>
      </Card>

      {/* Copy All Button (Paid users only) */}
      {results.hasFullDiagnostic && (
        <div className="flex justify-end">
          <Button 
            onClick={handleCopyAll} 
            disabled={copyingAll}
            className="gap-2"
          >
            {copyingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy All Prompts
          </Button>
        </div>
      )}

      {/* Prompt Cards */}
      <div className="space-y-4">
        {results.promptSets.map((set: any, index: number) => (
          <EnhancedPromptCard
            key={set.id}
            title={set.title}
            whatItsFor={set.what_its_for || 'Tailored for your role and context'}
            whenToUse={set.when_to_use || 'Use when you need targeted AI support'}
            howToUse={set.how_to_use || 'Copy and adapt to your specific needs'}
            prompts={Array.isArray(set.prompts_json) ? set.prompts_json : []}
            isLocked={isContentLocked(results.hasFullDiagnostic, 'prompt', index)}
          />
        ))}
      </div>

      {/* Quick Start Tips (Always visible) */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Copy prompts into ChatGPT, Claude, or your preferred AI tool</p>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Adapt the prompts with your specific data and context</p>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">Start with the prompts marked as highest priority for your role</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
