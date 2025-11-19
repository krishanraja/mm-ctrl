import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EnhancedPromptCardProps {
  title: string;
  whatItsFor: string;
  whenToUse: string;
  howToUse: string;
  prompts: string[];
  isLocked?: boolean;
}

export const EnhancedPromptCard = React.memo<EnhancedPromptCardProps>(({
  title,
  whatItsFor,
  whenToUse,
  howToUse,
  prompts,
  isLocked = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: 'Copied!',
      description: 'Prompt copied to clipboard',
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Unlock Full Library
            </p>
          </div>
        </div>
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="text-lg">{title}</CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Badge variant="outline" className="mb-2">What it's for</Badge>
            <p className="text-sm text-muted-foreground">{whatItsFor}</p>
          </div>

          <CollapsibleContent>
            <div className="space-y-4 pt-2">
              <div>
                <Badge variant="outline" className="mb-2">When to use it</Badge>
                <p className="text-sm text-muted-foreground">{whenToUse}</p>
              </div>

              <div>
                <Badge variant="outline" className="mb-2">How to use it</Badge>
                <p className="text-sm text-muted-foreground">{howToUse}</p>
              </div>

              <div>
                <Badge variant="outline" className="mb-3">Example Prompts</Badge>
                <div className="space-y-3">
                  {prompts.map((prompt, index) => (
                    <div key={index} className="relative group">
                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-sm font-mono leading-relaxed pr-8">
                          {prompt}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(prompt, index)}
                        >
                          {copiedIndex === index ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
});

EnhancedPromptCard.displayName = 'EnhancedPromptCard';
