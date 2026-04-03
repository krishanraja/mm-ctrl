import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { tierConfig } from './types';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface BenchmarkScoreCardProps {
  results: AggregatedLeaderResults;
  firstName: string;
  onExportPDF: () => void;
}

export const BenchmarkScoreCard: React.FC<BenchmarkScoreCardProps> = ({
  results,
  firstName,
  onExportPDF,
}) => {
  const config = tierConfig[results.benchmarkTier as keyof typeof tierConfig] || tierConfig['AI-Emerging'];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${config.gradient} p-1 flex-shrink-0`}>
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{results.benchmarkScore}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  {firstName}'s AI Literacy Diagnostic
                </h2>
                <Badge className={config.badgeStyle}>
                  {results.benchmarkTier}
                </Badge>
              </div>
              {results.hasFullDiagnostic && (
                <Button
                  onClick={onExportPDF}
                  variant="outline"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
