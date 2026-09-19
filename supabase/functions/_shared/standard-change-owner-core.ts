const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,120}$/;

type PrepareRequest = {
  action: "prepare";
  check_id: string;
  expected_result_sha256: string;
};

type DecideRequest = {
  action: "decide";
  review_packet_id: string;
  expected_packet_sha256: string;
  expected_standard_sha256: string;
  request_id: string;
  decision: "approved" | "rejected";
  note?: string | null;
};

type ReverseRequest = {
  action: "reverse";
  application_id: string;
  expected_application_hash: string;
  expected_active_standard_sha256: string;
  request_id: string;
  reason: string;
};

export type OwnerStandardChangeRequest = PrepareRequest | DecideRequest | ReverseRequest;

const PREPARE_KEYS = new Set(["action", "check_id", "expected_result_sha256"]);
const DECIDE_KEYS = new Set([
  "action",
  "review_packet_id",
  "expected_packet_sha256",
  "expected_standard_sha256",
  "request_id",
  "decision",
  "note",
]);
const REVERSE_KEYS = new Set([
  "action",
  "application_id",
  "expected_application_hash",
  "expected_active_standard_sha256",
  "request_id",
  "reason",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function exactKeys(value: Record<string, unknown>, allowed: Set<string>, required: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.has(key)) && required.every((key) => Object.hasOwn(value, key));
}

function optionalNote(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || (typeof value === "string" && value.length <= 2_000);
}

export function parseOwnerStandardChangeRequest(value: unknown): OwnerStandardChangeRequest {
  const body = record(value);
  if (!body || typeof body.action !== "string") throw new Error("invalid_request_shape");
  if (body.action === "prepare") {
    if (!exactKeys(body, PREPARE_KEYS, ["action", "check_id", "expected_result_sha256"]) ||
      typeof body.check_id !== "string" || !UUID.test(body.check_id) ||
      typeof body.expected_result_sha256 !== "string" || !SHA256.test(body.expected_result_sha256)) {
      throw new Error("invalid_prepare_request");
    }
    return body as PrepareRequest;
  }
  if (body.action === "decide") {
    if (!exactKeys(body, DECIDE_KEYS, [
      "action",
      "review_packet_id",
      "expected_packet_sha256",
      "expected_standard_sha256",
      "request_id",
      "decision",
    ]) || typeof body.review_packet_id !== "string" || !UUID.test(body.review_packet_id) ||
      typeof body.expected_packet_sha256 !== "string" || !SHA256.test(body.expected_packet_sha256) ||
      typeof body.expected_standard_sha256 !== "string" || !SHA256.test(body.expected_standard_sha256) ||
      typeof body.request_id !== "string" || !REQUEST_ID.test(body.request_id) ||
      (body.decision !== "approved" && body.decision !== "rejected") || !optionalNote(body.note)) {
      throw new Error("invalid_decide_request");
    }
    return body as DecideRequest;
  }
  if (body.action === "reverse") {
    if (!exactKeys(body, REVERSE_KEYS, [
      "action",
      "application_id",
      "expected_application_hash",
      "expected_active_standard_sha256",
      "request_id",
      "reason",
    ]) || typeof body.application_id !== "string" || !UUID.test(body.application_id) ||
      typeof body.expected_application_hash !== "string" || !SHA256.test(body.expected_application_hash) ||
      typeof body.expected_active_standard_sha256 !== "string" || !SHA256.test(body.expected_active_standard_sha256) ||
      typeof body.request_id !== "string" || !REQUEST_ID.test(body.request_id) ||
      typeof body.reason !== "string" || body.reason.trim().length < 1 || body.reason.length > 2_000) {
      throw new Error("invalid_reverse_request");
    }
    return body as ReverseRequest;
  }
  throw new Error("invalid_action");
}

export function ownerStandardChangeRpc(input: OwnerStandardChangeRequest): {
  name: string;
  args: Record<string, unknown>;
} {
  if (input.action === "prepare") {
    return {
      name: "prepare_standard_change_review",
      args: {
        p_check_id: input.check_id,
        p_expected_result_sha256: input.expected_result_sha256,
      },
    };
  }
  if (input.action === "decide") {
    return {
      name: "decide_standard_change_review",
      args: {
        p_review_packet_id: input.review_packet_id,
        p_expected_packet_sha256: input.expected_packet_sha256,
        p_expected_standard_sha256: input.expected_standard_sha256,
        p_request_id: input.request_id,
        p_decision: input.decision,
        p_note: input.note ?? null,
      },
    };
  }
  return {
    name: "reverse_standard_change_application",
    args: {
      p_application_id: input.application_id,
      p_expected_application_hash: input.expected_application_hash,
      p_expected_active_standard_sha256: input.expected_active_standard_sha256,
      p_request_id: input.request_id,
      p_reason: input.reason,
    },
  };
}

export function ownerStandardChangeErrorStatus(message: string): number {
  if (message.includes("not_owned")) return 404;
  if (message.includes("invalid")) return 400;
  if (message.includes("changed") || message.includes("stale") || message.includes("not_ready") ||
    message.includes("not_passed") || message.includes("not_actionable") || message.includes("no_effect") ||
    message.includes("already") || message.includes("conflict") || message.includes("missing") ||
    message.includes("mismatch")) return 409;
  return 500;
}
