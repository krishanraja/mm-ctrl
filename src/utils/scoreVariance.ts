/**
 * Score Variance Engine
 * 
 * Transforms base scores into nuanced, non-round final scores using:
 * 1. Hash-based seed variance (deterministic per user)
 * 2. Time-based modifiers (faster = more confident)
 * 3. Secondary question personality modifiers
 * 
 * Result: Scores like 63, 71, 54 instead of 60, 70, 50
 * Total variance: ±10 points from base score
 */

import { calculateSecondaryModifiers } from '@/data/secondaryQuestions';

// Dimensions affected by timing (confidence-related)
const CONFIDENCE_DIMENSIONS = [
  'decision_velocity',
  'experimentation_cadence',
  'ai_fluency',
];

// Dimensions affected by deliberation (governance-related)
const DELIBERATION_DIMENSIONS = [
  'risk_governance',
  'alignment_communication',
  'delegation_augmentation',
];

/**
 * Simple hash function for deterministic variance
 * Uses string input to generate consistent pseudo-random number
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic base variance using score and timing data
 * Range: -7 to +7 points
 */
function hashBasedVariance(
  baseScore: number,
  responseTimes: number[],
  dimensionKey: string
): number {
  // Create a unique seed from the dimension and response pattern
  const timingFingerprint = responseTimes.slice(0, 5).join('-');
  const seed = `${dimensionKey}-${baseScore}-${timingFingerprint}`;
  const hash = simpleHash(seed);
  
  // Map hash to range [-7, +7]
  const normalized = (hash % 15) - 7;
  
  // Avoid perfectly round numbers - add decimal and round asymmetrically
  const variance = normalized + ((hash % 10) / 10 - 0.5);
  
  return Math.round(variance);
}

/**
 * Calculate time-based modifier
 * Fast responses boost confidence dimensions (+1 to +3)
 * Slow responses reduce confidence dimensions (-1 to -2)
 */
function calculateTimeModifier(
  responseTimes: number[],
  dimensionKey: string
): number {
  if (responseTimes.length === 0) return 0;
  
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const fastThreshold = 5000; // 5 seconds
  const slowThreshold = 20000; // 20 seconds
  
  // Count fast and slow responses
  const fastCount = responseTimes.filter(t => t < fastThreshold).length;
  const slowCount = responseTimes.filter(t => t > slowThreshold).length;
  const totalQuestions = responseTimes.length;
  
  const fastRatio = fastCount / totalQuestions;
  const slowRatio = slowCount / totalQuestions;
  
  const isConfidenceDimension = CONFIDENCE_DIMENSIONS.includes(dimensionKey);
  const isDeliberationDimension = DELIBERATION_DIMENSIONS.includes(dimensionKey);
  
  let modifier = 0;
  
  if (isConfidenceDimension) {
    // Fast responders get boost on confidence dimensions
    if (fastRatio > 0.5) modifier += 2;
    else if (fastRatio > 0.3) modifier += 1;
    
    // Slow responders get slight reduction
    if (slowRatio > 0.4) modifier -= 1;
  }
  
  if (isDeliberationDimension) {
    // Deliberate responders (slower) get boost on governance dimensions
    if (avgTime > 10000) modifier += 1;
    
    // Very fast responders may have lower governance scores
    if (fastRatio > 0.6) modifier -= 1;
  }
  
  return modifier;
}

/**
 * Ensure score never ends in 0 or 5 (too round)
 * Adjusts by ±1 or ±2 to avoid round numbers
 */
function avoidRoundNumbers(score: number): number {
  const lastDigit = Math.abs(score) % 10;
  
  if (lastDigit === 0) {
    // Move away from 0 (e.g., 60 -> 61 or 59)
    return score + (score > 50 ? -1 : 1);
  }
  
  if (lastDigit === 5) {
    // Move away from 5 (e.g., 65 -> 64 or 66)
    return score + (score % 20 > 10 ? -1 : 1);
  }
  
  return score;
}

/**
 * Apply full score variance to a base score
 * 
 * @param baseScore - Raw score from quiz (0-100)
 * @param dimensionKey - Which dimension this score is for
 * @param responseTimes - Array of response times in ms
 * @param secondaryAnswers - Optional map of secondary question answers
 * @returns Final nuanced score (never ends in 0 or 5)
 */
export function applyScoreVariance(
  baseScore: number,
  dimensionKey: string,
  responseTimes: number[] = [],
  secondaryAnswers: Record<string, string> = {}
): number {
  // 1. Hash-based variance (±7 points)
  const seedVariance = hashBasedVariance(baseScore, responseTimes, dimensionKey);
  
  // 2. Time-based modifier (±2 points)
  const timeModifier = calculateTimeModifier(responseTimes, dimensionKey);
  
  // 3. Secondary question modifier (±5 points)
  const secondaryModifiers = calculateSecondaryModifiers(secondaryAnswers);
  const personalityModifier = secondaryModifiers[dimensionKey] || 0;
  
  // Combine all modifiers
  let finalScore = baseScore + seedVariance + timeModifier + personalityModifier;
  
  // Clamp to valid range
  finalScore = Math.max(1, Math.min(99, finalScore));
  
  // Avoid round numbers
  finalScore = avoidRoundNumbers(finalScore);
  
  // Final clamp
  return Math.max(1, Math.min(99, finalScore));
}

/**
 * Apply variance to all dimension scores
 * 
 * @param dimensionScores - Map of dimension key to base score
 * @param responseTimes - Array of response times in ms
 * @param secondaryAnswers - Optional map of secondary question answers
 * @returns Map of dimension key to final nuanced score
 */
export function applyVarianceToAllDimensions(
  dimensionScores: Record<string, number>,
  responseTimes: number[] = [],
  secondaryAnswers: Record<string, string> = {}
): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const [dimension, baseScore] of Object.entries(dimensionScores)) {
    result[dimension] = applyScoreVariance(
      baseScore,
      dimension,
      responseTimes,
      secondaryAnswers
    );
  }
  
  return result;
}

/**
 * Calculate overall benchmark score with variance
 * Uses the average of dimension scores
 */
export function calculateBenchmarkWithVariance(
  dimensionScores: Record<string, number>
): number {
  const scores = Object.values(dimensionScores);
  if (scores.length === 0) return 0;
  
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return avoidRoundNumbers(Math.round(avg));
}

