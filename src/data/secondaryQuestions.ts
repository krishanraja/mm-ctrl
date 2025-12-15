/**
 * Secondary Questions for Score Variance
 * 
 * These 4 quick questions capture decision-making style, communication preference,
 * and risk tolerance. They feel natural (not like a personality test) and are used
 * to add nuanced variance to dimension scores.
 * 
 * The responses subtly shift confidence-related dimensions:
 * - Fast/decisive answers boost decision_velocity, experimentation_cadence
 * - Deliberate/analytical answers boost risk_governance, alignment_communication
 * - Data-driven preferences boost ai_fluency
 * - People-focused preferences boost delegation_augmentation
 */

export interface SecondaryQuestion {
  id: string;
  question: string;
  options: SecondaryOption[];
  dimensionModifiers: DimensionModifier[];
}

export interface SecondaryOption {
  value: string;
  label: string;
  modifier: 'fast' | 'deliberate' | 'data' | 'intuitive' | 'risk_taking' | 'risk_averse';
}

export interface DimensionModifier {
  dimension: string;
  modifierMap: Record<string, number>; // modifier type -> score adjustment
}

export const secondaryQuestions: SecondaryQuestion[] = [
  {
    id: 'decision_style',
    question: 'When facing a new AI tool decision, you typically:',
    options: [
      {
        value: 'try_fast',
        label: 'Try it immediately and learn by doing',
        modifier: 'fast',
      },
      {
        value: 'research_first',
        label: 'Research thoroughly before committing',
        modifier: 'deliberate',
      },
      {
        value: 'ask_others',
        label: 'Ask colleagues who have used it',
        modifier: 'intuitive',
      },
      {
        value: 'wait_proven',
        label: 'Wait until it\'s proven in your industry',
        modifier: 'risk_averse',
      },
    ],
    dimensionModifiers: [
      {
        dimension: 'decision_velocity',
        modifierMap: { fast: 3, deliberate: -1, intuitive: 1, risk_averse: -2 },
      },
      {
        dimension: 'experimentation_cadence',
        modifierMap: { fast: 2, deliberate: 0, intuitive: 1, risk_averse: -3 },
      },
    ],
  },
  {
    id: 'communication_pref',
    question: 'When explaining AI investments to stakeholders, you lead with:',
    options: [
      {
        value: 'data_roi',
        label: 'Data, metrics, and ROI projections',
        modifier: 'data',
      },
      {
        value: 'strategic_vision',
        label: 'Strategic vision and competitive positioning',
        modifier: 'intuitive',
      },
      {
        value: 'team_stories',
        label: 'Team success stories and use cases',
        modifier: 'intuitive',
      },
      {
        value: 'risk_mitigation',
        label: 'Risk mitigation and governance plans',
        modifier: 'risk_averse',
      },
    ],
    dimensionModifiers: [
      {
        dimension: 'ai_fluency',
        modifierMap: { data: 2, intuitive: 0, risk_averse: 1 },
      },
      {
        dimension: 'alignment_communication',
        modifierMap: { data: 1, intuitive: 2, risk_averse: 1 },
      },
      {
        dimension: 'risk_governance',
        modifierMap: { data: 1, intuitive: -1, risk_averse: 3 },
      },
    ],
  },
  {
    id: 'delegation_approach',
    question: 'When your team proposes an AI experiment, you:',
    options: [
      {
        value: 'green_light',
        label: 'Give quick approval with a deadline for results',
        modifier: 'fast',
      },
      {
        value: 'scope_first',
        label: 'Help them scope it properly first',
        modifier: 'deliberate',
      },
      {
        value: 'resources',
        label: 'Focus on getting them the resources they need',
        modifier: 'intuitive',
      },
      {
        value: 'assess_risk',
        label: 'Assess potential risks before approving',
        modifier: 'risk_averse',
      },
    ],
    dimensionModifiers: [
      {
        dimension: 'delegation_augmentation',
        modifierMap: { fast: 2, deliberate: 1, intuitive: 3, risk_averse: -1 },
      },
      {
        dimension: 'experimentation_cadence',
        modifierMap: { fast: 3, deliberate: 1, intuitive: 1, risk_averse: -2 },
      },
    ],
  },
  {
    id: 'learning_style',
    question: 'How do you stay current on AI developments?',
    options: [
      {
        value: 'hands_on',
        label: 'Hands-on testing of new tools weekly',
        modifier: 'fast',
      },
      {
        value: 'curated_sources',
        label: 'Curated newsletters and industry reports',
        modifier: 'data',
      },
      {
        value: 'peer_network',
        label: 'Conversations with peers and advisors',
        modifier: 'intuitive',
      },
      {
        value: 'team_updates',
        label: 'Rely on my team to filter what matters',
        modifier: 'deliberate',
      },
    ],
    dimensionModifiers: [
      {
        dimension: 'ai_fluency',
        modifierMap: { fast: 3, data: 2, intuitive: 1, deliberate: -1 },
      },
      {
        dimension: 'decision_velocity',
        modifierMap: { fast: 2, data: 1, intuitive: 1, deliberate: -1 },
      },
    ],
  },
];

/**
 * Calculate dimension modifiers from secondary question answers
 * @param answers - Map of question ID to selected option value
 * @returns Map of dimension key to total modifier value
 */
export function calculateSecondaryModifiers(
  answers: Record<string, string>
): Record<string, number> {
  const modifiers: Record<string, number> = {};

  for (const question of secondaryQuestions) {
    const selectedValue = answers[question.id];
    if (!selectedValue) continue;

    const selectedOption = question.options.find(o => o.value === selectedValue);
    if (!selectedOption) continue;

    const modifierType = selectedOption.modifier;

    for (const dimMod of question.dimensionModifiers) {
      const adjustment = dimMod.modifierMap[modifierType] || 0;
      modifiers[dimMod.dimension] = (modifiers[dimMod.dimension] || 0) + adjustment;
    }
  }

  return modifiers;
}

/**
 * Get total modifier for a specific dimension
 */
export function getDimensionModifier(
  answers: Record<string, string>,
  dimension: string
): number {
  const allModifiers = calculateSecondaryModifiers(answers);
  return allModifiers[dimension] || 0;
}

