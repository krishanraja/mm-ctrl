import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateMission } from '@/hooks/useMissions';
import { useAuth } from '@/components/auth/AuthProvider';

interface FirstMove {
  id?: string;
  move_number: number;
  content: string;
}

interface FirstMoveSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstMoves: FirstMove[];
  assessmentId?: string;
  onMissionCreated?: () => void;
}

const WEEK_OPTIONS = [
  { weeks: 1, label: '1 week' },
  { weeks: 2, label: '2 weeks' },
  { weeks: 3, label: '3 weeks' },
  { weeks: 4, label: '4 weeks' },
];

export function FirstMoveSelector({
  open,
  onOpenChange,
  firstMoves,
  assessmentId,
  onMissionCreated,
}: FirstMoveSelectorProps) {
  const { user } = useAuth();
  const { createMission, loading } = useCreateMission();
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState(2);
  const [step, setStep] = useState<'select' | 'schedule'>('select');

  const handleSelectMove = (idx: number) => {
    setSelectedMove(idx);
    setStep('schedule');
  };

  const handleCommit = async () => {
    if (selectedMove === null || !user?.id) return;

    const move = firstMoves[selectedMove];
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + selectedWeeks * 7);

    try {
      await createMission({
        missionText: move.content,
        checkInDate: checkInDate.toISOString().split('T')[0],
        assessmentId: assessmentId,
        firstMoveId: move.id,
      });
      onMissionCreated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create mission:', err);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  if (!firstMoves?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            {step === 'select' ? 'Choose Your First Move' : 'Set Your Check-in'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Pick ONE move to focus on. You can only have one active mission.'
              : 'When should we check in on your progress?'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-3 mt-2">
            {firstMoves.map((move, idx) => (
              <Card
                key={idx}
                className={cn(
                  'cursor-pointer transition-all border-2 hover:border-emerald-500/50',
                  selectedMove === idx
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-transparent'
                )}
                onClick={() => handleSelectMove(idx)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    >
                      {idx + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">
                        {move.content}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Skip for now
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {selectedMove !== null && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-3">
                  <p className="text-sm text-foreground">
                    {firstMoves[selectedMove].content}
                  </p>
                </CardContent>
              </Card>
            )}

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" />
                Check-in after:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WEEK_OPTIONS.map((opt) => (
                  <Button
                    key={opt.weeks}
                    variant={selectedWeeks === opt.weeks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedWeeks(opt.weeks)}
                    className="text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll email you on{' '}
                {new Date(
                  Date.now() + selectedWeeks * 7 * 24 * 60 * 60 * 1000
                ).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="default"
                onClick={handleCommit}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Saving...' : 'Commit to this move'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
