import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Assessment {
  id: string;
  created_at: string;
  benchmark_score: number;
  benchmark_tier: string;
  source: string;
  leader: {
    name: string;
    email: string;
    company: string;
  };
}

interface AssessmentHistoryProps {
  userEmail: string;
  onViewAssessment: (assessmentId: string) => void;
}

export function AssessmentHistory({ userEmail, onViewAssessment }: AssessmentHistoryProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, [userEmail]);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leader_assessments')
        .select(`
          id,
          created_at,
          benchmark_score,
          benchmark_tier,
          source,
          leader:leaders(name, email, company)
        `)
        .eq('leaders.email', userEmail)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAssessments(data as any || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'AI-Orchestrator': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'AI-Confident': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AI-Aware': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Assessments Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete your first AI leadership assessment to see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Your Assessment History</h2>
      {assessments.map((assessment) => (
        <Card key={assessment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <Badge className={getTierColor(assessment.benchmark_tier)}>
                    {assessment.benchmark_tier}
                  </Badge>
                  <span className="text-2xl font-bold">{assessment.benchmark_score}/100</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(assessment.created_at), 'MMM d, yyyy')}
                </div>

                {assessment.leader?.company && (
                  <div className="text-sm text-muted-foreground">
                    {assessment.leader.company}
                  </div>
                )}

                <Badge variant="outline" className="text-xs">
                  {assessment.source === 'quiz' ? 'Quiz' : 'Voice'} Assessment
                </Badge>
              </div>

              <Button
                onClick={() => onViewAssessment(assessment.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
