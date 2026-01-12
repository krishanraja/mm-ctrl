import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, DollarSign, Target, CheckCircle2, Circle, FileText, Volume2, Video, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';

interface Prescription {
  id: string;
  week_start_date: string;
  decision_text: string;
  why_text: string | null;
  implementation_steps: string[];
  time_estimate: string | null;
  cost_estimate: string | null;
  status: string;
  delivery_content: any;
  user_feedback?: string | null;
}

interface Profile {
  id: string;
  delivery_preference: string;
}

interface WeeklyPrescriptionProps {
  prescription: Prescription;
  profile: Profile;
  onUpdate: (prescription: Prescription) => void;
}

export function WeeklyPrescription({ prescription, profile, onUpdate }: WeeklyPrescriptionProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(prescription.delivery_format || 'text');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const toggleStep = async (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  const markComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      const { data, error } = await supabase
        .from('operator_prescriptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', prescription.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onUpdate({ ...prescription, ...data });
      }
    } catch (error) {
      console.error('Error marking prescription complete:', error);
      alert('Failed to mark as complete. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const markSkipped = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      const { data, error } = await supabase
        .from('operator_prescriptions')
        .update({
          status: 'skipped',
        })
        .eq('id', prescription.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onUpdate({ ...prescription, ...data });
      }
    } catch (error) {
      console.error('Error marking prescription skipped:', error);
      alert('Failed to mark as skipped. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const steps = Array.isArray(prescription.implementation_steps)
    ? prescription.implementation_steps
    : [];

  const isCompleted = prescription.status === 'completed';

  return (
    <Card className="mb-8 border-primary/20">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                This Week's Decision
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Week of {new Date(prescription.week_start_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
          {isCompleted && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {/* Decision */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {prescription.decision_text}
          </h3>
          {prescription.why_text && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {prescription.why_text}
            </p>
          )}
        </div>

        {/* Format Selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Delivery Format
          </label>
          <div className="flex gap-2">
            <Button
              variant={selectedFormat === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat('text')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Text
            </Button>
            <Button
              variant={selectedFormat === 'voice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat('voice')}
              className="flex-1"
              disabled
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Voice
              <span className="ml-1 text-xs opacity-50">(Coming soon)</span>
            </Button>
            <Button
              variant={selectedFormat === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat('video')}
              className="flex-1"
              disabled
            >
              <Video className="h-4 w-4 mr-2" />
              Video
              <span className="ml-1 text-xs opacity-50">(Coming soon)</span>
            </Button>
          </div>
        </div>

        {/* Estimates */}
        <div className="flex flex-wrap gap-4 mb-6">
          {prescription.time_estimate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{prescription.time_estimate}</span>
            </div>
          )}
          {prescription.cost_estimate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{prescription.cost_estimate}</span>
            </div>
          )}
        </div>

        {/* Implementation Steps */}
        {steps.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Implementation Steps
            </h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => toggleStep(index)}
                >
                  <div className="mt-0.5">
                    {completedSteps.has(index) ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${completedSteps.has(index) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isCompleted && prescription.status !== 'skipped' && (
          <div className="flex gap-3">
            <Button
              onClick={markComplete}
              disabled={isCompleting}
              className="flex-1"
              size="lg"
            >
              {isCompleting ? 'Marking as complete...' : 'Mark as Complete'}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={markSkipped}
              disabled={isCompleting}
              variant="outline"
              size="lg"
            >
              Skip
            </Button>
          </div>
        )}

        {/* Feedback Section */}
        {isCompleted && !showFeedback && (
          <Button
            onClick={() => setShowFeedback(true)}
            variant="outline"
            className="w-full mt-4"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Share feedback (optional)
          </Button>
        )}

        {showFeedback && (
          <div className="mt-4 space-y-3">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How did this decision work out? What impact did it have?"
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!feedback.trim()) {
                    setShowFeedback(false);
                    return;
                  }

                  setIsSubmittingFeedback(true);
                  try {
                    const { error } = await supabase
                      .from('operator_prescriptions')
                      .update({ user_feedback: feedback.trim() })
                      .eq('id', prescription.id);

                    if (error) throw error;

                    setShowFeedback(false);
                    setFeedback('');
                    onUpdate({ ...prescription, user_feedback: feedback.trim() });
                  } catch (error) {
                    console.error('Error submitting feedback:', error);
                    alert('Failed to submit feedback. Please try again.');
                  } finally {
                    setIsSubmittingFeedback(false);
                  }
                }}
                disabled={isSubmittingFeedback}
                className="flex-1"
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Show existing feedback */}
        {isCompleted && prescription.user_feedback && !showFeedback && (
          <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Your Feedback</span>
            </div>
            <p className="text-sm text-muted-foreground">{prescription.user_feedback}</p>
            <Button
              onClick={() => {
                setFeedback(prescription.user_feedback || '');
                setShowFeedback(true);
              }}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
