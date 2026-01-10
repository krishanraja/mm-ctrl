/**
 * LLM Quality Guardrails - 10/10 Quality Checks
 * 
 * Purpose: Ensures LLM outputs meet quality standards:
 * - Grounded in data
 * - Clear next move
 * - Surprise/tension
 * - Reusability (scores/labels can be written back)
 */

export interface QualityCheckResult {
  passed: boolean;
  checks: {
    grounded: boolean;
    clearNextMove: boolean;
    hasSurprise: boolean;
    reusable: boolean;
  };
  issues: string[];
  suggestions: string[];
}

/**
 * Validates LLM output against 10/10 quality standards
 */
export function validateLLMQuality(
  output: {
    summary?: string;
    keyActions?: string[];
    surpriseOrTension?: string;
    scores?: Array<{ dimension: string; score: number; label: string }>;
    dataUpdates?: Record<string, any>;
  },
  context: {
    hasProfileData: boolean;
    hasEvents: boolean;
    hasExistingInsights: boolean;
  }
): QualityCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const checks = {
    grounded: false,
    clearNextMove: false,
    hasSurprise: false,
    reusable: false
  };

  // Check 1: Grounded in data
  if (!context.hasProfileData && !context.hasEvents) {
    issues.push('No profile data or events available - output cannot be grounded');
    suggestions.push('Request missing data before generating insights');
  } else if (!output.summary || output.summary.length < 50) {
    issues.push('Summary is too short or missing - may not be grounded in data');
    suggestions.push('Ensure summary references specific scores, contradictions, or profile data');
  } else {
    // Check if summary references data
    const dataReferences = [
      'score', 'dimension', 'response', 'answer', 'assessment',
      'profile', 'data', 'evidence', 'indicates', 'shows'
    ];
    const summaryLower = output.summary.toLowerCase();
    const hasDataReferences = dataReferences.some(ref => summaryLower.includes(ref));
    
    if (!hasDataReferences) {
      issues.push('Summary does not appear to reference specific data points');
      suggestions.push('Include specific scores, dimensions, or user responses in summary');
    } else {
      checks.grounded = true;
    }
  }

  // Check 2: Clear next move
  if (!output.keyActions || output.keyActions.length === 0) {
    issues.push('No key actions provided - user has no clear next move');
    suggestions.push('Provide at least one concrete, actionable next step');
  } else {
    const hasConcreteActions = output.keyActions.some(action => {
      const actionLower = action.toLowerCase();
      return (
        actionLower.includes('will') ||
        actionLower.includes('by') ||
        actionLower.includes('within') ||
        actionLower.includes('this week') ||
        actionLower.includes('today')
      );
    });

    if (!hasConcreteActions) {
      issues.push('Actions are not concrete enough - missing WHO/WHAT/WHEN');
      suggestions.push('Format actions as: "[WHO] will [DO WHAT] by [WHEN]"');
    } else {
      checks.clearNextMove = true;
    }
  }

  // Check 3: Surprise/tension
  if (!output.surpriseOrTension || output.surpriseOrTension.length < 30) {
    issues.push('No surprise or tension identified - output may be generic');
    suggestions.push('Surface contradictions, blind spots, or unexpected insights');
  } else {
    const tensionLower = output.surpriseOrTension.toLowerCase();
    const hasTensionIndicators = [
      'contradiction', 'unexpected', 'surprising', 'contrary',
      'however', 'but', 'despite', 'paradox', 'tension'
    ].some(indicator => tensionLower.includes(indicator));

    if (!hasTensionIndicators) {
      issues.push('Surprise/tension does not clearly identify contradictions or non-obvious insights');
      suggestions.push('Look for contradictions in user inputs or unexpected connections');
    } else {
      checks.hasSurprise = true;
    }
  }

  // Check 4: Reusability
  if (!output.scores || output.scores.length === 0) {
    issues.push('No scores provided - cannot write back to database');
    suggestions.push('Include dimension scores that can be stored in profile_insights');
  } else {
    const hasValidScores = output.scores.every(score => 
      typeof score.dimension === 'string' &&
      typeof score.score === 'number' &&
      score.score >= 0 &&
      score.score <= 100 &&
      typeof score.label === 'string'
    );

    if (!hasValidScores) {
      issues.push('Scores are not in valid format for database storage');
      suggestions.push('Ensure scores have: dimension (string), score (0-100), label (string)');
    } else {
      checks.reusable = true;
    }
  }

  const passed = checks.grounded && checks.clearNextMove && checks.hasSurprise && checks.reusable;

  return {
    passed,
    checks,
    issues,
    suggestions
  };
}

/**
 * Enhances LLM prompt with quality requirements
 */
export function addQualityRequirementsToPrompt(basePrompt: string): string {
  return `${basePrompt}

=== 10/10 QUALITY REQUIREMENTS ===
Before generating, verify each output passes these tests:

1. GROUNDED: Does every insight reference a specific score, contradiction, or profile data point?
   - If not, say so and ask for the missing signal (don't invent).

2. CLEAR NEXT MOVE: Does the user get a clear next move?
   - Format: "[WHO] will [DO WHAT] by [WHEN]"
   - If there isn't at least one concrete action, rewrite.

3. SURPRISE/TENSION: Is there at least one useful surprise?
   - Surface contradictions in the user's inputs, or
   - A blind spot, or
   - An unexpected upside or risk.
   - If surprise_or_tension is generic, push harder on contradictions or non-obvious links.

4. REUSABILITY: Is this reusable later?
   - Ensure that scores and labels can be written back to the tables from data_updates.
   - Scores must have: dimension (string), score (0-100), label (string)

=== ANTI-PATTERNS (NEVER DO THESE) ===
❌ Generic coaching like "communicate more" or "be open to change"
❌ Round scores (60, 70, 80) - Use nuanced scores (63, 71, 82)
❌ "Area for strategic focus" - State the COST: "Your 47/100 costs you 5 hours weekly"
❌ Risks without quantification - "Shadow AI exposure will create compliance issues within 60 days"
❌ Generic prompts - Tie every prompt to THEIR specific workflow
`;
}
