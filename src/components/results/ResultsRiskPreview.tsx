import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { getRiskColor } from './ResultsScoreCard';

interface RiskSignal {
  risk_key?: string;
  level?: string;
  description: string;
  priority_rank?: number;
}

interface ResultsRiskPreviewProps {
  topRisks: RiskSignal[];
}

export const ResultsRiskPreview: React.FC<ResultsRiskPreviewProps> = ({ topRisks }) => {
  if (topRisks.length === 0) return null;

  return (
    <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-red-500">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Top Risk Signal</h3>
              <Badge className={getRiskColor(topRisks[0].level || 'medium')}>
                {topRisks[0].level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {topRisks[0].description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
