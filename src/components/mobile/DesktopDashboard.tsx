import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeroStatusCard } from './HeroStatusCard';
import { StrategicPulseSheet } from './StrategicPulseSheet';
import { ActionQueueSheet } from './ActionQueueSheet';
import { CompetitiveIntelligenceSheet } from './CompetitiveIntelligenceSheet';
import { DecisionPrepSheet } from './DecisionPrepSheet';
import { LearningEngineSheet } from './LearningEngineSheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DailyProvocation } from '@/components/dashboard/DailyProvocation';
import { PatternInsight } from '@/components/dashboard/PatternInsight';

interface DesktopDashboardProps {
  user: any;
  baselineData: any;
  weeklyAction: any;
  dailyPrompt: any;
  recentActivity: any;
  onNavigate: (path: string) => void;
}

type PanelType = 'strategic-pulse' | 'action-queue' | 'competitive-intel' | 'decision-prep' | 'learning' | null;

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  user,
  baselineData,
  weeklyAction,
  dailyPrompt,
  recentActivity,
  onNavigate,
}) => {
  const [activePanel, setActivePanel] = useState<PanelType>('strategic-pulse');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + number keys for quick navigation
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const key = e.key;
        if (key === '1') {
          e.preventDefault();
          setActivePanel('strategic-pulse');
        } else if (key === '2') {
          e.preventDefault();
          setActivePanel('action-queue');
        } else if (key === '3') {
          e.preventDefault();
          setActivePanel('competitive-intel');
        } else if (key === '4') {
          e.preventDefault();
          setActivePanel('decision-prep');
        } else if (key === '5') {
          e.preventDefault();
          setActivePanel('learning');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Calculate hero status
  const heroStatus = useMemo(() => {
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
    
    const tensions = baselineData.tensions || [];
    const risks = baselineData.riskSignals || [];
    const riskLevel = risks.some((r: any) => r.level === 'high') 
      ? 'high' 
      : risks.some((r: any) => r.level === 'medium')
      ? 'medium'
      : 'low';

    return {
      tier,
      trend: 'stable' as const,
      percentile: Math.max(1, Math.min(99, percentile)),
      riskLevel,
      alertCount: risks.filter((r: any) => r.level === 'high' || r.level === 'medium').length,
      actionCount: weeklyAction ? 1 : 0,
    };
  }, [baselineData, weeklyAction]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-30">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { id: 'strategic-pulse', label: 'Strategic Pulse', shortcut: '1' },
            { id: 'action-queue', label: 'Action Queue', shortcut: '2' },
            { id: 'competitive-intel', label: 'Competitive Intel', shortcut: '3' },
            { id: 'decision-prep', label: 'Decision Prep', shortcut: '4' },
            { id: 'learning', label: 'Learning Engine', shortcut: '5' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id as PanelType)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors group ${
                activePanel === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{item.label}</span>
                <kbd className="hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
                  ⌘{item.shortcut}
                </kbd>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {user?.user_metadata?.first_name || 'Dashboard'}
            </h1>
            {recentActivity && (
              <p className="text-sm text-muted-foreground">
                Last {recentActivity.type}: {recentActivity.date}
              </p>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Hero Status & Daily Content */}
            <div className="lg:col-span-1 space-y-6">
              <HeroStatusCard
                {...heroStatus}
                onClick={() => setActivePanel('strategic-pulse')}
              />

              {dailyPrompt && (
                <Card className="border rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Daily Provocation</h3>
                    <DailyProvocation
                      prompt={dailyPrompt}
                      onResponseSubmitted={() => window.location.reload()}
                    />
                  </CardContent>
                </Card>
              )}

              <PatternInsight />
            </div>

            {/* Right Column - Active Panel */}
            <div className="lg:col-span-2">
              <Card className="border rounded-2xl">
                <CardContent className="p-6">
                  {activePanel === 'strategic-pulse' && (
                    <StrategicPulseSheet
                      baselineData={baselineData}
                      weeklyAction={weeklyAction}
                      recentActivity={recentActivity}
                    />
                  )}
                  {activePanel === 'action-queue' && (
                    <ActionQueueSheet
                      weeklyAction={weeklyAction}
                      onNavigate={onNavigate}
                    />
                  )}
                  {activePanel === 'competitive-intel' && (
                    <CompetitiveIntelligenceSheet baselineData={baselineData} />
                  )}
                  {activePanel === 'decision-prep' && (
                    <DecisionPrepSheet
                      context={{ type: 'board', title: 'Board Meeting Prep' }}
                      baselineData={baselineData}
                    />
                  )}
                  {activePanel === 'learning' && (
                    <LearningEngineSheet
                      dailyPrompt={dailyPrompt}
                      baselineData={baselineData}
                      onNavigate={onNavigate}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
