import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Pattern {
  id: string;
  pattern_type: string;
  description: string;
  confidence_score: number;
  surfaced_at: string;
  acknowledged_at: string | null;
}

interface PatternInsightProps {
  onAcknowledge?: () => void;
}

export const PatternInsight: React.FC<PatternInsightProps> = ({ onAcknowledge }) => {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPattern();
  }, []);

  const loadPattern = async () => {
    try {
      // Get most recent unacknowledged pattern
      const { data, error } = await supabase
        .from('leader_patterns')
        .select('*')
        .is('acknowledged_at', null)
        .order('surfaced_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setPattern(data[0]);
      }
    } catch (err) {
      console.warn('Could not load pattern:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!pattern) return;

    try {
      await supabase
        .from('leader_patterns')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', pattern.id);

      setPattern(null);
      onAcknowledge?.();
    } catch (err) {
      console.error('Error acknowledging pattern:', err);
    }
  };

  if (loading) {
    return null;
  }

  if (!pattern) {
    return null;
  }

  const getPatternIcon = () => {
    switch (pattern.pattern_type) {
      case 'avoidance':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'strength':
        return <TrendingUp className="h-5 w-5 text-emerald-600" />;
      default:
        return <Brain className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPatternColor = () => {
    switch (pattern.pattern_type) {
      case 'avoidance':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'strength':
        return 'border-emerald-500/30 bg-emerald-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <Card className={`mb-6 border rounded-2xl ${getPatternColor()} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-2 bg-background/50 rounded-lg">
            {getPatternIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Your Pattern</h3>
              <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full text-muted-foreground">
                {Math.round(pattern.confidence_score * 100)}% confidence
              </span>
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              {pattern.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledge}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Acknowledge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
