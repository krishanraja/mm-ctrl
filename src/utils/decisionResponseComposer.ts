/**
 * Mindmaker Control - Decision Response Composer
 * 
 * Response format (always the same):
 * - What this actually is
 * - What you might be missing
 * - What to decide or delegate next
 * 
 * Each is one sentence. Expandable, but collapsed by default.
 * Never return paragraphs.
 */

import { supabase } from '@/integrations/supabase/client';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';

export interface StructuredResponse {
  what_this_is: string;
  what_you_might_be_missing: string;
  what_to_decide_next: string;
}

export interface ComposerContext {
  transcript: string;
  tensionContext?: string;
  benchmarkTier?: string;
  topTension?: string;
  recentDecisions?: string[];
}

/**
 * Compose an executive response using AI
 * Falls back to deterministic response if AI fails
 */
export async function composeExecutiveResponse(
  transcript: string,
  tensionContext?: string
): Promise<StructuredResponse> {
  // Build context from existing data
  const context = await buildContext(transcript, tensionContext);
  
  try {
    // Try to get AI-generated response via edge function
    const { data, error } = await supabase.functions.invoke('submit-decision-capture', {
      body: {
        transcript: transcript.trim(),
        context: {
          tensionContext,
          benchmarkTier: context.benchmarkTier,
          topTension: context.topTension,
        },
      },
    });

    if (error) throw error;

    // Map the existing edge function response to our strict schema
    return mapToStructuredResponse(data, transcript);
  } catch (err) {
    console.error('AI response generation failed, using fallback:', err);
    return generateFallbackResponse(transcript);
  }
}

/**
 * Build context from persisted assessment data
 */
async function buildContext(transcript: string, tensionContext?: string): Promise<ComposerContext> {
  const context: ComposerContext = {
    transcript,
    tensionContext,
  };

  try {
    const { assessmentId } = getPersistedAssessmentId();
    
    if (assessmentId) {
      // Import aggregateLeaderResults dynamically to avoid circular deps
      const { aggregateLeaderResults } = await import('@/utils/aggregateLeaderResults');
      const results = await aggregateLeaderResults(assessmentId, false);
      
      context.benchmarkTier = results.benchmarkTier;
      context.topTension = results.tensions[0]?.summary_line;
    }
  } catch (err) {
    console.warn('Could not load assessment context:', err);
  }

  return context;
}

/**
 * Map edge function response to strict 3-part schema
 */
function mapToStructuredResponse(data: any, transcript: string): StructuredResponse {
  // The existing submit-decision-capture returns:
  // - three_questions: string[]
  // - next_step: string
  // - watchout: string
  
  // We'll map this to our new schema
  const questions = data?.three_questions || [];
  const nextStep = data?.next_step || '';
  const watchout = data?.watchout || '';

  // Derive "what this is" from the first question or transcript analysis
  const whatThisIs = deriveWhatThisIs(transcript, questions);
  
  // "What you might be missing" maps to watchout or first question
  const whatMissing = watchout || questions[0] || 'Consider who else needs to weigh in before you decide.';
  
  // "What to decide next" maps to next_step
  const whatNext = nextStep || 'Identify the one decision that unblocks everything else.';

  return {
    what_this_is: ensureOneSentence(whatThisIs),
    what_you_might_be_missing: ensureOneSentence(whatMissing),
    what_to_decide_next: ensureOneSentence(whatNext),
  };
}

/**
 * Derive "what this actually is" from transcript and context
 */
function deriveWhatThisIs(transcript: string, questions: string[]): string {
  const lowerTranscript = transcript.toLowerCase();
  
  // Pattern matching for common decision types
  if (lowerTranscript.includes('vendor') || lowerTranscript.includes('proposal')) {
    return 'This is a vendor evaluation that needs clear success criteria before you commit.';
  }
  
  if (lowerTranscript.includes('hire') || lowerTranscript.includes('headcount')) {
    return 'This is a hiring decision that shapes your team\'s capability for the next 12+ months.';
  }
  
  if (lowerTranscript.includes('budget') || lowerTranscript.includes('invest')) {
    return 'This is a resource allocation decision that trades off against other priorities.';
  }
  
  if (lowerTranscript.includes('ai') || lowerTranscript.includes('automation')) {
    return 'This is an AI/automation decision that will change how your team works.';
  }
  
  if (lowerTranscript.includes('delegate') || lowerTranscript.includes('hand off')) {
    return 'This is a delegation decision that needs clear ownership and success criteria.';
  }
  
  if (lowerTranscript.includes('strategy') || lowerTranscript.includes('direction')) {
    return 'This is a strategic direction decision that will compound over time.';
  }

  // Default based on question analysis
  if (questions.length > 0 && questions[0]) {
    return `This is a decision point that requires answering: ${questions[0]}`;
  }
  
  return 'This is a decision that needs clearer framing before you can act on it.';
}

/**
 * Ensure response is a single sentence
 */
function ensureOneSentence(text: string): string {
  if (!text) return '';
  
  // Split on sentence endings
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Return first sentence, cleaned up
  let firstSentence = sentences[0].trim();
  
  // Ensure it ends with proper punctuation
  if (!firstSentence.match(/[.!?]$/)) {
    firstSentence += '.';
  }
  
  return firstSentence;
}

/**
 * Generate fallback response when AI is unavailable
 */
function generateFallbackResponse(transcript: string): StructuredResponse {
  const lowerTranscript = transcript.toLowerCase();
  
  // Detect decision type and provide relevant fallback
  if (lowerTranscript.includes('vendor') || lowerTranscript.includes('proposal')) {
    return {
      what_this_is: 'This is a vendor decision that needs clear evaluation criteria.',
      what_you_might_be_missing: 'What would prove this vendor can deliver beyond their pitch deck?',
      what_to_decide_next: 'Define success criteria before you sign anything.',
    };
  }
  
  if (lowerTranscript.includes('hire') || lowerTranscript.includes('team')) {
    return {
      what_this_is: 'This is a team capability decision that shapes execution for months.',
      what_you_might_be_missing: 'Have you considered what happens if this person leaves in 6 months?',
      what_to_decide_next: 'Clarify what problem this hire actually solves.',
    };
  }
  
  if (lowerTranscript.includes('ai') || lowerTranscript.includes('automat')) {
    return {
      what_this_is: 'This is an AI/automation decision that changes how work gets done.',
      what_you_might_be_missing: 'Who owns the ongoing maintenance and quality of this system?',
      what_to_decide_next: 'Start with the smallest experiment that tests the core assumption.',
    };
  }
  
  // Generic fallback
  return {
    what_this_is: 'This is a decision that needs clearer framing before you can act.',
    what_you_might_be_missing: 'What would have to be true for this to be a good decision in 90 days?',
    what_to_decide_next: 'Identify the one question that, if answered, would make this decision obvious.',
  };
}

/**
 * Generate a delegation brief from a structured response
 */
export function generateDelegationBrief(
  response: StructuredResponse,
  transcript: string
): string {
  return `## Delegation Brief

### Context
${response.what_this_is}

Original situation: "${transcript}"

### Constraints
- ${response.what_you_might_be_missing}
- Report back before any commitments are made

### Success Criteria
- Clear recommendation with supporting evidence
- Key risks identified with mitigation options
- Timeline for decision and implementation

### Risks to Watch
- ${response.what_you_might_be_missing}
- Watch for confident claims without clear ownership

### Next Step
${response.what_to_decide_next}
`;
}
