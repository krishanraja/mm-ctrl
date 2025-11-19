import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, BookOpen, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PlaybookStep {
  week: string;
  focus: string;
  actions: string[];
}

interface ExecutivePlaybookCardProps {
  title: string;
  whenToUse: string;
  steps: PlaybookStep[];
  successMetrics: string[];
  riskMitigation: string[];
}

export const ExecutivePlaybookCard: React.FC<ExecutivePlaybookCardProps> = ({
  title,
  whenToUse,
  steps,
  successMetrics,
  riskMitigation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `${title}\n\n${whenToUse}\n\nTimeline:\n${steps.map(s => `\n${s.week}: ${s.focus}\n${s.actions.map(a => `- ${a}`).join('\n')}`).join('\n')}\n\nSuccess Metrics:\n${successMetrics.map(m => `- ${m}`).join('\n')}\n\nRisk Mitigation:\n${riskMitigation.map(r => `- ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Playbook copied!',
      description: 'Your execution plan is ready',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CollapsibleTrigger asChild>
              <div className="flex-1 cursor-pointer">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{whenToUse}</p>
              </div>
            </CollapsibleTrigger>
            <div className="flex gap-2">
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
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Timeline Steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <Badge variant="outline">Timeline</Badge>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                        {step.week}
                      </span>
                      <span className="text-sm font-medium">{step.focus}</span>
                    </div>
                    <ul className="space-y-1 ml-2">
                      {step.actions.map((action, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Badge variant="outline" className="mb-2">Success Metrics</Badge>
              <ul className="space-y-1.5 mt-2">
                {successMetrics.map((metric, index) => (
                  <li key={index} className="text-sm flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Mitigation */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <Badge variant="outline" className="mb-2">Risk Mitigation</Badge>
              <ul className="space-y-1.5 mt-2">
                {riskMitigation.map((risk, index) => (
                  <li key={index} className="text-sm flex gap-2">
                    <span className="text-muted-foreground">⚠</span>
                    <span className="text-muted-foreground">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
