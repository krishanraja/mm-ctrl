import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressChart } from '@/components/progress/ProgressChart';
import { PeerBenchmark } from '@/components/progress/PeerBenchmark';
import { AdaptivePrompts } from '@/components/missions/AdaptivePrompts';

export default function Progress() {
  const navigate = useNavigate();

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Your Progress</h1>
          <p className="text-xs text-muted-foreground">
            Track your AI leadership growth over time
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <ProgressChart />
          <PeerBenchmark />
          <AdaptivePrompts />
        </div>
      </main>
    </div>
  );
}
