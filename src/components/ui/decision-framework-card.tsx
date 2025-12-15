import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, GitBranch, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Option {
  name: string;
  pros: string[];
  cons: string[];
}

interface DecisionFrameworkCardProps {
  decision: string;
  whyNow: string;
  options: Option[];
  recommendation: string;
}

export const DecisionFrameworkCard: React.FC<DecisionFrameworkCardProps> = ({
  decision,
  whyNow,
  options,
  recommendation,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `Decision: ${decision}\n\nWhy Now: ${whyNow}\n\nOptions:\n${options.map(o => `\n${o.name}\nPros: ${o.pros.join(', ')}\nCons: ${o.cons.join(', ')}`).join('\n')}\n\nRecommendation:\n${recommendation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Decision framework copied!',
      description: 'Ready for your team discussion',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {decision}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{whyNow}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Badge variant="outline">Options to Consider</Badge>
          {options.map((option, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <p className="font-medium text-sm">{option.name}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Pros</span>
                  </div>
                  <ul className="space-y-1">
                    {option.pros.map((pro, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-green-600 dark:text-green-400">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ThumbsDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Cons</span>
                  </div>
                  <ul className="space-y-1">
                    {option.cons.map((con, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-red-600 dark:text-red-400">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <Badge variant="default" className="mb-2">AI Recommendation</Badge>
          <p className="text-sm leading-relaxed mt-2">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
};
