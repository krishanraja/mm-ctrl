const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/;

export type DecisionIngressRequest =
  | {
    action: "stage_grounded_candidate";
    questionId: string;
    sourceType: "meeting" | "document" | "observed_action" | "external";
    sourceText: string;
    candidateText: string;
    capturedAt: string;
    evidenceRefs: Array<{
      evidenceAtomId: string;
      stance: "supports" | "refutes" | "context";
    }>;
    idempotencyKey: string;
  }
  | {
    action: "stage_candidate";
    questionId: string;
    sourceType: "meeting" | "document" | "observed_action" | "external";
    sourceText: string;
    candidateText: string;
    capturedAt: string;
    idempotencyKey: string;
  }
  | {
    action: "answer_question";
    questionId: string;
    answer: string;
    recordedAt: string;
    idempotencyKey: string;
  }
  | {
    action: "review_candidate";
    candidateId: string;
    disposition: "confirmed" | "corrected" | "rejected";
    answer?: string;
    reviewedAt: string;
    idempotencyKey: string;
  };

export class DecisionIngressInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionIngressInputError";
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DecisionIngressInputError("body_invalid");
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !Object.hasOwn(value, key)) || Object.keys(value).some((key) => !allowed.has(key))) {
    throw new DecisionIngressInputError("body_shape_invalid");
  }
}

function string(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw new DecisionIngressInputError(`${label}_invalid`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new DecisionIngressInputError(`${label}_invalid`);
  return trimmed;
}

function uuid(value: unknown, label: string): string {
  const parsed = string(value, label, 36, 36).toLowerCase();
  if (!UUID.test(parsed)) throw new DecisionIngressInputError(`${label}_invalid`);
  return parsed;
}

function timestamp(value: unknown, label: string): string {
  const parsed = string(value, label, 20, 40);
  const milliseconds = Date.parse(parsed);
  if (!Number.isFinite(milliseconds)) throw new DecisionIngressInputError(`${label}_invalid`);
  if (milliseconds > Date.now() + 5_000) throw new DecisionIngressInputError(`${label}_in_future`);
  return new Date(milliseconds).toISOString();
}

function idempotency(value: unknown): string {
  const parsed = string(value, "idempotency_key", 8, 200);
  if (!IDEMPOTENCY_KEY.test(parsed)) throw new DecisionIngressInputError("idempotency_key_invalid");
  return parsed;
}

function evidenceRefs(value: unknown): Array<{ evidenceAtomId: string; stance: "supports" | "refutes" | "context" }> {
  if (!Array.isArray(value) || value.length < 1 || value.length > 24) {
    throw new DecisionIngressInputError("evidence_refs_invalid");
  }
  const seen = new Set<string>();
  const parsed = value.map((entry) => {
    const item = object(entry);
    exactKeys(item, ["evidenceAtomId", "stance"]);
    const evidenceAtomId = uuid(item.evidenceAtomId, "evidence_atom_id");
    const stance = string(item.stance, "stance", 1, 20);
    if (!["supports", "refutes", "context"].includes(stance)) {
      throw new DecisionIngressInputError("stance_invalid");
    }
    if (seen.has(evidenceAtomId)) throw new DecisionIngressInputError("evidence_ref_duplicate");
    seen.add(evidenceAtomId);
    return { evidenceAtomId, stance: stance as "supports" | "refutes" | "context" };
  });
  if (!parsed.some((entry) => entry.stance === "supports")) {
    throw new DecisionIngressInputError("supporting_evidence_required");
  }
  return parsed.sort((a, b) => a.evidenceAtomId.localeCompare(b.evidenceAtomId));
}

export function parseDecisionIngressRequest(raw: unknown): DecisionIngressRequest {
  const value = object(raw);
  const action = string(value.action, "action", 1, 40);
  if (action === "stage_candidate" || action === "stage_grounded_candidate") {
    const grounded = action === "stage_grounded_candidate";
    exactKeys(
      value,
      grounded
        ? ["action", "questionId", "sourceType", "sourceText", "candidateText", "capturedAt", "evidenceRefs", "idempotencyKey"]
        : ["action", "questionId", "sourceType", "sourceText", "candidateText", "capturedAt", "idempotencyKey"],
    );
    const sourceType = string(value.sourceType, "source_type", 1, 40);
    if (!["meeting", "document", "observed_action", "external"].includes(sourceType)) {
      throw new DecisionIngressInputError("source_type_invalid");
    }
    const shared = {
      action,
      questionId: uuid(value.questionId, "question_id"),
      sourceType: sourceType as "meeting" | "document" | "observed_action" | "external",
      sourceText: string(value.sourceText, "source_text", 1, 80_000),
      candidateText: string(value.candidateText, "candidate_text", 1, 4_000),
      capturedAt: timestamp(value.capturedAt, "captured_at"),
      idempotencyKey: idempotency(value.idempotencyKey),
    };
    return grounded
      ? { ...shared, action, evidenceRefs: evidenceRefs(value.evidenceRefs) }
      : { ...shared, action };
  }
  if (action === "answer_question") {
    exactKeys(value, ["action", "questionId", "answer", "recordedAt", "idempotencyKey"]);
    return {
      action,
      questionId: uuid(value.questionId, "question_id"),
      answer: string(value.answer, "answer", 1, 8_000),
      recordedAt: timestamp(value.recordedAt, "recorded_at"),
      idempotencyKey: idempotency(value.idempotencyKey),
    };
  }
  if (action === "review_candidate") {
    exactKeys(value, ["action", "candidateId", "disposition", "reviewedAt", "idempotencyKey"], ["answer"]);
    const disposition = string(value.disposition, "disposition", 1, 20);
    if (!["confirmed", "corrected", "rejected"].includes(disposition)) {
      throw new DecisionIngressInputError("disposition_invalid");
    }
    const answer = value.answer === undefined ? undefined : string(value.answer, "answer", 1, 8_000);
    if (disposition === "corrected" && !answer) throw new DecisionIngressInputError("answer_required");
    if (disposition === "rejected" && answer !== undefined) throw new DecisionIngressInputError("answer_not_allowed");
    return {
      action,
      candidateId: uuid(value.candidateId, "candidate_id"),
      disposition: disposition as "confirmed" | "corrected" | "rejected",
      answer,
      reviewedAt: timestamp(value.reviewedAt, "reviewed_at"),
      idempotencyKey: idempotency(value.idempotencyKey),
    };
  }
  throw new DecisionIngressInputError("action_invalid");
}

export function canonicalDecisionIngressFingerprintMaterial(request: DecisionIngressRequest): string {
  if (request.action === "stage_candidate" || request.action === "stage_grounded_candidate") {
    return JSON.stringify({
      v: 1,
      action: request.action,
      question_id: request.questionId,
      source_type: request.sourceType,
      source_text: request.sourceText,
      candidate_text: request.candidateText,
      captured_at: request.capturedAt,
      evidence_refs: request.action === "stage_grounded_candidate"
        ? request.evidenceRefs.map((entry) => ({ evidence_atom_id: entry.evidenceAtomId, stance: entry.stance }))
        : null,
      idempotency_key: request.idempotencyKey,
    });
  }
  if (request.action === "answer_question") {
    return JSON.stringify({
      v: 1,
      action: request.action,
      question_id: request.questionId,
      answer: request.answer,
      recorded_at: request.recordedAt,
      idempotency_key: request.idempotencyKey,
    });
  }
  return JSON.stringify({
    v: 1,
    action: request.action,
    candidate_id: request.candidateId,
    disposition: request.disposition,
    answer: request.answer ?? null,
    reviewed_at: request.reviewedAt,
    idempotency_key: request.idempotencyKey,
  });
}

export function decisionIngressErrorStatus(message: string): number {
  if (message.includes("not_found")) return 404;
  if (message.includes("auth_required")) return 401;
  if (message.includes("forbidden")) return 403;
  if (message.includes("busy_retry")) return 503;
  if (message.includes("replay_conflict") || message.includes("already_reviewed") || message.includes("ineligible")) return 409;
  if (message.includes("input_invalid") || message.includes("cipher_")) return 400;
  return 500;
}
