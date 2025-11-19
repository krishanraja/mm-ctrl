import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, MessageSquare, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConversationGuideCardProps {
  stakeholder: string;
  topic: string;
  talkingPoints: string[];
  successLooksLike: string;
}

export const ConversationGuideCard: React.FC<ConversationGuideCardProps> = ({
  stakeholder,
  topic,
  talkingPoints,
  successLooksLike,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `Conversation with ${stakeholder}: ${topic}\n\nTalking Points:\n${talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nSuccess Criteria:\n${successLooksLike}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Conversation guide copied!',
      description: 'Ready to use in your meeting prep',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {stakeholder}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{topic}</p>
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
        <div>
          <Badge variant="outline" className="mb-2">Key Talking Points</Badge>
          <ul className="space-y-2 mt-2">
            {talkingPoints.map((point, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-primary font-medium min-w-[1.5rem]">{index + 1}.</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <Badge variant="outline">Success Looks Like</Badge>
          </div>
          <p className="text-sm leading-relaxed">{successLooksLike}</p>
        </div>
      </CardContent>
    </Card>
  );
};
