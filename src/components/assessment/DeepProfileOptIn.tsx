import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap } from 'lucide-react';

interface DeepProfileOptInProps {
  onStart: () => void;
  onSkip: () => void;
}

export const DeepProfileOptIn: React.FC<DeepProfileOptInProps> = ({
  onStart,
  onSkip,
}) => {
  return (
    <div className="bg-background fixed inset-0 flex items-center justify-center px-4 overflow-hidden">
      <Card className="max-w-md w-full shadow-lg border rounded-xl">
        <CardContent className="p-5 sm:p-8">
          {/* Minimal Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
              <Zap className="h-4 w-4" />
              <span>10x personalization</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Quick personalization?
            </h2>
            <p className="text-sm text-muted-foreground">
              10 more questions = prompts tailored to your exact workflow.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              variant="cta"
              size="lg"
              className="w-full rounded-xl min-h-[48px]"
              onClick={onStart}
            >
              Yes, personalize it
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <button
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={onSkip}
            >
              Skip for now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
