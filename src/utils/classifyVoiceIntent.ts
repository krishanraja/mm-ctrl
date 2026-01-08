/**
 * Mindmaker Control - Voice Intent Classifier
 * 
 * Classifies transcript into intent types:
 * - decision: User is making or considering a decision
 * - concern: User is expressing worry or uncertainty
 * - reflection: User is thinking through something
 * - delegation_check: User is considering handing something off
 */

export type VoiceIntent = 'decision' | 'concern' | 'reflection' | 'delegation_check';

interface IntentSignals {
  decision: string[];
  concern: string[];
  reflection: string[];
  delegation_check: string[];
}

const INTENT_SIGNALS: IntentSignals = {
  decision: [
    'should i',
    'should we',
    'decide',
    'deciding',
    'choice',
    'option',
    'approve',
    'reject',
    'go ahead',
    'move forward',
    'pull the trigger',
    'green light',
    'sign off',
    'commit to',
    'invest in',
    'hire',
    'fire',
    'buy',
    'sell',
    'launch',
    'cancel',
    'proposal',
    'budget',
    'vendor',
  ],
  concern: [
    'worried',
    'concern',
    'anxious',
    'uncertain',
    'not sure',
    'nervous',
    'risk',
    'danger',
    'problem',
    'issue',
    'fear',
    'scared',
    'what if',
    'might go wrong',
    'downside',
    'hesitant',
    'skeptical',
  ],
  reflection: [
    'thinking about',
    'wondering',
    'considering',
    'pondering',
    'reflecting',
    'processing',
    'makes me think',
    'noticed',
    'realized',
    'pattern',
    'trend',
    'observation',
    'insight',
    'learning',
    'understand',
  ],
  delegation_check: [
    'delegate',
    'hand off',
    'handoff',
    'assign',
    'give to',
    'pass to',
    'someone else',
    'team',
    'report',
    'direct report',
    'manager',
    'lead',
    'owner',
    'responsibility',
    'accountable',
    'brief',
    'instructions',
  ],
};

/**
 * Simple keyword-based intent classification
 * Returns the most likely intent based on signal density
 */
export function classifyVoiceIntent(transcript: string): VoiceIntent {
  const normalizedText = transcript.toLowerCase();
  
  const scores: Record<VoiceIntent, number> = {
    decision: 0,
    concern: 0,
    reflection: 0,
    delegation_check: 0,
  };

  // Score each intent based on keyword matches
  for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
    for (const signal of signals) {
      if (normalizedText.includes(signal)) {
        scores[intent as VoiceIntent]++;
      }
    }
  }

  // Find the highest scoring intent
  let maxIntent: VoiceIntent = 'decision'; // Default to decision
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as VoiceIntent;
    }
  }

  // If no clear signals, default to decision (most actionable)
  return maxIntent;
}

/**
 * Get a prompt hint based on intent type
 */
export function getIntentPromptHint(intent: VoiceIntent): string {
  const hints: Record<VoiceIntent, string> = {
    decision: "What's the decision or situation?",
    concern: "What's weighing on you?",
    reflection: "What's on your mind?",
    delegation_check: "What needs to be handed off?",
  };
  
  return hints[intent];
}
