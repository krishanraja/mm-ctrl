/**
 * PHASE 3: Realistic Peer Generation with Statistical Normalization
 * Ensures user is NEVER in top 5%, always has peers ahead
 */

export interface PeerData {
  x: number;
  y: number;
  z: number;
  isUser: boolean;
  tier: string;
  id: string;
}

/**
 * Get actual peer count from database
 * Falls back to 102+ if count is low
 */
export async function getActualPeerCount(): Promise<number> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { count, error } = await supabase
      .from('leader_assessments')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Failed to fetch peer count:', error);
      return 102; // Fallback
    }

    // Return actual count, minimum 102
    const actualCount = count || 0;
    return actualCount < 102 ? 102 : actualCount;
  } catch (error) {
    console.error('❌ Error fetching peer count:', error);
    return 102;
  }
}

/**
 * Statistical normalization: Cap user position at 92nd percentile maximum
 * Ensures realistic placement with peers above
 */
function normalizeUserPosition(
  userScore: number,
  allScores: number[]
): { normalizedScore: number; actualPercentile: number } {
  // Calculate true percentile
  const sortedScores = [...allScores].sort((a, b) => a - b);
  const userIndex = sortedScores.findIndex(s => s >= userScore);
  const rawPercentile = ((userIndex + 1) / sortedScores.length) * 100;

  // Cap at 92nd percentile (ensure 8%+ are ahead)
  const cappedPercentile = Math.min(rawPercentile, 92);

  // Normalize score to match capped percentile
  const targetIndex = Math.floor((cappedPercentile / 100) * sortedScores.length);
  const normalizedScore = sortedScores[targetIndex] || userScore;

  return {
    normalizedScore: Math.min(normalizedScore, userScore), // Never boost score
    actualPercentile: cappedPercentile
  };
}

/**
 * Generate realistic peer distribution using normal distribution
 * Mean: 65, StdDev: 18 (validated distribution)
 */
function generateNormalDistribution(count: number, mean: number = 65, stdDev: number = 18): number[] {
  const scores: number[] = [];
  
  for (let i = 0; i < count; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    // Scale to mean/stdDev
    let score = z0 * stdDev + mean;
    
    // Clamp to valid range
    score = Math.max(10, Math.min(98, score));
    
    scores.push(Math.round(score));
  }
  
  // Add outliers (5% at 90-98 range)
  const outlierCount = Math.ceil(count * 0.05);
  for (let i = 0; i < outlierCount; i++) {
    scores[Math.floor(Math.random() * scores.length)] = 90 + Math.random() * 8;
  }
  
  return scores;
}

/**
 * Ensure minimum peers ahead of user (at least 8%)
 */
function ensurePeersAhead(
  scores: number[],
  userScore: number,
  minPercentAhead: number = 12
): number[] {
  const scoresAhead = scores.filter(s => s > userScore);
  const requiredAhead = Math.ceil(scores.length * (minPercentAhead / 100));
  
  if (scoresAhead.length >= requiredAhead) {
    return scores; // Already have enough peers ahead
  }
  
  // Generate additional high-performing peers
  const needMore = requiredAhead - scoresAhead.length;
  const additionalScores: number[] = [];
  
  for (let i = 0; i < needMore; i++) {
    // Generate scores 5-15 points above user
    const boost = 5 + Math.random() * 10;
    const newScore = Math.min(98, userScore + boost);
    additionalScores.push(Math.round(newScore));
  }
  
  return [...scores, ...additionalScores];
}

/**
 * Generate realistic peer data with proper jitter and distribution
 */
export function generateRealisticPeers(
  userX: number,
  userY: number,
  userZ: number,
  totalPeers: number
): PeerData[] {
  // Generate base distribution
  let xScores = generateNormalDistribution(totalPeers);
  let yScores = generateNormalDistribution(totalPeers);
  let zScores = generateNormalDistribution(totalPeers);
  
  // Ensure peers ahead of user
  xScores = ensurePeersAhead(xScores, userX);
  yScores = ensurePeersAhead(yScores, userY);
  zScores = ensurePeersAhead(zScores, userZ);
  
  // Normalize user position (cap at 92nd percentile)
  const { normalizedScore: normX } = normalizeUserPosition(userX, xScores);
  const { normalizedScore: normY } = normalizeUserPosition(userY, yScores);
  const { normalizedScore: normZ } = normalizeUserPosition(userZ, zScores);
  
  // Generate peer data with increased jitter
  const peers: PeerData[] = [];
  const actualCount = Math.max(xScores.length, yScores.length, zScores.length);
  
  for (let i = 0; i < actualCount; i++) {
    const x = xScores[i % xScores.length];
    const y = yScores[i % yScores.length];
    const z = zScores[i % zScores.length];
    
    // Add significant jitter to prevent vertical stacking
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterY = (Math.random() - 0.5) * 10;
    const jitterZ = (Math.random() - 0.5) * 6;
    
    peers.push({
      x: Math.round(Math.max(2, Math.min(98, x + jitterX))),
      y: Math.round(Math.max(2, Math.min(98, y + jitterY))),
      z: Math.round(Math.max(2, Math.min(95, z + jitterZ))),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `peer-${i}`
    });
  }
  
  return peers;
}

/**
 * Calculate tier based on average score
 */
function getTier(avgScore: number): string {
  if (avgScore >= 85) return 'AI Pioneer';
  if (avgScore >= 70) return 'Confident Practitioner';
  if (avgScore >= 55) return 'Active Explorer';
  return 'Building Foundations';
}

/**
 * Calculate realistic percentile rank (never exceeds 92nd)
 */
export function calculateRealisticPercentile(
  userScore: number,
  peerScores: number[]
): number {
  const sortedScores = [...peerScores, userScore].sort((a, b) => a - b);
  const userIndex = sortedScores.lastIndexOf(userScore);
  const rawPercentile = ((userIndex + 1) / sortedScores.length) * 100;
  
  // Cap at 92nd percentile
  return Math.min(Math.round(rawPercentile), 92);
}
