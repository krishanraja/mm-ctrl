/**
 * Pure function that maps Edge profile strengths/weaknesses
 * to personalized export recommendations for the Brief My AI page.
 */

import type { EdgeStrength, EdgeWeakness, ExportRecommendation } from '@/types/edge';
import type { ExportUseCase } from '@/types/memory';

const MAX_RECOMMENDATIONS = 3;

interface RecommendationCandidate {
  useCase: ExportUseCase;
  label: string;
  description: string;
  iconName: string;
  source: 'strength' | 'weakness';
  sourceLabel: string;
  confidence: number;
  badgeText: string;
  badgeVariant: 'teal' | 'amber';
}

function recommendationsFromWeakness(w: EdgeWeakness): RecommendationCandidate[] {
  const results: RecommendationCandidate[] = [];

  if (w.capabilities.includes('email')) {
    results.push({
      useCase: 'writing_persona',
      label: 'Writing Persona',
      description: 'Export your communication style so AI can draft in your voice',
      iconName: 'PenTool',
      source: 'weakness',
      sourceLabel: w.label,
      confidence: w.confidence,
      badgeText: `Covers: ${w.label}`,
      badgeVariant: 'amber',
    });
  }

  if (w.capabilities.includes('meeting_agenda')) {
    results.push({
      useCase: 'meeting',
      label: 'Meeting Prep',
      description: 'Context optimized for preparing for meetings',
      iconName: 'Users',
      source: 'weakness',
      sourceLabel: w.label,
      confidence: w.confidence + 0.05, // boost for direct capability match
      badgeText: `Covers: ${w.label}`,
      badgeVariant: 'amber',
    });
  }

  if (w.capabilities.includes('strategy_doc')) {
    results.push({
      useCase: 'strategy',
      label: 'Strategic Planning',
      description: 'Business context, objectives, and patterns',
      iconName: 'TrendingUp',
      source: 'weakness',
      sourceLabel: w.label,
      confidence: w.confidence + 0.05,
      badgeText: `Covers: ${w.label}`,
      badgeVariant: 'amber',
    });
  }

  if (w.capabilities.includes('template')) {
    results.push({
      useCase: 'delegation_playbook',
      label: 'Delegation Playbook',
      description: 'Export your delegation style and team context for AI assistance',
      iconName: 'GitBranch',
      source: 'weakness',
      sourceLabel: w.label,
      confidence: w.confidence,
      badgeText: `Covers: ${w.label}`,
      badgeVariant: 'amber',
    });
  }

  return results;
}

function recommendationsFromStrength(s: EdgeStrength): RecommendationCandidate[] {
  const results: RecommendationCandidate[] = [];

  if (s.capabilities.includes('systemize')) {
    results.push({
      useCase: 'strength_framework',
      label: 'Framework Export',
      description: `Export your ${s.label.toLowerCase()} instinct as a framework AI tools can apply`,
      iconName: 'Layers',
      source: 'strength',
      sourceLabel: s.label,
      confidence: s.confidence,
      badgeText: `Amplifies: ${s.label}`,
      badgeVariant: 'teal',
    });
  }

  if (s.capabilities.includes('lean_into')) {
    results.push({
      useCase: 'strategic_advisor',
      label: 'Strategic Advisor',
      description: `Leverage your ${s.label.toLowerCase()} in every AI interaction`,
      iconName: 'Compass',
      source: 'strength',
      sourceLabel: s.label,
      confidence: s.confidence,
      badgeText: `Amplifies: ${s.label}`,
      badgeVariant: 'teal',
    });
  }

  if (s.capabilities.includes('teach')) {
    results.push({
      useCase: 'delegation',
      label: 'Delegation Brief',
      description: 'Share how you think so AI can delegate like you',
      iconName: 'BookOpen',
      source: 'strength',
      sourceLabel: s.label,
      confidence: s.confidence + 0.05,
      badgeText: `Amplifies: ${s.label}`,
      badgeVariant: 'teal',
    });
  }

  return results;
}

export function buildExportRecommendations(
  strengths: EdgeStrength[],
  weaknesses: EdgeWeakness[],
): ExportRecommendation[] {
  const candidates: RecommendationCandidate[] = [];

  for (const w of weaknesses) {
    candidates.push(...recommendationsFromWeakness(w));
  }
  for (const s of strengths) {
    candidates.push(...recommendationsFromStrength(s));
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Deduplicate by useCase, keeping highest confidence
  const seen = new Set<ExportUseCase>();
  const deduped: RecommendationCandidate[] = [];
  for (const c of candidates) {
    if (!seen.has(c.useCase)) {
      seen.add(c.useCase);
      deduped.push(c);
    }
  }

  return deduped.slice(0, MAX_RECOMMENDATIONS);
}
