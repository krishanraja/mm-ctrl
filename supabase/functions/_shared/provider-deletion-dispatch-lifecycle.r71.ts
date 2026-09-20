import type { CompiledProviderDeletionJobEnvelope, ProviderDeletionJobTarget } from "./provider-deletion-job-envelope.r70";

export const PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA = "ctrl.provider-deletion-dispatch-event.r71" as const;

export type ProviderDeletionDispatchEventKind =
  | "dispatched"
  | "accepted"
  | "completed"
  | "failed_retryable"
  | "failed_terminal"
  | "retry_requested"
  | "dead_lettered"
  | "operator_recovery_requested"
  | "operator_recovery_linked";

export type ProviderDeletionDispatchActor = "authority_issuer" | ProviderDeletionJobTarget | "operator";

export interface ProviderDeletionDispatchEvent {
  schema_version: typeof PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA;
  event_id: string;
  dispatch_id: string;
  event_kind: ProviderDeletionDispatchEventKind;
  actor_cell: ProviderDeletionDispatchActor;
  attempt: number;
  predecessor_event_id: string | null;
  occurred_at: string;
  result_receipt_sha256: string | null;
  failure_code: string | null;
  failure_evidence_sha256: string | null;
  next_dispatch_id: string | null;
  recovery_note_sha256: string | null;
}

export interface ProviderDeletionDispatchLifecycle {
  schema_version: "ctrl.provider-deletion-dispatch-lifecycle.r71";
  dispatch_id: string;
  attempt: number;
  state: ProviderDeletionDispatchEventKind;
  latest_event_id: string;
  event_count: number;
  automatic_terminal: boolean;
  operator_attention_required: boolean;
  closed: boolean;
  next_dispatch_id: string | null;
  ledger_sha256: string;
}

export type ProviderDeletionDispatchLifecycleResult =
  | { status: "accepted"; lifecycle: ProviderDeletionDispatchLifecycle }
  | { status: "held"; reasons: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const FAILURE_CODE = /^[a-z][a-z0-9_]{2,63}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const EVENT_KINDS = new Set<ProviderDeletionDispatchEventKind>([
  "dispatched", "accepted", "completed", "failed_retryable", "failed_terminal",
  "retry_requested", "dead_lettered", "operator_recovery_requested", "operator_recovery_linked",
]);
const TRANSITIONS: Record<ProviderDeletionDispatchEventKind, ProviderDeletionDispatchEventKind[]> = {
  dispatched: ["accepted", "failed_retryable", "failed_terminal"],
  accepted: ["completed", "failed_retryable", "failed_terminal"],
  completed: [],
  failed_retryable: ["retry_requested", "dead_lettered"],
  failed_terminal: ["dead_lettered"],
  retry_requested: [],
  dead_lettered: ["operator_recovery_requested"],
  operator_recovery_requested: ["operator_recovery_linked"],
  operator_recovery_linked: [],
};

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value !== "object") throw new Error("non_json_value");
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`provider-deletion-dispatch-lifecycle-r71\n${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function exactEventKeys(event: ProviderDeletionDispatchEvent): boolean {
  return Object.keys(event).sort().join("|") === [
    "actor_cell", "attempt", "dispatch_id", "event_id", "event_kind", "failure_code",
    "failure_evidence_sha256", "next_dispatch_id", "occurred_at", "predecessor_event_id",
    "recovery_note_sha256", "result_receipt_sha256", "schema_version",
  ].join("|");
}

function actorValid(event: ProviderDeletionDispatchEvent, target: ProviderDeletionJobTarget): boolean {
  if (event.event_kind === "dispatched" || event.event_kind === "retry_requested" || event.event_kind === "dead_lettered") {
    return event.actor_cell === "authority_issuer";
  }
  if (event.event_kind === "operator_recovery_requested" || event.event_kind === "operator_recovery_linked") {
    return event.actor_cell === "operator";
  }
  if (event.event_kind === "failed_retryable" || event.event_kind === "failed_terminal") {
    return event.actor_cell === target || event.actor_cell === "authority_issuer";
  }
  return event.actor_cell === target;
}

function detailValid(event: ProviderDeletionDispatchEvent): boolean {
  const noResult = event.result_receipt_sha256 === null;
  const noFailure = event.failure_code === null && event.failure_evidence_sha256 === null;
  const noNext = event.next_dispatch_id === null;
  const noRecovery = event.recovery_note_sha256 === null;
  if (event.event_kind === "completed") {
    return !!event.result_receipt_sha256 && SHA256.test(event.result_receipt_sha256) && noFailure && noNext && noRecovery;
  }
  if (event.event_kind === "failed_retryable" || event.event_kind === "failed_terminal") {
    return noResult && !!event.failure_code && FAILURE_CODE.test(event.failure_code) &&
      !!event.failure_evidence_sha256 && SHA256.test(event.failure_evidence_sha256) && noNext && noRecovery;
  }
  if (event.event_kind === "retry_requested") {
    return noResult && noFailure && !!event.next_dispatch_id && UUID.test(event.next_dispatch_id) && noRecovery;
  }
  if (event.event_kind === "operator_recovery_requested") {
    return noResult && noFailure && noNext && !!event.recovery_note_sha256 && SHA256.test(event.recovery_note_sha256);
  }
  if (event.event_kind === "operator_recovery_linked") {
    return noResult && noFailure && !!event.next_dispatch_id && UUID.test(event.next_dispatch_id) &&
      !!event.recovery_note_sha256 && SHA256.test(event.recovery_note_sha256);
  }
  return noResult && noFailure && noNext && noRecovery;
}

export async function compileProviderDeletionDispatchLifecycle(args: {
  envelope: CompiledProviderDeletionJobEnvelope;
  events: ProviderDeletionDispatchEvent[];
}): Promise<ProviderDeletionDispatchLifecycleResult> {
  const reasons: string[] = [];
  if (!Array.isArray(args.events) || args.events.length === 0) return { status: "held", reasons: ["dispatch_events_required"] };
  const seen = new Set<string>();
  let previous: ProviderDeletionDispatchEvent | null = null;
  for (const event of args.events) {
    if (!event || typeof event !== "object" || !exactEventKeys(event)) {
      reasons.push("dispatch_event_shape_invalid");
      continue;
    }
    if (event.schema_version !== PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA) reasons.push("dispatch_event_schema_invalid");
    if (!UUID.test(event.event_id) || seen.has(event.event_id)) reasons.push("dispatch_event_identity_invalid");
    seen.add(event.event_id);
    if (event.dispatch_id !== args.envelope.dispatch_id || event.attempt !== args.envelope.attempt) reasons.push("dispatch_event_scope_mismatch");
    if (!EVENT_KINDS.has(event.event_kind)) reasons.push("dispatch_event_kind_invalid");
    if (!validInstant(event.occurred_at)) reasons.push("dispatch_event_time_invalid");
    if (!actorValid(event, args.envelope.target_cell)) reasons.push("dispatch_event_actor_invalid");
    if (!detailValid(event)) reasons.push("dispatch_event_detail_invalid");
    if (event.next_dispatch_id === event.dispatch_id) reasons.push("dispatch_event_next_dispatch_invalid");

    if (!previous) {
      if (event.event_kind !== "dispatched" || event.predecessor_event_id !== null) reasons.push("dispatch_event_initial_invalid");
      if (validInstant(event.occurred_at) && Date.parse(event.occurred_at) < Date.parse(args.envelope.issued_at)) {
        reasons.push("dispatch_event_before_envelope");
      }
    } else {
      if (event.predecessor_event_id !== previous.event_id) reasons.push("dispatch_event_chain_invalid");
      if (!TRANSITIONS[previous.event_kind].includes(event.event_kind)) reasons.push("dispatch_event_transition_invalid");
      if (validInstant(event.occurred_at) && validInstant(previous.occurred_at) && Date.parse(event.occurred_at) < Date.parse(previous.occurred_at)) {
        reasons.push("dispatch_event_time_regressed");
      }
    }
    if (event.event_kind === "retry_requested" && args.envelope.attempt >= 5) reasons.push("dispatch_retry_limit_reached");
    if (event.event_kind === "dead_lettered" && previous?.event_kind === "failed_retryable" && args.envelope.attempt < 5) {
      reasons.push("dispatch_dead_letter_premature");
    }
    previous = event;
  }

  const uniqueReasons = [...new Set(reasons)].sort();
  if (uniqueReasons.length > 0 || !previous) return { status: "held", reasons: uniqueReasons };
  const automaticTerminal = new Set<ProviderDeletionDispatchEventKind>([
    "completed", "retry_requested", "dead_lettered", "operator_recovery_requested", "operator_recovery_linked",
  ]).has(previous.event_kind);
  const operatorAttentionRequired = new Set<ProviderDeletionDispatchEventKind>([
    "dead_lettered", "operator_recovery_requested",
  ]).has(previous.event_kind);
  const closed = new Set<ProviderDeletionDispatchEventKind>([
    "completed", "retry_requested", "operator_recovery_linked",
  ]).has(previous.event_kind);
  return {
    status: "accepted",
    lifecycle: {
      schema_version: "ctrl.provider-deletion-dispatch-lifecycle.r71",
      dispatch_id: args.envelope.dispatch_id,
      attempt: args.envelope.attempt,
      state: previous.event_kind,
      latest_event_id: previous.event_id,
      event_count: args.events.length,
      automatic_terminal: automaticTerminal,
      operator_attention_required: operatorAttentionRequired,
      closed,
      next_dispatch_id: previous.next_dispatch_id,
      ledger_sha256: await sha256(canonicalJson(args.events)),
    },
  };
}
