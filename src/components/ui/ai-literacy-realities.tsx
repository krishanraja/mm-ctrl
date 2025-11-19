import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CheckCircle2 } from 'lucide-react';

const realities = [
  {
    text: 'Trained AI users see 40%+ productivity gains vs. 10% for untrained users',
    emphasis: '40%+ productivity gains',
  },
  {
    text: 'Skills gaps cost companies $150K+ per year in lost opportunity',
    emphasis: '$150K+ per year',
  },
  {
    text: '70% of AI pilots fail due to poor change management, not technology',
    emphasis: '70% of AI pilots fail',
  },
  {
    text: 'Organizations with clear AI governance see 3x higher adoption rates',
    emphasis: '3x higher adoption',
  },
  {
    text: 'Leaders who dedicate 10%+ time to AI initiatives achieve 2x faster time-to-value',
    emphasis: '2x faster time-to-value',
  },
];

export const AILiteracyRealities = React.memo(() => {
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Leadership Realities</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {realities.map((reality, index) => (
            <li key={index} className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">
                {reality.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});

AILiteracyRealities.displayName = 'AILiteracyRealities';
