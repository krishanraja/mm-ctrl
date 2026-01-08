/**
 * Mindmaker Control - Today's Tension Selection
 * 
 * Selects the highest priority tension, rotates daily.
 * Uses localStorage to track last shown date.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aggregateLeaderResults, LeaderTension, LeaderRiskSignal, LeaderOrgScenario } from '@/utils/aggregateLeaderResults';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';

export interface TodaysContent {
  type: 'tension' | 'risk' | 'scenario';
  title: string;
  summary: string;
  dimension?: string;
  priority: number;
}

interface UseTodaysTensionResult {
  content: TodaysContent | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const STORAGE_KEY = 'mindmaker_last_tension_date';
const STORAGE_INDEX_KEY = 'mindmaker_tension_index';

function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function mapTensionToContent(tension: LeaderTension): TodaysContent {
  return {
    type: 'tension',
    title: "Today's tension",
    summary: tension.summary_line,
    dimension: tension.dimension_key,
    priority: tension.priority_rank,
  };
}

function mapRiskToContent(risk: LeaderRiskSignal): TodaysContent {
  return {
    type: 'risk',
    title: "Risk to watch",
    summary: risk.description,
    dimension: risk.risk_key,
    priority: risk.priority_rank,
  };
}

function mapScenarioToContent(scenario: LeaderOrgScenario): TodaysContent {
  return {
    type: 'scenario',
    title: "What's coming",
    summary: scenario.summary,
    dimension: scenario.scenario_key,
    priority: scenario.priority_rank,
  };
}

export function useTodaysTension(): UseTodaysTensionResult {
  const [content, setContent] = useState<TodaysContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mounted guard to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

  const loadContent = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { assessmentId } = getPersistedAssessmentId();
      
      if (!assessmentId) {
        // No assessment yet - show default message
        if (!isMountedRef.current) return;
        setContent({
          type: 'tension',
          title: "Today's tension",
          summary: "Complete your baseline to see personalized tensions and insights.",
          priority: 0,
        });
        setIsLoading(false);
        return;
      }

      const results = await aggregateLeaderResults(assessmentId, false);
      
      // Guard after async operation
      if (!isMountedRef.current) return;
      
      // Defensive: ensure results has expected shape
      const tensions = results?.tensions ?? [];
      const riskSignals = results?.riskSignals ?? [];
      const orgScenarios = results?.orgScenarios ?? [];
      
      // Combine all content types into a single pool
      const allContent: TodaysContent[] = [];
      
      tensions.forEach(t => allContent.push(mapTensionToContent(t)));
      riskSignals.forEach(r => allContent.push(mapRiskToContent(r)));
      orgScenarios.forEach(s => allContent.push(mapScenarioToContent(s)));
      
      if (allContent.length === 0) {
        if (!isMountedRef.current) return;
        setContent({
          type: 'tension',
          title: "Today's tension",
          summary: "Your diagnostic is generating insights. Check back shortly.",
          priority: 0,
        });
        setIsLoading(false);
        return;
      }

      // Sort by priority (lower = higher priority)
      allContent.sort((a, b) => a.priority - b.priority);

      // Check if we need to rotate
      const lastDate = localStorage.getItem(STORAGE_KEY);
      const todayKey = getDateKey();
      let currentIndex = parseInt(localStorage.getItem(STORAGE_INDEX_KEY) || '0', 10);

      if (lastDate !== todayKey) {
        // New day - advance to next item
        currentIndex = (currentIndex + 1) % allContent.length;
        localStorage.setItem(STORAGE_KEY, todayKey);
        localStorage.setItem(STORAGE_INDEX_KEY, currentIndex.toString());
      }

      // Select the content for today
      const selectedContent = allContent[currentIndex % allContent.length];
      
      if (!isMountedRef.current) return;
      setContent(selectedContent);

    } catch (err) {
      console.error('Failed to load today\'s tension:', err);
      if (!isMountedRef.current) return;
      setError('Unable to load insights');
      setContent({
        type: 'tension',
        title: "Today's tension",
        summary: "Unable to load your personalized content right now.",
        priority: 0,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadContent();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadContent]);

  const refresh = useCallback(() => {
    // Force rotation to next item
    const currentIndex = parseInt(localStorage.getItem(STORAGE_INDEX_KEY) || '0', 10);
    localStorage.setItem(STORAGE_INDEX_KEY, (currentIndex + 1).toString());
    loadContent();
  }, [loadContent]);

  return { content, isLoading, error, refresh };
}
