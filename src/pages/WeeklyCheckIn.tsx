import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { CheckCircle, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';

export default function WeeklyCheckIn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkInText, setCheckInText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reflection, setReflection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user?.id || !checkInText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Save check-in
      const { data: checkIn, error: saveError } = await supabase
        .from('leader_check_ins')
        .insert({
          leader_id: user.id,
          check_in_text: checkInText.trim(),
          check_in_type: 'weekly'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Generate AI reflection (simplified - would call edge function in production)
      const aiReflection = {
        reflection: "I noticed you're focusing on team enablement this week. That's a smart priority - AI adoption succeeds when teams feel supported, not surveilled.",
        recommendation: "Based on your progress, I'd suggest creating a 'safe-to-experiment' environment. Start with low-stakes AI experiments before moving to mission-critical workflows.",
        suggestedMove: "This week: Host a 30-minute 'AI Show & Tell' where team members demo any AI tool they've tried, no judgment."
      };

      // Update check-in with AI response
      await supabase
        .from('leader_check_ins')
        .update({
          ai_reflection: aiReflection.reflection,
          ai_recommendation: aiReflection.recommendation,
          ai_suggested_move: aiReflection.suggestedMove
        })
        .eq('id', checkIn.id);

      setReflection(aiReflection);

    } catch (err) {
      console.error('Failed to process check-in:', err);
      setError('Failed to process check-in. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleAcceptMove = async () => {
    if (!reflection) return;

    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 7);

    await supabase.from('leader_missions').insert({
      leader_id: user!.id,
      mission_text: reflection.suggestedMove,
      check_in_date: checkInDate.toISOString(),
      status: 'active'
    });

    navigate('/dashboard?mission_accepted=true');
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Please sign in to access weekly check-ins</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 text-center">
          <img src="/mindmaker-favicon.png" alt="Mindmaker" className="h-8 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Weekly Check-In</h1>
          <p className="text-muted-foreground">Reflect on your AI leadership journey this week</p>
        </div>

        {!reflection ? (
          <Card>
            <CardHeader>
              <CardTitle>What changed this week?</CardTitle>
              <CardDescription>
                Share what happened, what you learned, or what's on your mind. I'll analyze your progress and suggest your next move.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={checkInText}
                onChange={(e) => setCheckInText(e.target.value)}
                placeholder="E.g., 'Had 2 productive conversations with my CTO about AI strategy. Team is excited but unclear on where to start. Realized we need a clearer framework for evaluating AI opportunities...'"
                rows={8}
                className="resize-none"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!checkInText.trim() || isProcessing}
                className="w-full bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black font-medium"
              >
                {isProcessing ? 'Analyzing...' : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Reflection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-2 border-blue-500/30 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  My Reflection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{reflection.reflection}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/30 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-purple-600" />
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{reflection.recommendation}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#00D9B6]/30 bg-[#00D9B6]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#00D9B6]" />
                  Suggested Next Move
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground font-medium">{reflection.suggestedMove}</p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAcceptMove}
                    className="flex-1 bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black"
                  >
                    Accept This Mission
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    I'll Think About It
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
