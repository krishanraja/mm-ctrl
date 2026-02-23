import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Target, CheckCircle } from 'lucide-react';

export interface Mission {
  id: string;
  leader_id: string;
  assessment_id: string | null;
  mission_text: string;
  mission_type: string | null;
  start_date: string;
  check_in_date: string;
  status: string;
  created_at: string;
}

interface FirstMoveSelectorProps {
  leaderId: string;
  assessmentId: string;
  recommendedMoves: string[]; // From AI generation (first_moves)
  onSelect: (mission: Mission) => void;
  onSkip?: () => void; // Optional skip callback
}

export function FirstMoveSelector({ 
  leaderId, 
  assessmentId, 
  recommendedMoves,
  onSelect,
  onSkip
}: FirstMoveSelectorProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [checkInDays, setCheckInDays] = useState(14); // Default 2 weeks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleConfirm = async () => {
    if (!selectedMove) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + checkInDays);
      
      const { data, error: insertError } = await supabase
        .from('leader_missions')
        .insert({
          leader_id: leaderId,
          assessment_id: assessmentId,
          mission_text: selectedMove,
          check_in_date: checkInDate.toISOString(),
          status: 'active'
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      if (data) {
        onSelect(data as Mission);
      }
    } catch (err) {
      console.error('Failed to create mission:', err);
      setError('Failed to save your mission. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-6 w-6 text-[#00D9B6]" />
            <DialogTitle className="text-2xl">Pick Your First Move</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Before seeing your full results, commit to <strong>ONE action</strong> you'll take this week.
            I'll check in with you to see how it went.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-4">
          {recommendedMoves.map((move, idx) => (
            <Card 
              key={idx}
              className={cn(
                "p-4 cursor-pointer border-2 transition-all",
                selectedMove === move 
                  ? "border-[#00D9B6] bg-[#00D9B6]/10" 
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              )}
              onClick={() => setSelectedMove(move)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  selectedMove === move 
                    ? "border-[#00D9B6] bg-[#00D9B6]" 
                    : "border-gray-300"
                )}>
                  {selectedMove === move && (
                    <CheckCircle className="h-3 w-3 text-white" fill="white" />
                  )}
                </div>
                <p className="text-sm leading-relaxed">{move}</p>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="check-in-days" className="text-base font-medium">
            When should I check in?
          </Label>
          <Select 
            value={checkInDays.toString()} 
            onValueChange={(v) => setCheckInDays(parseInt(v))}
          >
            <SelectTrigger id="check-in-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">1 week</SelectItem>
              <SelectItem value="14">2 weeks (recommended)</SelectItem>
              <SelectItem value="21">3 weeks</SelectItem>
              <SelectItem value="30">1 month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          {onSkip && (
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              disabled={isSubmitting}
              className="mr-auto"
            >
              Skip for Now
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            disabled={!selectedMove || isSubmitting}
            className="bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black font-medium"
          >
            {isSubmitting ? 'Saving...' : 'Commit to This Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
