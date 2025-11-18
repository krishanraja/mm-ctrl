import { AILearningStyle } from './aiLearningStyle';

export interface CohortPeerData {
  x: number;
  y: number;
  z: number;
  isUser: boolean;
  tier: string;
  id: string;
  learningStyle: AILearningStyle;
}

/**
 * Fake cohort statistics until we have real data
 * These simulate realistic distributions for each learning style cohort
 */
const FAKE_COHORT_STATS: Record<AILearningStyle, {
  count: number;
  meanScore: number;
  stdDev: number;
  tierDistribution: Record<string, number>;
}> = {
  strategic_visionary: {
    count: 127,
    meanScore: 68.5,
    stdDev: 14.2,
    tierDistribution: {
      'AI Pioneer': 0.18,
      'Confident Practitioner': 0.42,
      'Active Explorer': 0.31,
      'Building Foundations': 0.09
    }
  },
  pragmatic_executor: {
    count: 198,
    meanScore: 71.3,
    stdDev: 13.8,
    tierDistribution: {
      'AI Pioneer': 0.22,
      'Confident Practitioner': 0.45,
      'Active Explorer': 0.27,
      'Building Foundations': 0.06
    }
  },
  collaborative_builder: {
    count: 156,
    meanScore: 64.2,
    stdDev: 15.6,
    tierDistribution: {
      'AI Pioneer': 0.14,
      'Confident Practitioner': 0.38,
      'Active Explorer': 0.36,
      'Building Foundations': 0.12
    }
  },
  analytical_optimizer: {
    count: 183,
    meanScore: 73.8,
    stdDev: 12.4,
    tierDistribution: {
      'AI Pioneer': 0.26,
      'Confident Practitioner': 0.48,
      'Active Explorer': 0.22,
      'Building Foundations': 0.04
    }
  },
  adaptive_explorer: {
    count: 211,
    meanScore: 66.7,
    stdDev: 16.1,
    tierDistribution: {
      'AI Pioneer': 0.16,
      'Confident Practitioner': 0.40,
      'Active Explorer': 0.33,
      'Building Foundations': 0.11
    }
  }
};

const getTier = (score: number): string => {
  if (score >= 85) return 'AI Pioneer';
  if (score >= 65) return 'Confident Practitioner';
  if (score >= 40) return 'Active Explorer';
  return 'Building Foundations';
};

/**
 * Generate cohort-specific peer data using fake statistics
 * This creates realistic peer distributions based on the user's learning style cohort
 */
export function generateCohortPeers(
  userX: number,
  userY: number,
  userZ: number,
  userLearningStyle: AILearningStyle,
  count: number = 500
): CohortPeerData[] {
  const cohortStats = FAKE_COHORT_STATS[userLearningStyle];
  const peers: CohortPeerData[] = [];

  // Calculate user's average score
  const userAvg = (userX + userY + userZ) / 3;

  // Calculate how many peers should be ahead based on user's position
  const userPercentile = calculatePercentile(userAvg, cohortStats.meanScore, cohortStats.stdDev);
  const peersAhead = Math.max(Math.ceil(count * (1 - userPercentile / 100)), 50);
  const peersNear = Math.ceil(count * 0.15);
  const peersBehind = count - peersAhead - peersNear;

  // Generate peers ahead of user (higher scores)
  for (let i = 0; i < peersAhead; i++) {
    const baseScore = cohortStats.meanScore + Math.random() * cohortStats.stdDev * 1.5;
    const variation = Math.random() * 10 - 5; // ±5 variation
    
    const x = Math.min(98, Math.max(userX + 5, baseScore + variation));
    const y = Math.min(98, Math.max(userY + 5, baseScore + variation * 0.8));
    const z = Math.min(95, Math.max(userZ + 3, baseScore + variation * 0.6));

    peers.push({
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
      z: parseFloat(z.toFixed(1)),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `cohort-peer-ahead-${i}`,
      learningStyle: userLearningStyle
    });
  }

  // Generate peers near user (similar scores ±10 points)
  for (let i = 0; i < peersNear; i++) {
    const x = userX + (Math.random() - 0.5) * 20;
    const y = userY + (Math.random() - 0.5) * 20;
    const z = userZ + (Math.random() - 0.5) * 15;

    peers.push({
      x: parseFloat(Math.max(5, Math.min(95, x)).toFixed(1)),
      y: parseFloat(Math.max(5, Math.min(95, y)).toFixed(1)),
      z: parseFloat(Math.max(5, Math.min(90, z)).toFixed(1)),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `cohort-peer-near-${i}`,
      learningStyle: userLearningStyle
    });
  }

  // Generate peers behind user (lower scores)
  for (let i = 0; i < peersBehind; i++) {
    const baseScore = cohortStats.meanScore - Math.random() * cohortStats.stdDev;
    const variation = Math.random() * 8 - 4;
    
    const x = Math.max(2, Math.min(userX - 5, baseScore + variation));
    const y = Math.max(2, Math.min(userY - 5, baseScore + variation * 0.8));
    const z = Math.max(2, Math.min(userZ - 3, baseScore + variation * 0.7));

    peers.push({
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
      z: parseFloat(z.toFixed(1)),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `cohort-peer-behind-${i}`,
      learningStyle: userLearningStyle
    });
  }

  return peers;
}

/**
 * Calculate percentile based on normal distribution
 */
function calculatePercentile(value: number, mean: number, stdDev: number): number {
  const z = (value - mean) / stdDev;
  // Approximation of normal CDF
  const percentile = 50 * (1 + erf(z / Math.sqrt(2)));
  return Math.max(0, Math.min(100, percentile));
}

/**
 * Error function approximation for normal distribution
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Get fake cohort statistics
 */
export function getCohortStats(learningStyle: AILearningStyle) {
  return FAKE_COHORT_STATS[learningStyle];
}
