const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/;

export type DecisionReconstructionRequest = {
  questionId: string;
  idempotencyKey: string;
};

export function parseDecisionReconstructionRequest(raw: unknown): DecisionReconstructionRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("request_invalid");
  const value = raw as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "idempotencyKey" || keys[1] !== "questionId") {
    throw new Error("request_shape_invalid");
  }
  if (typeof value.questionId !== "string" || !UUID.test(value.questionId)) {
    throw new Error("question_id_invalid");
  }
  if (typeof value.idempotencyKey !== "string" || !IDEMPOTENCY_KEY.test(value.idempotencyKey)) {
    throw new Error("idempotency_key_invalid");
  }
  return {
    questionId: value.questionId.toLowerCase(),
    idempotencyKey: value.idempotencyKey,
  };
}

export function decisionReconstructionStatus(message: string): number {
  if (message.includes("auth_required") || message.includes("JWT")) return 401;
  if (message.includes("forbidden")) return 403;
  if (message.includes("not_found")) return 404;
  if (message.includes("busy_retry") || message.includes("candidate_pending") ||
    message.includes("replay_conflict") || message.includes("not_pending")) return 409;
  if (message.includes("ineligible") || message.includes("packet_too_large") ||
    message.includes("input_invalid")) return 422;
  return 500;
}
