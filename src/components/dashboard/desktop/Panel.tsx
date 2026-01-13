/**
 * Panel Component
 * 
 * Panel container for desktop dashboard content.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelProps {
  title: string;
  children: React.ReactNode;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <Card className="border rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
