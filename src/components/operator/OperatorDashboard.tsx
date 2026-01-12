import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, DollarSign, Target, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { WeeklyPrescription } from './WeeklyPrescription';
import { DecisionAdvisor } from './DecisionAdvisor';

interface OperatorDashboardProps {
  user: SupabaseUser | null;
  onNavigate: (path: string) => void;
}

interface OperatorProfile {
  id: string;
  business_lines: any[];
  inbox_count: number;
  technical_comfort: number;
  monthly_budget: string;
  top_pain_points: string[];
  delivery_preference: string;
}

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
}

export function OperatorDashboard({ user, onNavigate }: OperatorDashboardProps) {
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load operator profile and current prescription
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!user?.id) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        // Get operator profile
        const { data: profileData, error: profileError } = await supabase
          .from('operator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profileData) {
          console.warn('No operator profile found');
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) setProfile(profileData);

        // Get current week's prescription
        const weekStart = (() => {
          const today = new Date();
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(today.setDate(diff));
          return monday.toISOString().split('T')[0];
        })();
        const { data: prescription, error: prescriptionError } = await supabase
          .from('operator_prescriptions')
          .select('*')
          .eq('operator_profile_id', profileData.id)
          .eq('week_start_date', weekStart)
          .maybeSingle();

        if (prescriptionError) {
          console.warn('Error loading prescription:', prescriptionError);
        }

        // Get prescription history
        const { data: history, error: historyError } = await supabase
          .from('operator_prescriptions')
          .select('*')
          .eq('operator_profile_id', profileData.id)
          .order('week_start_date', { ascending: false })
          .limit(10);

        if (historyError) {
          console.warn('Error loading prescription history:', historyError);
        }

        if (isMounted) {
          setCurrentPrescription(prescription);
          setPrescriptionHistory(history || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading operator data:', error);
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [user]);

  const generatePrescription = useCallback(async () => {
    if (!user?.id || isGenerating) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-prescription', {
        body: {},
      });

      if (error) throw error;

      if (data?.prescription) {
        setCurrentPrescription(data.prescription);
      }
    } catch (error) {
      console.error('Error generating prescription:', error);
      alert('Failed to generate prescription. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [user, isGenerating]);

  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No operator profile found. Please complete the intake first.
            </p>
            <Button onClick={() => onNavigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your Weekly Decision
          </h1>
          <p className="text-muted-foreground">
            One clear action to take this week, personalized to your business mix
          </p>
        </div>

        {/* Current Prescription */}
        {currentPrescription ? (
          <WeeklyPrescription
            prescription={currentPrescription}
            profile={profile}
            onUpdate={(updated) => setCurrentPrescription(updated)}
          />
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No prescription for this week
              </h3>
              <p className="text-muted-foreground mb-4">
                Generate your first weekly decision to get started.
              </p>
              <Button
                onClick={generatePrescription}
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? 'Generating...' : 'Generate This Week\'s Decision'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Decision Advisor */}
        <div className="mt-8">
          <DecisionAdvisor operatorProfileId={profile.id} />
        </div>

        {/* Prescription History */}
        {prescriptionHistory.length > 1 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Decision History
              </h2>
              <div className="space-y-3">
                {prescriptionHistory
                  .filter(p => p.id !== currentPrescription?.id)
                  .slice(0, 5)
                  .map((prescription) => (
                    <div
                      key={prescription.id}
                      className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              Week of {new Date(prescription.week_start_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {prescription.status === 'completed' && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                Completed
                              </Badge>
                            )}
                            {prescription.status === 'skipped' && (
                              <Badge variant="outline" className="text-xs">
                                Skipped
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prescription.decision_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Context Summary */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Business Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Lines</h3>
                <div className="space-y-1">
                  {Array.isArray(profile.business_lines) && profile.business_lines.length > 0 ? (
                    profile.business_lines.map((line: any, index: number) => (
                      <div key={index} className="text-sm text-foreground">
                        {line.name || `Business ${index + 1}`}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No business lines added</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Top Pain Points</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.top_pain_points && profile.top_pain_points.length > 0 ? (
                    profile.top_pain_points.map((point: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {point}
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No pain points specified</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

