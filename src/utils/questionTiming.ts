/**
 * Question Timing Utility
 * 
 * Tracks response times for diagnostic questions to add variance to scores.
 * Faster responses slightly boost confidence-related dimensions.
 * Slower responses slightly reduce confidence-related dimensions.
 */

export interface QuestionTiming {
  questionId: string;
  startTime: number;
  answerTime: number;
  responseTimeMs: number;
}

export interface TimingData {
  timings: QuestionTiming[];
  averageResponseTime: number;
  fastResponseCount: number;
  slowResponseCount: number;
}

// Thresholds in milliseconds
const FAST_RESPONSE_THRESHOLD = 5000; // 5 seconds
const SLOW_RESPONSE_THRESHOLD = 20000; // 20 seconds

class QuestionTimingTracker {
  private currentQuestionId: string | null = null;
  private questionStartTime: number = 0;
  private timings: QuestionTiming[] = [];

  /**
   * Call when a new question is displayed
   */
  startQuestion(questionId: string): void {
    this.currentQuestionId = questionId;
    this.questionStartTime = Date.now();
  }

  /**
   * Call when user answers the current question
   * Returns the timing data for this question
   */
  recordAnswer(): QuestionTiming | null {
    if (!this.currentQuestionId || !this.questionStartTime) {
      return null;
    }

    const answerTime = Date.now();
    const responseTimeMs = answerTime - this.questionStartTime;

    const timing: QuestionTiming = {
      questionId: this.currentQuestionId,
      startTime: this.questionStartTime,
      answerTime,
      responseTimeMs,
    };

    this.timings.push(timing);
    
    // Reset for next question
    this.currentQuestionId = null;
    this.questionStartTime = 0;

    return timing;
  }

  /**
   * Get aggregated timing data for score variance calculation
   */
  getTimingData(): TimingData {
    const responseTimes = this.timings.map(t => t.responseTimeMs);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const fastResponseCount = this.timings.filter(
      t => t.responseTimeMs < FAST_RESPONSE_THRESHOLD
    ).length;

    const slowResponseCount = this.timings.filter(
      t => t.responseTimeMs > SLOW_RESPONSE_THRESHOLD
    ).length;

    return {
      timings: [...this.timings],
      averageResponseTime,
      fastResponseCount,
      slowResponseCount,
    };
  }

  /**
   * Get raw response times array for variance calculation
   */
  getResponseTimes(): number[] {
    return this.timings.map(t => t.responseTimeMs);
  }

  /**
   * Reset all timing data (for new assessment)
   */
  reset(): void {
    this.currentQuestionId = null;
    this.questionStartTime = 0;
    this.timings = [];
  }
}

// Export singleton instance for global tracking
export const questionTimingTracker = new QuestionTimingTracker();

// Export class for testing purposes
export { QuestionTimingTracker };

