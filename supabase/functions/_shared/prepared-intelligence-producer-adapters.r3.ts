import type {
  PreparedAudience,
  PreparedDecisionReturn,
  PreparedNewsSignal,
} from "./prepared-intelligence.r1";

export interface LegacyNewsEvidenceSnapshot {
  evidence_id: string;
  source_name: string;
  url: string;
  published_at: string;
  source_tier: number;
}

export interface LegacyQualifiedNewsPoolItem {
  id: string;
  subject_id: string;
  audience: PreparedAudience;
  headline: string;
  summary: string;
  why_it_matters: string;
  category: string;
  source_count: number;
  user_relevance: number;
  matched_context: {
    ref: string;
    label: string;
  };
  feedback_fingerprint: string;
  topic_keys: string[];
  source_evidence?: LegacyNewsEvidenceSnapshot[];
}

export interface LegacyDecisionEvidenceSnapshot {
  evidence_id: string;
  source_name: string;
  url: string;
  observed_at: string;
}

export interface LegacyDecisionWatchAlert {
  id: string;
  user_id: string;
  audience: PreparedAudience;
  decision_case_id: string;
  decision_statement: string;
  claim_id: string;
  kind: "assumption_broke" | "evidence_shifted" | "new_contradiction";
  headline: string;
  detail: string;
  decision_effect?: string;
  status: "open" | "acknowledged" | "resolved";
  feedback_fingerprint: string;
  evidence_snapshot?: LegacyDecisionEvidenceSnapshot[];
}

export type ProducerAdapterResult<T> =
  | { status: "adapted"; signal: T }
  | { status: "held"; reasons: string[] };

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const MAX_NEWS_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const AUDIENCES = new Set<PreparedAudience>(["customer_private", "operator_private"]);
const DECISION_KINDS = new Set<LegacyDecisionWatchAlert["kind"]>([
  "assumption_broke",
  "evidence_shifted",
  "new_contradiction",
]);

function validText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function parseInstant(value: string): number | null {
  if (!ISO_INSTANT.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sourceHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function adaptLegacyQualifiedNews(
  item: LegacyQualifiedNewsPoolItem,
  generatedAt: string,
): ProducerAdapterResult<PreparedNewsSignal> {
  const reasons: string[] = [];
  const generatedMs = parseInstant(generatedAt);
  if (generatedMs === null) reasons.push("generated_time_invalid");
  if (!TOKEN.test(item.id) || !TOKEN.test(item.subject_id)) reasons.push("news_identity_invalid");
  if (!AUDIENCES.has(item.audience)) reasons.push("news_audience_invalid");
  if (!validText(item.headline, 180) || !validText(item.summary, 1800) || !validText(item.why_it_matters, 600)) {
    reasons.push("news_copy_invalid");
  }
  if (!validText(item.category, 80)) reasons.push("news_category_invalid");
  if (!Number.isFinite(item.user_relevance) || item.user_relevance < 0 || item.user_relevance > 1) {
    reasons.push("news_relevance_invalid");
  }
  if (!TOKEN.test(item.matched_context?.ref || "") || !validText(item.matched_context?.label, 240)) {
    reasons.push("news_context_receipt_invalid");
  }
  if (!TOKEN.test(item.feedback_fingerprint)) reasons.push("news_feedback_identity_invalid");
  if (!Array.isArray(item.topic_keys) || item.topic_keys.some((key) => !TOKEN.test(key))) reasons.push("news_topics_invalid");

  const snapshots = item.source_evidence;
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    reasons.push("news_source_evidence_missing");
  }

  const evidenceIds = new Set<string>();
  const hosts = new Set<string>();
  for (const source of snapshots ?? []) {
    if (!TOKEN.test(source.evidence_id) || evidenceIds.has(source.evidence_id)) reasons.push("news_evidence_identity_invalid");
    evidenceIds.add(source.evidence_id);
    if (!validText(source.source_name, 120) || !HTTP_URL.test(source.url)) reasons.push("news_evidence_source_invalid");
    const host = sourceHost(source.url);
    if (host === null) reasons.push("news_evidence_source_invalid");
    else hosts.add(host);
    if (!Number.isSafeInteger(source.source_tier) || source.source_tier < 1 || source.source_tier > 3) {
      reasons.push("news_source_tier_invalid");
    }
    const publishedMs = parseInstant(source.published_at);
    if (publishedMs === null) reasons.push("news_published_time_missing");
    else if (generatedMs !== null) {
      if (publishedMs > generatedMs + MAX_FUTURE_SKEW_MS) reasons.push("news_published_in_future");
      if (generatedMs - publishedMs > MAX_NEWS_AGE_MS) reasons.push("news_stale_for_live_pool");
    }
  }

  if (!Number.isSafeInteger(item.source_count) || item.source_count !== hosts.size) reasons.push("news_source_count_mismatch");
  if (hosts.size === 1 && (snapshots?.[0]?.source_tier ?? 0) < 2) reasons.push("news_single_source_unqualified");
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  const standing = hosts.size >= 2 ? "corroborated" as const : "reputable_single" as const;
  return {
    status: "adapted",
    signal: {
      kind: "news_signal",
      signal_id: `legacy-news:${item.id}`,
      subject_id: item.subject_id,
      audience: item.audience,
      purpose: "prepared_intelligence",
      title: item.headline.trim(),
      body: item.summary.trim(),
      why_it_matters: item.why_it_matters.trim(),
      selection_reason: `Selected because it bears on ${item.matched_context.label.trim()}.`,
      relevance_score: item.user_relevance,
      context_refs: [item.matched_context.ref],
      evidence: (snapshots ?? []).map((source) => ({
        evidence_id: source.evidence_id,
        source_name: source.source_name.trim(),
        url: source.url,
        observed_at: source.published_at,
        standing,
        subject_id: item.subject_id,
        audience: item.audience,
      })),
      feedback_fingerprint: item.feedback_fingerprint,
      topic_keys: uniqueSorted(item.topic_keys),
      category: item.category.trim(),
      source_count: item.source_count,
    },
  };
}

export function adaptLegacyDecisionWatch(
  alert: LegacyDecisionWatchAlert,
): ProducerAdapterResult<PreparedDecisionReturn> {
  const reasons: string[] = [];
  if (!TOKEN.test(alert.id) || !TOKEN.test(alert.user_id) || !TOKEN.test(alert.claim_id)) {
    reasons.push("decision_alert_identity_invalid");
  }
  if (!AUDIENCES.has(alert.audience)) reasons.push("decision_audience_invalid");
  if (!DECISION_KINDS.has(alert.kind)) reasons.push("decision_alert_kind_invalid");
  if (!TOKEN.test(alert.decision_case_id) || !validText(alert.decision_statement, 500)) {
    reasons.push("decision_linkage_invalid");
  }
  if (alert.status !== "open") reasons.push("decision_alert_not_open");
  if (!validText(alert.headline, 180) || !validText(alert.detail, 1800)) reasons.push("decision_alert_copy_invalid");
  if (!validText(alert.decision_effect, 600)) reasons.push("decision_effect_missing");
  if (!TOKEN.test(alert.feedback_fingerprint)) reasons.push("decision_feedback_identity_invalid");

  const snapshots = alert.evidence_snapshot;
  if (!Array.isArray(snapshots) || snapshots.length === 0) reasons.push("decision_evidence_snapshot_missing");
  const evidenceIds = new Set<string>();
  for (const source of snapshots ?? []) {
    if (!TOKEN.test(source.evidence_id) || evidenceIds.has(source.evidence_id)) reasons.push("decision_evidence_identity_invalid");
    evidenceIds.add(source.evidence_id);
    if (!validText(source.source_name, 120) || !HTTP_URL.test(source.url)) reasons.push("decision_evidence_source_invalid");
    if (parseInstant(source.observed_at) === null) reasons.push("decision_evidence_time_invalid");
  }
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  return {
    status: "adapted",
    signal: {
      kind: "decision_return",
      signal_id: `legacy-decision-alert:${alert.id}`,
      subject_id: alert.user_id,
      audience: alert.audience,
      purpose: "prepared_intelligence",
      title: alert.headline.trim(),
      body: alert.detail.trim(),
      why_it_matters: alert.decision_effect!.trim(),
      selection_reason: `Selected because a load-bearing condition changed in ${alert.decision_statement.trim()}.`,
      relevance_score: 1,
      context_refs: uniqueSorted([
        `brain:decision:${alert.decision_case_id}`,
        `brain:claim:${alert.claim_id}`,
      ]),
      evidence: (snapshots ?? []).map((source) => ({
        evidence_id: source.evidence_id,
        source_name: source.source_name.trim(),
        url: source.url,
        observed_at: source.observed_at,
        standing: "decision_observation",
        subject_id: alert.user_id,
        audience: alert.audience,
      })),
      feedback_fingerprint: alert.feedback_fingerprint,
      topic_keys: ["decision-watch"],
      decision_case_id: alert.decision_case_id,
      decision_statement: alert.decision_statement.trim(),
      trigger_kind: alert.kind,
    },
  };
}
