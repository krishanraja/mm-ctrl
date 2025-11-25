// Simple learning style utilities for cohort selection

export type AILearningStyle = 
  | 'strategic_visionary'
  | 'pragmatic_executor'
  | 'collaborative_builder'
  | 'analytical_optimizer'
  | 'adaptive_explorer';

export function getLearningStyleLabel(style: string): string {
  const styles: Record<string, string> = {
    'hands_on': 'Hands-on Experimentation',
    'structured': 'Structured Learning',
    'peer_learning': 'Peer Learning',
    'self_directed': 'Self-directed Research',
    'strategic_visionary': 'Strategic Visionary',
    'pragmatic_executor': 'Pragmatic Executor',
    'collaborative_builder': 'Collaborative Builder',
    'analytical_optimizer': 'Analytical Optimizer',
    'adaptive_explorer': 'Adaptive Explorer'
  };
  return styles[style] || style;
}

export function getLearningStyleProfile(style: AILearningStyle) {
  return {
    style,
    label: getLearningStyleLabel(style),
    description: `${style} learning profile`
  };
}

export function getDefaultLearningStyle(): string {
  return 'hands_on';
}
