import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressChart } from '@/components/progress/ProgressChart';
import { PeerBenchmark } from '@/components/progress/PeerBenchmark';
import { AdaptivePrompts } from '@/components/missions/AdaptivePrompts';

export default function Progress() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <h1 className="text-xl font-semibold text-foreground">Your Progress</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Track your AI leadership growth over time
      </p>

      <ProgressChart />

      <div className="mt-6">
        <PeerBenchmark />
      </div>

      <div className="mt-6">
        <AdaptivePrompts />
      </div>
    </div>
  );
}
