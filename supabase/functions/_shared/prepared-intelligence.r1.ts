export type PreparedAudience = "customer_private" | "operator_private";
export type PreparedPurpose = "prepared_intelligence";
export type PreparedSignalKind = "decision_return" | "news_signal";
export type EvidenceStanding = "primary" | "corroborated" | "reputable_single" | "decision_observation";

export interface PreparedEvidenceRef {
  evidence_id: string;
  source_name: string;
  url: string;
  observed_at: string;
  standing: EvidenceStanding;
  subject_id: string;
  audience: PreparedAudience;
}

interface PreparedSignalBase {
  signal_id: string;
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
  title: string;
  body: string;
  why_it_matters: string;
  selection_reason: string;
  relevance_score: number;
  context_refs: string[];
  evidence: PreparedEvidenceRef[];
  feedback_fingerprint: string;
  topic_keys: string[];
}

export interface PreparedNewsSignal extends PreparedSignalBase {
  kind: "news_signal";
  category: string;
  source_count: number;
}

export interface PreparedDecisionReturn extends PreparedSignalBase {
  kind: "decision_return";
  decision_case_id: string;
  decision_statement: string;
  trigger_kind: "evidence_shifted" | "assumption_broke" | "new_contradiction";
}

export type PreparedSignal = PreparedNewsSignal | PreparedDecisionReturn;

export interface PreparedIntelligenceInput {
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
  context_version: string;
  selector_version: string;
  generated_at: string;
  candidates: PreparedSignal[];
  suppressed_fingerprints?: string[];
  excluded_topic_keys?: string[];
}

export interface PreparedContentBlock {
  block_id: string;
  signal_id: string;
  kind: PreparedSignalKind;
  title: string;
  body: string;
  why_it_matters: string;
  selection_reason: string;
  evidence_ids: string[];
  context_refs: string[];
}

export interface PreparedIntelligenceObject {
  schema_version: "ctrl.prepared-intelligence.r1";
  prepared_object_id: string;
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
  context_version: string;
  selector_version: string;
  generated_at: string;
  signals: PreparedSignal[];
  content_blocks: PreparedContentBlock[];
  provenance: PreparedEvidenceRef[];
  selection_receipts: Array<{
    signal_id: string;
    context_refs: string[];
    selection_reason: string;
  }>;
  controls: {
    feedback_targets: Array<{ signal_id: string; feedback_fingerprint: string }>;
    correction_dependency_ids: string[];
  };
  read_projection: {
    source_object_id: string;
    block_ids: string[];
  };
  audio_projection: {
    source_object_id: string;
    block_ids: string[];
    spoken_text: string;
  };
}

export type PreparedIntelligenceResult =
  | {
      status: "prepared";
      object: PreparedIntelligenceObject;
      rejected: Array<{ signal_id: string; reason: string }>;
    }
  | {
      status: "held";
      reasons: string[];
      rejected: Array<{ signal_id: string; reason: string }>;
    };

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const HTTP_URL = /^https?:\/\/[^\s]+$/i;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const AUDIENCES = new Set<PreparedAudience>(["customer_private", "operator_private"]);
const SIGNAL_KINDS = new Set<PreparedSignalKind>(["decision_return", "news_signal"]);
const EVIDENCE_STANDINGS = new Set<EvidenceStanding>([
  "primary",
  "corroborated",
  "reputable_single",
  "decision_observation",
]);
const DECISION_TRIGGERS = new Set<PreparedDecisionReturn["trigger_kind"]>([
  "evidence_shifted",
  "assumption_broke",
  "new_contradiction",
]);

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function evidenceKey(evidence: PreparedEvidenceRef): string {
  return `${evidence.evidence_id}\u0000${evidence.url}`;
}

function canonicalEvidence(evidence: PreparedEvidenceRef[]): PreparedEvidenceRef[] {
  return [...evidence].sort((a, b) => evidenceKey(a).localeCompare(evidenceKey(b)));
}

function validateEvidence(
  evidence: PreparedEvidenceRef[],
  subjectId: string,
  audience: PreparedAudience,
): string | null {
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.length > 12) return "evidence_cardinality_invalid";
  const ids = new Set<string>();
  for (const ref of evidence) {
    if (!TOKEN.test(ref.evidence_id) || ids.has(ref.evidence_id)) return "evidence_identity_invalid";
    ids.add(ref.evidence_id);
    if (!text(ref.source_name, 120)) return "evidence_source_invalid";
    if (!HTTP_URL.test(ref.url)) return "evidence_url_invalid";
    if (!ISO_INSTANT.test(ref.observed_at)) return "evidence_time_invalid";
    if (!EVIDENCE_STANDINGS.has(ref.standing)) return "evidence_standing_invalid";
    if (ref.subject_id !== subjectId) return "evidence_subject_mismatch";
    if (ref.audience !== audience) return "evidence_audience_mismatch";
  }
  return null;
}

function validateSignal(
  signal: PreparedSignal,
  input: PreparedIntelligenceInput,
  suppressed: Set<string>,
  excluded: Set<string>,
): string | null {
  if (!TOKEN.test(signal.signal_id)) return "signal_identity_invalid";
  if (!SIGNAL_KINDS.has(signal.kind)) return "signal_kind_invalid";
  if (signal.subject_id !== input.subject_id) return "signal_subject_mismatch";
  if (signal.audience !== input.audience) return "signal_audience_mismatch";
  if (signal.purpose !== input.purpose) return "signal_purpose_mismatch";
  if (
    !text(signal.title, 180) ||
    !text(signal.body, 1800) ||
    !text(signal.why_it_matters, 600) ||
    !text(signal.selection_reason, 600)
  ) return "signal_copy_invalid";
  if (!Number.isFinite(signal.relevance_score) || signal.relevance_score < 0 || signal.relevance_score > 1) return "relevance_invalid";
  if (!Array.isArray(signal.context_refs) || signal.context_refs.length === 0 || signal.context_refs.some((ref) => !TOKEN.test(ref))) return "context_receipt_invalid";
  if (!TOKEN.test(signal.feedback_fingerprint)) return "feedback_fingerprint_invalid";
  if (suppressed.has(signal.feedback_fingerprint)) return "suppressed_by_feedback";
  if (!Array.isArray(signal.topic_keys) || signal.topic_keys.some((key) => !TOKEN.test(key))) return "topic_keys_invalid";
  if (signal.topic_keys.some((key) => excluded.has(key))) return "excluded_by_user_control";

  const evidenceFailure = validateEvidence(signal.evidence, input.subject_id, input.audience);
  if (evidenceFailure) return evidenceFailure;

  if (signal.kind === "news_signal") {
    if (!text(signal.category, 80)) return "news_category_invalid";
    const distinctSources = new Set(signal.evidence.map((ref) => ref.source_name.toLowerCase())).size;
    if (!Number.isSafeInteger(signal.source_count) || signal.source_count !== distinctSources) return "news_source_count_mismatch";
    const hasStrongSingleSource = signal.evidence.some((ref) => ref.standing === "primary" || ref.standing === "reputable_single");
    if (distinctSources < 2 && !hasStrongSingleSource) return "news_standing_too_thin";
  } else {
    if (!TOKEN.test(signal.decision_case_id) || !text(signal.decision_statement, 500)) return "decision_linkage_invalid";
    if (!DECISION_TRIGGERS.has(signal.trigger_kind)) return "decision_trigger_kind_invalid";
    if (!signal.evidence.some((ref) => ref.standing === "decision_observation")) return "decision_trigger_evidence_missing";
  }

  return null;
}

function signalOrder(a: PreparedSignal, b: PreparedSignal): number {
  if (a.kind !== b.kind) return a.kind === "decision_return" ? -1 : 1;
  if (a.relevance_score !== b.relevance_score) return b.relevance_score - a.relevance_score;
  return a.signal_id.localeCompare(b.signal_id);
}

function buildObjectId(input: PreparedIntelligenceInput, signals: PreparedSignal[]): string {
  const parts = [input.subject_id, input.audience, input.context_version, input.selector_version, ...signals.map((signal) => signal.signal_id)];
  return `prepared:${parts.join(":")}`;
}

function spokenBlock(block: PreparedContentBlock, provenance: PreparedEvidenceRef[]): string {
  const sources = uniqueSorted(
    provenance
      .filter((ref) => block.evidence_ids.includes(ref.evidence_id))
      .map((ref) => ref.source_name),
  );
  return `${block.title}. ${block.body} Why this matters to you: ${block.why_it_matters} Sources: ${sources.join(", ")}.`;
}

export function prepareIntelligence(input: PreparedIntelligenceInput): PreparedIntelligenceResult {
  const envelopeFailures: string[] = [];
  if (!TOKEN.test(input.subject_id)) envelopeFailures.push("subject_identity_invalid");
  if (!AUDIENCES.has(input.audience)) envelopeFailures.push("audience_invalid");
  if (input.purpose !== "prepared_intelligence") envelopeFailures.push("purpose_invalid");
  if (!TOKEN.test(input.context_version)) envelopeFailures.push("context_version_invalid");
  if (!TOKEN.test(input.selector_version)) envelopeFailures.push("selector_version_invalid");
  if (!ISO_INSTANT.test(input.generated_at)) envelopeFailures.push("generated_time_invalid");
  if (!Array.isArray(input.candidates)) envelopeFailures.push("candidate_set_invalid");
  if (
    input.suppressed_fingerprints !== undefined &&
    (!Array.isArray(input.suppressed_fingerprints) || input.suppressed_fingerprints.some((value) => !TOKEN.test(value)))
  ) envelopeFailures.push("suppression_control_invalid");
  if (
    input.excluded_topic_keys !== undefined &&
    (!Array.isArray(input.excluded_topic_keys) || input.excluded_topic_keys.some((value) => !TOKEN.test(value)))
  ) envelopeFailures.push("topic_control_invalid");
  if (envelopeFailures.length > 0) return { status: "held", reasons: envelopeFailures, rejected: [] };

  const candidateIds = new Set<string>();
  for (const candidate of input.candidates) {
    if (candidateIds.has(candidate.signal_id)) {
      return { status: "held", reasons: ["duplicate_signal_identity"], rejected: [] };
    }
    candidateIds.add(candidate.signal_id);
  }

  const suppressed = new Set(input.suppressed_fingerprints ?? []);
  const excluded = new Set(input.excluded_topic_keys ?? []);
  const rejected: Array<{ signal_id: string; reason: string }> = [];
  const accepted: PreparedSignal[] = [];

  for (const candidate of input.candidates) {
    const reason = validateSignal(candidate, input, suppressed, excluded);
    if (reason) rejected.push({ signal_id: candidate.signal_id || "unknown", reason });
    else {
      accepted.push({
        ...candidate,
        title: candidate.title.trim(),
        body: candidate.body.trim(),
        why_it_matters: candidate.why_it_matters.trim(),
        selection_reason: candidate.selection_reason.trim(),
        context_refs: uniqueSorted(candidate.context_refs),
        topic_keys: uniqueSorted(candidate.topic_keys),
        evidence: canonicalEvidence(candidate.evidence).map((ref) => ({
          ...ref,
          source_name: ref.source_name.trim(),
        })),
      });
    }
  }

  if (accepted.length === 0) {
    return {
      status: "held",
      reasons: input.candidates.length === 0 ? ["quiet_no_earned_intervention"] : ["no_candidate_cleared_governance"],
      rejected,
    };
  }

  accepted.sort(signalOrder);

  const evidenceIdentity = new Map<string, string>();
  for (const signal of accepted) {
    for (const ref of signal.evidence) {
      const canonical = JSON.stringify(ref);
      const existing = evidenceIdentity.get(ref.evidence_id);
      if (existing !== undefined && existing !== canonical) {
        return { status: "held", reasons: ["evidence_identity_collision"], rejected };
      }
      evidenceIdentity.set(ref.evidence_id, canonical);
    }
  }

  const preparedObjectId = buildObjectId(input, accepted);
  const provenanceMap = new Map<string, PreparedEvidenceRef>();
  for (const signal of accepted) {
    for (const ref of signal.evidence) provenanceMap.set(evidenceKey(ref), ref);
  }
  const provenance = canonicalEvidence([...provenanceMap.values()]);
  const contentBlocks = accepted.map<PreparedContentBlock>((signal, index) => ({
    block_id: `${preparedObjectId}:block:${index + 1}`,
    signal_id: signal.signal_id,
    kind: signal.kind,
    title: signal.title.trim(),
    body: signal.body.trim(),
    why_it_matters: signal.why_it_matters.trim(),
    selection_reason: signal.selection_reason.trim(),
    evidence_ids: signal.evidence.map((ref) => ref.evidence_id),
    context_refs: signal.context_refs,
  }));
  const blockIds = contentBlocks.map((block) => block.block_id);

  return {
    status: "prepared",
    rejected,
    object: {
      schema_version: "ctrl.prepared-intelligence.r1",
      prepared_object_id: preparedObjectId,
      subject_id: input.subject_id,
      audience: input.audience,
      purpose: input.purpose,
      context_version: input.context_version,
      selector_version: input.selector_version,
      generated_at: input.generated_at,
      signals: accepted,
      content_blocks: contentBlocks,
      provenance,
      selection_receipts: accepted.map((signal) => ({
        signal_id: signal.signal_id,
        context_refs: signal.context_refs,
        selection_reason: signal.selection_reason,
      })),
      controls: {
        feedback_targets: accepted.map((signal) => ({ signal_id: signal.signal_id, feedback_fingerprint: signal.feedback_fingerprint })),
        correction_dependency_ids: uniqueSorted(accepted.flatMap((signal) => signal.context_refs)),
      },
      read_projection: { source_object_id: preparedObjectId, block_ids: blockIds },
      audio_projection: {
        source_object_id: preparedObjectId,
        block_ids: blockIds,
        spoken_text: contentBlocks.map((block) => spokenBlock(block, provenance)).join(" "),
      },
    },
  };
}
