import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VoiceCapture } from './VoiceCapture';
import { COMPASS_QUESTIONS } from '@/data/compassQuestions';
import { CompassResults } from '@/types/voice';
import { Loader2, Mic, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { cn } from '@/lib/utils';

interface CompassModuleProps {
  sessionId: string;
  onComplete: (results: CompassResults) => void;
}

export const CompassModule = React.memo<CompassModuleProps>(({
  sessionId,
  onComplete
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');

  const currentQuestion = COMPASS_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / COMPASS_QUESTIONS.length) * 100;

  const handleTranscriptReady = (transcript: string) => {
    setTranscripts({
      ...transcripts,
      [currentQuestion.id]: transcript
    });
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    setTranscripts({
      ...transcripts,
      [currentQuestion.id]: textInput.trim()
    });
    setTextInput('');
  };

  const handleSwitchToText = () => {
    setInputMode('text');
  };

  const handleNext = async () => {
    if (!transcripts[currentQuestion.id]) {
      toast({
        title: 'Please record your answer',
        description: 'Tap the microphone to record your answer first.',
        variant: 'destructive'
      });
      return;
    }

    if (currentQuestionIndex < COMPASS_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, analyze
      await analyzeCompass();
    }
  };

  const analyzeCompass = async () => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await invokeEdgeFunction<CompassResults>('compass-analyze', 
        { sessionId, transcripts },
        { logPrefix: '🧭' }
      );

      if (error) throw error;

      if (data) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Error analyzing compass:', error);
      toast({
        title: 'Analysis failed',
        description: 'Failed to analyze your responses. Please try again.',
        variant: 'destructive'
      });
      setIsAnalyzing(false);
    }
  };

  const handleError = (error: string) => {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive'
    });
  };

  if (isAnalyzing) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="p-12 text-center space-y-6">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Analyzing your leadership profile...
            </h3>
            <p className="text-muted-foreground">
              This will just take a moment
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">
            Question {currentQuestionIndex + 1} of {COMPASS_QUESTIONS.length}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="p-6 space-y-4">
        <div>
          <p className="text-sm text-primary font-medium mb-2">
            {currentQuestion.name}
          </p>
          <h3 className="text-xl font-semibold mb-2">
            {currentQuestion.question}
          </h3>
          <p className="text-sm text-muted-foreground italic">
            {currentQuestion.example}
          </p>
        </div>
      </Card>

      {/* Voice or Text capture */}
      {inputMode === 'voice' ? (
        <VoiceCapture
          key={currentQuestion.id}
          promptHint={`Record your answer (max ${currentQuestion.timeLimit}s)`}
          timeLimit={currentQuestion.timeLimit}
          onTranscriptReady={handleTranscriptReady}
          onError={handleError}
          sessionId={sessionId}
          moduleName="compass"
          onUseText={handleSwitchToText}
        />
      ) : (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Type your answer</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputMode('voice')}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Use voice
            </Button>
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={currentQuestion.example}
            rows={4}
            className={cn(
              'w-full px-4 py-3 rounded-xl',
              'bg-muted border border-border',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              'resize-none text-sm',
            )}
          />
          <Button
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            Submit Answer
          </Button>
          {transcripts[currentQuestion.id] && (
            <div className="w-full p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground">{transcripts[currentQuestion.id]}</p>
            </div>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!transcripts[currentQuestion.id]}
        >
          {currentQuestionIndex === COMPASS_QUESTIONS.length - 1 ? 'Analyze →' : 'Next →'}
        </Button>
      </div>
    </div>
  );
});

CompassModule.displayName = 'CompassModule';
