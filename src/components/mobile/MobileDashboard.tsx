import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { HeroStatusCard } from './HeroStatusCard';
import { PriorityCardStack } from './PriorityCardStack';
import { FloatingActionButton } from './FloatingActionButton';
import { BottomSheet } from './BottomSheet';
import { StrategicPulseSheet } from './StrategicPulseSheet';
import { ActionQueueSheet } from './ActionQueueSheet';
import { LearningEngineSheet } from './LearningEngineSheet';
import { CompetitiveIntelligenceSheet } from './CompetitiveIntelligenceSheet';
import { DecisionPrepSheet } from './DecisionPrepSheet';
import { SideDrawer } from './SideDrawer';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Button } from '@/components/ui/button';

interface MobileDashboardProps {
  user: any;
  baselineData: any;
  weeklyAction: any;
  dailyPrompt: any;
  recentActivity: any;
  onNavigate: (path: string) => void;
}

type SheetType = 'strategic-pulse' | 'action-queue' | 'learning' | 'competitive-intel' | 'decision-prep' | null;

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  user,
  baselineData,
  weeklyAction,
  dailyPrompt,
  recentActivity,
  onNavigate,
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [priorityCards, setPriorityCards] = useState<any[]>([]);
  const { startListening, stopListening, isListening, transcript, isProcessing } = useVoiceInput();

  // Calculate hero status from baseline data
  const heroStatus = React.useMemo(() => {
    if (!baselineData) {
      return {
        tier: 'Emerging',
        trend: 'stable' as const,
        percentile: 50,
        riskLevel: 'medium' as const,
        alertCount: 0,
        actionCount: 0,
      };
    }

    const tier = baselineData.benchmarkTier || 'Emerging';
    const score = baselineData.benchmarkScore || 50;
    const percentile = Math.round((score / 100) * 100);
    
    // Determine risk level based on score and tensions
    const tensions = baselineData.tensions || [];
    const risks = baselineData.riskSignals || [];
    const riskLevel = risks.some((r: any) => r.level === 'high') 
      ? 'high' 
      : risks.some((r: any) => r.level === 'medium')
      ? 'medium'
      : 'low';

    return {
      tier,
      trend: 'stable' as const, // TODO: Calculate from historical data
      percentile: Math.max(1, Math.min(99, percentile)),
      riskLevel,
      alertCount: risks.filter((r: any) => r.level === 'high' || r.level === 'medium').length,
      actionCount: weeklyAction ? 1 : 0,
    };
  }, [baselineData, weeklyAction]);

  // Build priority cards
  useEffect(() => {
    const cards: any[] = [];

    // Add weekly action as priority card
    if (weeklyAction?.action_text) {
      cards.push({
        id: 'weekly-action',
        type: 'action',
        title: "This Week's Focus",
        description: weeklyAction.action_text,
        priority: 'high',
        metadata: weeklyAction.why_text,
      });
    }

    // Add top tension as alert
    if (baselineData?.tensions?.[0]) {
      cards.push({
        id: 'top-tension',
        type: 'alert',
        title: 'Strategic Tension',
        description: baselineData.tensions[0].summary_line,
        priority: 'medium',
      });
    }

    // Add top risk signal
    if (baselineData?.riskSignals?.[0]) {
      cards.push({
        id: 'top-risk',
        type: 'alert',
        title: 'Risk Signal',
        description: baselineData.riskSignals[0].description,
        priority: baselineData.riskSignals[0].level === 'high' ? 'high' : 'medium',
      });
    }

    setPriorityCards(cards);
  }, [baselineData, weeklyAction]);

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('status') || lowerCommand.includes('pulse')) {
      setActiveSheet('strategic-pulse');
    } else if (lowerCommand.includes('action') || lowerCommand.includes('queue')) {
      setActiveSheet('action-queue');
    } else if (lowerCommand.includes('learning') || lowerCommand.includes('provocation')) {
      setActiveSheet('learning');
    } else if (lowerCommand.includes('competitive') || lowerCommand.includes('intelligence')) {
      setActiveSheet('competitive-intel');
    } else if (lowerCommand.includes('prep') || lowerCommand.includes('prepare')) {
      setActiveSheet('decision-prep');
    } else if (lowerCommand.includes('menu') || lowerCommand.includes('drawer')) {
      setIsDrawerOpen(true);
    }
  };

  // Process voice transcript when available
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleVoiceCommand(transcript);
      // Clear transcript after processing
      setTimeout(() => {
        // Transcript will be cleared by useVoiceInput hook
      }, 100);
    }
  }, [transcript, isListening, isProcessing]);

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'status':
        setActiveSheet('strategic-pulse');
        break;
      case 'actions':
        setActiveSheet('action-queue');
        break;
      case 'intelligence':
        setActiveSheet('competitive-intel');
        break;
      case 'prep':
        setActiveSheet('decision-prep');
        break;
    }
  };

  const handleNavigate = (path: string) => {
    if (path === 'voice-capture') {
      // Trigger voice capture mode in parent
      window.dispatchEvent(new CustomEvent('open-voice-capture'));
    } else {
      onNavigate(path);
    }
  };

  const handleCardTap = (card: any) => {
    if (card.type === 'action') {
      setActiveSheet('action-queue');
    } else {
      setActiveSheet('strategic-pulse');
    }
  };

  const handleCardDismiss = (cardId: string) => {
    setPriorityCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleCardSnooze = (cardId: string) => {
    // TODO: Implement snooze logic
    console.log('Snooze card:', cardId);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onNavigate={onNavigate}
        onSheetOpen={(sheet) => {
          setActiveSheet(sheet as SheetType);
          setIsDrawerOpen(false);
        }}
      />

      {/* Swipe to open drawer gesture area */}
      <div
        className="fixed left-0 top-0 bottom-0 w-4 z-30"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch.clientX < 20) {
            setIsDrawerOpen(true);
          }
        }}
      />

      {/* Header with Menu Button */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          {user?.user_metadata?.first_name || 'Dashboard'}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if ('vibrate' in navigator) {
              navigator.vibrate(10);
            }
            setIsDrawerOpen(true);
          }}
          className="h-10 w-10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="px-4 pt-2 pb-6 space-y-6">
        {/* Hero Status Card */}
        <HeroStatusCard
          {...heroStatus}
          onClick={() => setActiveSheet('strategic-pulse')}
        />

        {/* Priority Card Stack */}
        <PriorityCardStack
          cards={priorityCards}
          onCardTap={handleCardTap}
          onCardDismiss={handleCardDismiss}
          onCardSnooze={handleCardSnooze}
        />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onVoiceClick={handleVoiceClick}
        onQuickActionClick={handleQuickAction}
        isListening={isListening}
        isProcessing={isProcessing}
      />

      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={activeSheet === 'strategic-pulse'}
        onClose={() => setActiveSheet(null)}
        title="Strategic Pulse"
        height="large"
      >
        <StrategicPulseSheet
          baselineData={baselineData}
          weeklyAction={weeklyAction}
          recentActivity={recentActivity}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'action-queue'}
        onClose={() => setActiveSheet(null)}
        title="Action Queue"
        height="large"
      >
        <ActionQueueSheet
          weeklyAction={weeklyAction}
          onNavigate={handleNavigate}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'learning'}
        onClose={() => setActiveSheet(null)}
        title="Learning Engine"
        height="medium"
      >
        <LearningEngineSheet
          dailyPrompt={dailyPrompt}
          onNavigate={onNavigate}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'competitive-intel'}
        onClose={() => setActiveSheet(null)}
        title="Competitive Intelligence"
        height="large"
      >
        <CompetitiveIntelligenceSheet baselineData={baselineData} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'decision-prep'}
        onClose={() => setActiveSheet(null)}
        title="Decision Prep"
        height="large"
      >
        <DecisionPrepSheet
          context={{ type: 'board', title: 'Board Meeting Prep' }}
          baselineData={baselineData}
        />
      </BottomSheet>
    </div>
  );
};
