import { CLUSTER_THRESHOLD, jaccard, titleTokens, type RawArticle } from "./news-cluster";
import type {
  LegacyDecisionWatchAlert,
  LegacyQualifiedNewsPoolItem,
} from "./prepared-intelligence-producer-adapters.r3";
import type { PreparedAudience } from "./prepared-intelligence.r1";

export type ReceiptResult<T> =
  | { status: "created"; receipt: T }
  | { status: "held"; reasons: string[] };

export interface QualifiedNewsReceiptInput {
  id: string;
  subject_id: string;
  audience: PreparedAudience;
  headline: string;
  summary: string;
  why_it_matters: string;
  category: string;
  user_relevance: number;
  matched_context: {
    ref: string;
    label: string;
  };
  feedback_fingerprint: string;
  topic_keys: string[];
  cluster_members: RawArticle[];
}

export interface DecisionVerificationEvidence {
  source_url: string | null;
  source_title: string | null;
  excerpt: string | null;
  stance: "supports" | "refutes" | "neutral";
  retriever: string;
}

export interface DecisionObservationReceiptInput {
  alert_id: string;
  user_id: string;
  audience: PreparedAudience;
  decision_case_id: string;
  decision_statement: string;
  claim_id: string;
  kind: LegacyDecisionWatchAlert["kind"];
  headline: string;
  detail: string;
  decision_effect: string;
  status: LegacyDecisionWatchAlert["status"];
  observed_at: string;
  prior: {
    verdict: string;
    confidence: number | null;
  };
  current: {
    verdict: string;
    confidence: number | null;
  };
  verification_evidence: DecisionVerificationEvidence[];
  feedback_fingerprint: string;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const AUDIENCES = new Set<PreparedAudience>(["customer_private", "operator_private"]);
const DECISION_KINDS = new Set<LegacyDecisionWatchAlert["kind"]>([
  "assumption_broke",
  "evidence_shifted",
  "new_contradiction",
]);
const ALERT_STATUSES = new Set<LegacyDecisionWatchAlert["status"]>(["open", "acknowledged", "resolved"]);
const VERDICTS = new Set(["supported", "contested", "unverified", "unverifiable", "pending"]);

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function validText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function stableFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function compareArticle(a: RawArticle, b: RawArticle): number {
  if (b.sourceTier !== a.sourceTier) return b.sourceTier - a.sourceTier;
  const timeA = a.publishedIso ? Date.parse(a.publishedIso) : 0;
  const timeB = b.publishedIso ? Date.parse(b.publishedIso) : 0;
  if (timeA !== timeB) return timeB - timeA;
  return a.url.localeCompare(b.url);
}

export function createQualifiedNewsReceipt(
  input: QualifiedNewsReceiptInput,
): ReceiptResult<LegacyQualifiedNewsPoolItem> {
  const reasons: string[] = [];
  if (!TOKEN.test(input.id) || !TOKEN.test(input.subject_id)) reasons.push("news_receipt_identity_invalid");
  if (!AUDIENCES.has(input.audience)) reasons.push("news_receipt_audience_invalid");
  if (!validText(input.headline, 180) || !validText(input.summary, 1800) || !validText(input.why_it_matters, 600)) {
    reasons.push("news_receipt_copy_invalid");
  }
  if (!validText(input.category, 80)) reasons.push("news_receipt_category_invalid");
  if (!Number.isFinite(input.user_relevance) || input.user_relevance < 0 || input.user_relevance > 1) {
    reasons.push("news_receipt_relevance_invalid");
  }
  if (!TOKEN.test(input.matched_context?.ref || "") || !validText(input.matched_context?.label, 240)) {
    reasons.push("news_receipt_context_invalid");
  }
  if (!TOKEN.test(input.feedback_fingerprint)) reasons.push("news_receipt_feedback_invalid");
  if (!Array.isArray(input.topic_keys) || input.topic_keys.some((topic) => !TOKEN.test(topic))) {
    reasons.push("news_receipt_topics_invalid");
  }
  if (!Array.isArray(input.cluster_members) || input.cluster_members.length === 0) {
    reasons.push("news_cluster_members_missing");
    return { status: "held", reasons: uniqueSorted(reasons) };
  }

  const ranked = [...input.cluster_members].sort(compareArticle);
  const representative = ranked[0];
  const representativeTokens = titleTokens(representative.title);
  const byHost = new Map<string, RawArticle>();
  const urls = new Set<string>();

  for (const article of ranked) {
    if (!validText(article.source, 120) || !HTTP_URL.test(article.url)) reasons.push("news_member_source_invalid");
    if (urls.has(article.url)) reasons.push("news_member_url_duplicate");
    urls.add(article.url);
    const host = hostOf(article.url);
    if (host === null) reasons.push("news_member_source_invalid");
    else if (!byHost.has(host)) byHost.set(host, article);
    if (!article.publishedIso || !ISO_INSTANT.test(article.publishedIso)) reasons.push("news_member_publication_missing");
    if (!Number.isSafeInteger(article.sourceTier) || article.sourceTier < 1 || article.sourceTier > 3) reasons.push("news_member_tier_invalid");
    if (article !== representative && jaccard(representativeTokens, titleTokens(article.title)) < CLUSTER_THRESHOLD) {
      reasons.push("news_member_not_in_cluster");
    }
  }

  if (byHost.size === 1 && representative.sourceTier < 2) reasons.push("news_cluster_unqualified");
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  const sourceEvidence = [...byHost.entries()]
    .sort(([hostA], [hostB]) => hostA.localeCompare(hostB))
    .map(([host, article]) => ({
      evidence_id: `news-source:${stableFingerprint(`${host}\u0000${article.url}`)}`,
      source_name: article.source.trim(),
      url: article.url,
      published_at: article.publishedIso!,
      source_tier: article.sourceTier,
    }));

  return {
    status: "created",
    receipt: {
      id: input.id,
      subject_id: input.subject_id,
      audience: input.audience,
      headline: input.headline,
      summary: input.summary,
      why_it_matters: input.why_it_matters,
      category: input.category,
      source_count: byHost.size,
      user_relevance: input.user_relevance,
      matched_context: { ...input.matched_context },
      feedback_fingerprint: input.feedback_fingerprint,
      topic_keys: uniqueSorted(input.topic_keys),
      source_evidence: sourceEvidence,
    },
  };
}

function changeEarnsReturn(input: DecisionObservationReceiptInput): boolean {
  const wasSolid = input.prior.verdict === "supported";
  const nowWeak = input.current.verdict === "contested" || input.current.verdict === "unverified";
  const confidenceDropped =
    input.prior.confidence !== null &&
    input.prior.confidence >= 0.6 &&
    input.current.confidence !== null &&
    input.current.confidence < 0.4;
  if (input.kind === "assumption_broke") return wasSolid && input.current.verdict === "contested";
  if (input.kind === "evidence_shifted") return (wasSolid && nowWeak) || confidenceDropped;
  return input.current.verdict === "contested" && input.verification_evidence.some((evidence) => evidence.stance === "refutes");
}

export function createDecisionObservationReceipt(
  input: DecisionObservationReceiptInput,
): ReceiptResult<LegacyDecisionWatchAlert> {
  const reasons: string[] = [];
  if (!TOKEN.test(input.alert_id) || !TOKEN.test(input.user_id) || !TOKEN.test(input.claim_id)) {
    reasons.push("decision_receipt_identity_invalid");
  }
  if (!AUDIENCES.has(input.audience)) reasons.push("decision_receipt_audience_invalid");
  if (!TOKEN.test(input.decision_case_id) || !validText(input.decision_statement, 500)) {
    reasons.push("decision_receipt_linkage_invalid");
  }
  if (!DECISION_KINDS.has(input.kind)) reasons.push("decision_receipt_kind_invalid");
  if (!ALERT_STATUSES.has(input.status)) reasons.push("decision_receipt_status_invalid");
  if (!validText(input.headline, 180) || !validText(input.detail, 1800)) reasons.push("decision_receipt_copy_invalid");
  if (!TOKEN.test(input.feedback_fingerprint)) reasons.push("decision_receipt_feedback_invalid");
  if (!VERDICTS.has(input.prior.verdict) || !VERDICTS.has(input.current.verdict)) reasons.push("decision_verdict_invalid");
  for (const confidence of [input.prior.confidence, input.current.confidence]) {
    if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
      reasons.push("decision_confidence_invalid");
    }
  }
  if (!changeEarnsReturn(input)) reasons.push("decision_change_not_load_bearing");
  if (!ISO_INSTANT.test(input.observed_at)) reasons.push("decision_observation_time_invalid");
  if (!validText(input.decision_effect, 600)) reasons.push("decision_effect_missing");
  if (!Array.isArray(input.verification_evidence) || input.verification_evidence.length === 0) {
    reasons.push("decision_verification_evidence_missing");
  }

  const byUrl = new Map<string, DecisionVerificationEvidence>();
  for (const evidence of input.verification_evidence ?? []) {
    if (!["supports", "refutes", "neutral"].includes(evidence.stance)) reasons.push("decision_evidence_stance_invalid");
    if (!evidence.source_url || !HTTP_URL.test(evidence.source_url)) {
      reasons.push("decision_verification_source_missing");
      continue;
    }
    if (!byUrl.has(evidence.source_url)) byUrl.set(evidence.source_url, evidence);
  }
  if (byUrl.size === 0) reasons.push("decision_verification_evidence_unusable");
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  const evidenceSnapshot = [...byUrl.entries()]
    .sort(([urlA], [urlB]) => urlA.localeCompare(urlB))
    .map(([url, evidence]) => ({
      evidence_id: `decision-source:${stableFingerprint(`${input.claim_id}\u0000${url}`)}`,
      source_name: evidence.source_title?.trim() || hostOf(url) || evidence.retriever,
      url,
      observed_at: input.observed_at,
    }));

  return {
    status: "created",
    receipt: {
      id: input.alert_id,
      user_id: input.user_id,
      audience: input.audience,
      decision_case_id: input.decision_case_id,
      decision_statement: input.decision_statement,
      claim_id: input.claim_id,
      kind: input.kind,
      headline: input.headline,
      detail: input.detail,
      decision_effect: input.decision_effect,
      status: input.status,
      feedback_fingerprint: input.feedback_fingerprint,
      evidence_snapshot: evidenceSnapshot,
    },
  };
}
