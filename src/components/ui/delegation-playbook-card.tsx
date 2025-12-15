import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, UserCheck, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DelegationPlaybookCardProps {
  task: string;
  delegateTo: string;
  promptToGiveThem: string;
  successCriteria: string[];
}

export const DelegationPlaybookCard: React.FC<DelegationPlaybookCardProps> = ({
  task,
  delegateTo,
  promptToGiveThem,
  successCriteria,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `Delegation: ${task}\n\nDelegate to: ${delegateTo}\n\nWhat to say:\n"${promptToGiveThem}"\n\nSuccess Criteria:\n${successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Delegation guide copied!',
      description: 'Ready to share with your team',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {task}
          </CardTitle>
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
        <div>
          <Badge variant="secondary" className="mb-2">Delegate To</Badge>
          <p className="text-sm font-medium mt-1">{delegateTo}</p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <Badge variant="outline" className="mb-2">What to Say</Badge>
          <p className="text-sm leading-relaxed italic mt-2">"{promptToGiveThem}"</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <Badge variant="outline">Success Criteria</Badge>
          </div>
          <ul className="space-y-1.5 mt-2">
            {successCriteria.map((criteria, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span className="leading-relaxed">{criteria}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
