export const VIDEO_RADAR_SCHEMA_VERSION = 1 as const;

export interface CachedHeadline {
  id: string;
  headline: string;
  say: string | null;
  pov?: string | null;
  source: string | null;
  sourceCount: number;
  url: string;
  sourceUrls?: string[];
  category: string;
  score: number;
}

export interface CachedHeadlineDay {
  briefing_date: string;
  payload: CachedHeadline[];
}

export interface CachedTrend {
  id: string;
  detected_on: string;
  category: string;
  title: string;
  summary: string;
  implication: string;
  evidence: Array<{ headline?: string; source?: string; url?: string; date?: string }>;
  source_count: number;
  momentum: number;
}

export interface VideoRadarCandidate {
  id: string;
  title: string;
  summary: string;
  source_kind: "public_signal";
  sensitivity: "public";
  occurred_at: string;
  source_urls: string[];
  corroboration: number;
  evidence_status: "public_grounded";
  category: string;
  source_ref_hash: string;
  provider_score?: number;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isoDate(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date(0).toISOString();
}

export async function headlineToRadar(card: CachedHeadline, briefingDate: string): Promise<VideoRadarCandidate | null> {
  if (!validUrl(card.url) || !card.headline.trim()) return null;
  const sourceUrls = [...new Set([card.url, ...(card.sourceUrls || [])].filter(validUrl))].sort();
  const reference = await sha256(`headline:${card.id}:${sourceUrls.join("|")}`);
  return {
    id: `mm:${reference.slice(0, 24)}`,
    title: card.headline.trim(),
    summary: (card.say || card.pov || card.headline).trim(),
    source_kind: "public_signal",
    sensitivity: "public",
    occurred_at: isoDate(briefingDate),
    source_urls: sourceUrls,
    corroboration: Math.max(1, Math.round(card.sourceCount || 1)),
    evidence_status: "public_grounded",
    category: card.category || "ai_native",
    source_ref_hash: reference,
    provider_score: Number.isFinite(card.score) ? card.score : 0,
  };
}

export async function trendToRadar(trend: CachedTrend): Promise<VideoRadarCandidate | null> {
  const urls = [...new Set((trend.evidence || []).map((item) => item.url).filter(validUrl))];
  if (!trend.title.trim() || urls.length === 0) return null;
  const reference = await sha256(`trend:${trend.id}:${urls.join("|")}`);
  const dates = (trend.evidence || []).map((item) => item.date).filter((date): date is string => Boolean(date)).map(Date.parse).filter(Number.isFinite);
  const occurredAt = dates.length ? new Date(Math.max(...dates)).toISOString() : isoDate(trend.detected_on);
  return {
    id: `mm-trend:${reference.slice(0, 24)}`,
    title: trend.title.trim(),
    summary: `${trend.summary.trim()} ${trend.implication.trim()}`.trim(),
    source_kind: "public_signal",
    sensitivity: "public",
    occurred_at: occurredAt,
    source_urls: urls,
    corroboration: Math.max(urls.length, Math.round(trend.source_count || 0)),
    evidence_status: "public_grounded",
    category: trend.category || "structural_shift",
    source_ref_hash: reference,
    provider_score: Number.isFinite(trend.momentum) ? trend.momentum : 0,
  };
}

export async function buildVideoRadarCandidates(headlines: CachedHeadline[], briefingDate: string, trends: CachedTrend[], limit: number): Promise<VideoRadarCandidate[]> {
  return buildVideoRadarCandidatesFromDays(
    [{ briefing_date: briefingDate, payload: headlines }],
    trends,
    limit,
  );
}

function titleFingerprint(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 180);
}

/** Merge repeated daily-cache sightings before ranking. The rolling window is
 * evidence coverage, not permission to show the same event several times. */
async function mergeRepeatedCandidates(candidates: VideoRadarCandidate[]): Promise<VideoRadarCandidate[]> {
  const groups: VideoRadarCandidate[][] = [];
  for (const candidate of candidates) {
    const titleKey = titleFingerprint(candidate.title);
    const urls = new Set(candidate.source_urls);
    const existing = groups.find((group) => {
      const first = group[0];
      return titleFingerprint(first.title) === titleKey
        || group.some((item) => item.source_urls.some((url) => urls.has(url)));
    });
    if (existing) existing.push(candidate);
    else groups.push([candidate]);
  }

  return Promise.all(groups.map(async (group) => {
    const sorted = [...group].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
    const primary = sorted[0];
    const sourceUrls = [...new Set(group.flatMap((item) => item.source_urls))].sort();
    const reference = await sha256(`public:${titleFingerprint(primary.title)}:${sourceUrls.join("|")}`);
    return {
      ...primary,
      id: `mm:${reference.slice(0, 24)}`,
      source_urls: sourceUrls,
      corroboration: Math.max(sourceUrls.length, ...group.map((item) => item.corroboration)),
      source_ref_hash: reference,
      provider_score: Math.max(...group.map((item) => item.provider_score || 0)),
    };
  }));
}

export async function buildVideoRadarCandidatesFromDays(
  days: CachedHeadlineDay[],
  trends: CachedTrend[],
  limit: number,
): Promise<VideoRadarCandidate[]> {
  const mapped = await Promise.all([
    ...days.flatMap((day) => day.payload.map((headline) => headlineToRadar(headline, day.briefing_date))),
    ...trends.map(trendToRadar),
  ]);
  const merged = await mergeRepeatedCandidates(
    mapped.filter((candidate): candidate is VideoRadarCandidate => candidate !== null),
  );
  return merged
    .sort((a, b) => (b.provider_score || 0) - (a.provider_score || 0)
      || Date.parse(b.occurred_at) - Date.parse(a.occurred_at)
      || a.id.localeCompare(b.id))
    .slice(0, limit);
}
