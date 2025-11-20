// Phase 2: Quality guardrails for LLM outputs

export const QUALITY_GUARDRAILS = `
**CRITICAL: OUTPUT MUST PASS ALL 4 QUALITY GATES**

1. GROUNDING CHECK - No Generic Advice
   ✅ REQUIRED: Every recommendation must cite specific evidence
   - Format: "Because you scored X on [dimension] and said '[specific quote]', I recommend..."
   - If you lack evidence for a claim, say: "I need more signal on X to recommend Y"
   - FORBIDDEN: "communicate more", "be strategic", "align your team" (too vague)
   - FORBIDDEN: Generic leadership advice that could apply to anyone

2. NEXT MOVE CHECK - Actionable Within 7 Days
   ✅ REQUIRED: At least one action must be completable in next 7 days
   - Must include: WHAT (specific action), WHY NOW (tied to their data), HOW TO MEASURE (concrete metric)
   - Good: "Schedule 30-min AI tool demo with your sales team this week because you scored low on 'team adoption' and said 'my team doesn't see the value' - track how many attend"
   - Bad: "Improve team communication" (what? when? how to know it worked?)

3. SURPRISE CHECK - Surface Non-Obvious Insights
   ✅ REQUIRED: surprise_or_tension must highlight ONE of:
   - A contradiction in their answers (e.g., high AI confidence but low experimentation)
   - A blind spot (what they're NOT saying that matters)
   - An unexpected strength or risk they may not see
   - FORBIDDEN: "You're on the right track" or "Keep up the good work" (not surprising)
   - FORBIDDEN: Merely restating what they said

4. REUSABILITY CHECK - Executable Data Updates
   ✅ REQUIRED: data_updates must be valid for database insertion
   - Scores must map to existing dimension_key values
   - Risk levels must be: low, medium, high, or critical
   - Tiers must be: emerging, establishing, advancing, or leading
   - Include evidence field for every score/risk/tension

**IF YOU CANNOT MEET ALL 4 GATES:**
Return this structure instead:
{
  "insufficient_data": true,
  "missing_signals": ["list specific questions or data points you need"],
  "confidence_level": "low",
  "reason": "explain what prevents quality output"
}

**EVIDENCE CITATION FORMAT:**
Always reference specific answers using this format:
- "Your answer to 'I can explain AI's impact' (score: 3/5) suggests..."
- "You said you spend 40% of time on repetitive work..."
- "Your delegation score of 2/5 combined with 5+ stakeholder needs indicates..."

**SCORING TRANSPARENCY:**
For every dimension score, explain:
1. Which question(s) contributed
2. How the raw answer maps to 0-100 scale
3. What behavioral adjustments were applied (if any)
4. How this compares to cohort benchmarks
`;

export const PROMPT_CONTEXT_REQUIREMENTS = `
**CONTEXT YOU MUST USE:**

1. Current Assessment Data
   - All question-answer pairs (questions provide critical context!)
   - Deep profile responses
   - Behavioral inputs (time allocation, delegation, stakeholders)

2. Historical Context (if available)
   - Previous assessment scores
   - Score trajectories over time
   - Past risk signals and tensions

3. Session Context
   - Chat messages from this session
   - Voice transcripts if applicable
   - Tool flow (quiz vs voice vs diagnostic)

4. Cohort Context
   - How they compare to peers
   - Industry and company size benchmarks
   - Learning style preferences

**HOW TO USE CONTEXT:**
- Synthesize patterns across all data sources
- Identify changes from previous assessments
- Tie recommendations to specific, cited evidence
- Surface tensions between different signals (e.g., high confidence but low action)
`;

export const ANTI_GENERIC_RULES = `
**FORBIDDEN OUTPUTS (will be rejected):**

❌ Generic coaching phrases:
- "Focus on communication"
- "Build trust with your team"
- "Be more strategic"
- "Align stakeholders"
- "Drive change"

❌ Advice without evidence:
- "Consider implementing AI tools" → WHY this person? WHY now? WHICH tools?
- "Your team needs training" → Based on WHAT answer? WHAT kind of training?

❌ Vague next steps:
- "Explore AI use cases" → With WHO? By WHEN? How will you know it worked?
- "Improve your skills" → WHICH skills? Based on WHAT gap?

✅ INSTEAD, tie everything to their specific data:
- "You spend 40% of time on admin (from deep profile) and scored 3/5 on 'I know which areas can be accelerated by AI'. Start with automating your weekly report compilation (takes 2hrs) using Claude/ChatGPT - you'll save 8hrs/month, measurable in your calendar."
`;

export function validateQualityGates(output: any): {
  passed: boolean;
  failedGates: string[];
  recommendations: string[];
} {
  const failedGates: string[] = [];
  const recommendations: string[] = [];

  // Gate 1: Grounding check
  if (!output.key_actions?.every((a: any) => a.evidence && a.evidence.length > 20)) {
    failedGates.push("Grounding Check - Actions lack specific evidence citations");
    recommendations.push("Add specific quotes or answer references to every action");
  }

  // Gate 2: Next move check
  if (!output.key_actions?.some((a: any) => a.why_now && a.metric_to_track)) {
    failedGates.push("Next Move Check - No actionable 7-day steps with metrics");
    recommendations.push("Include at least one action with clear timeline and success metric");
  }

  // Gate 3: Surprise check
  if (!output.surprise_or_tension?.evidence?.length) {
    failedGates.push("Surprise Check - No evidence for tension/surprise");
    recommendations.push("Cite specific contradictions or blind spots from their answers");
  }

  // Gate 4: Reusability check
  if (output.scores && typeof output.scores === 'object') {
    const invalidScores = Object.entries(output.scores).filter(
      ([_, scoreObj]: any) => !scoreObj.evidence || scoreObj.score < 0 || scoreObj.score > 100
    );
    if (invalidScores.length > 0) {
      failedGates.push("Reusability Check - Scores missing evidence or invalid range");
      recommendations.push("Ensure all scores have evidence and are 0-100");
    }
  }

  return {
    passed: failedGates.length === 0,
    failedGates,
    recommendations
  };
}
