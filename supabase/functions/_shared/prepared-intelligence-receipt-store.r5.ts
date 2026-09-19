import type { PreparedAudience, PreparedPurpose } from "./prepared-intelligence.r1";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ReceiptKind = "qualified_news" | "decision_observation";

export interface ReceiptScope {
  owner_id: string;
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
}

export interface ReceiptEnvelope extends ReceiptScope {
  receipt_id: string;
  kind: ReceiptKind;
  produced_at: string;
  expires_at: string;
  correction_dependency_ids: string[];
  payload: JsonValue;
}

interface AcceptedReceiptEvent extends ReceiptScope {
  type: "receipt_accepted";
  event_id: string;
  receipt_id: string;
  kind: ReceiptKind;
  produced_at: string;
  expires_at: string;
  correction_dependency_ids: string[];
  content_fingerprint: string;
}

interface CorrectionEvent extends ReceiptScope {
  type: "receipt_invalidated";
  event_id: string;
  correction_id: string;
  correction_fingerprint: string;
  receipt_id: string;
  invalidated_at: string;
  matched_dependency_ids: string[];
}

interface ErasureEvent {
  type: "subject_erased";
  event_id: string;
  erasure_id: string;
  erasure_fingerprint: string;
  owner_id: string;
  subject_id: string;
  erased_at: string;
  receipt_ids: string[];
  content_fingerprints: string[];
}

interface DeliveryEvent extends ReceiptScope {
  type: "delivery_recorded";
  event_id: string;
  delivery_id: string;
  delivery_fingerprint: string;
  receipt_id: string;
  channel: "read" | "audio" | "email" | "export";
  attempted_at: string;
  outcome: "attempted" | "delivered" | "failed";
}

interface ProjectionEvent extends ReceiptScope {
  type: "projection_registered";
  event_id: string;
  projection_id: string;
  projection_fingerprint: string;
  receipt_ids: string[];
  registered_at: string;
}

export type ReceiptStoreEvent =
  | AcceptedReceiptEvent
  | CorrectionEvent
  | ErasureEvent
  | DeliveryEvent
  | ProjectionEvent;

export interface ReceiptContentBlob {
  receipt_id: string;
  content_fingerprint: string;
  canonical_payload: string;
}

export interface ReceiptStoreState {
  schema_version: "ctrl.prepared-intelligence-receipt-store.r5";
  events: ReceiptStoreEvent[];
  content_blobs: ReceiptContentBlob[];
}

export type StoreTransition =
  | { status: "committed" | "idempotent"; state: ReceiptStoreState }
  | { status: "held"; reasons: string[]; state: ReceiptStoreState };

export interface CorrectionCommand extends ReceiptScope {
  correction_id: string;
  dependency_ids: string[];
  invalidated_at: string;
}

export interface ErasureCommand {
  erasure_id: string;
  owner_id: string;
  subject_id: string;
  erased_at: string;
}

export interface DeliveryCommand extends ReceiptScope {
  delivery_id: string;
  receipt_id: string;
  channel: DeliveryEvent["channel"];
  attempted_at: string;
  outcome: DeliveryEvent["outcome"];
}

export interface ProjectionCommand extends ReceiptScope {
  projection_id: string;
  receipt_ids: string[];
  registered_at: string;
}

export type ReceiptResolution =
  | { status: "available"; payload: JsonValue; content_fingerprint: string }
  | { status: "held"; reason: string };

export type ProjectionResolution =
  | { status: "current"; receipt_ids: string[] }
  | { status: "held"; reason: string; stale_receipt_ids?: string[] };

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const AUDIENCES = new Set<PreparedAudience>(["customer_private", "operator_private"]);
const RECEIPT_KINDS = new Set<ReceiptKind>(["qualified_news", "decision_observation"]);
const DELIVERY_CHANNELS = new Set<DeliveryEvent["channel"]>(["read", "audio", "email", "export"]);
const DELIVERY_OUTCOMES = new Set<DeliveryEvent["outcome"]>(["attempted", "delivered", "failed"]);

export function createEmptyReceiptStore(): ReceiptStoreState {
  return {
    schema_version: "ctrl.prepared-intelligence-receipt-store.r5",
    events: [],
    content_blobs: [],
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function validToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

function validInstant(value: string): boolean {
  return ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function validateScope(scope: ReceiptScope): string[] {
  const reasons: string[] = [];
  if (!validToken(scope.owner_id) || !validToken(scope.subject_id)) reasons.push("scope_identity_invalid");
  if (!AUDIENCES.has(scope.audience)) reasons.push("scope_audience_invalid");
  if (scope.purpose !== "prepared_intelligence") reasons.push("scope_purpose_invalid");
  return reasons;
}

function canonicalize(value: unknown, seen = new Set<object>()): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error("cyclic_json");
    seen.add(value);
    const encoded = `[${value.map((item) => canonicalize(item, seen)).join(",")}]`;
    seen.delete(value);
    return encoded;
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const prototype = Object.getPrototypeOf(object);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("non_plain_object");
    if (seen.has(object)) throw new Error("cyclic_json");
    seen.add(object);
    const keys = Object.keys(object).sort((a, b) => a.localeCompare(b));
    const members = keys.map((key) => {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("unsafe_json_key");
      const member = object[key];
      if (member === undefined || typeof member === "function" || typeof member === "symbol" || typeof member === "bigint") {
        throw new Error("non_json_value");
      }
      return `${JSON.stringify(key)}:${canonicalize(member, seen)}`;
    });
    seen.delete(object);
    return `{${members.join(",")}}`;
  }
  throw new Error("non_json_value");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cloneState(state: ReceiptStoreState): ReceiptStoreState {
  return {
    schema_version: state.schema_version,
    events: [...state.events],
    content_blobs: [...state.content_blobs],
  };
}

function acceptedEvent(state: ReceiptStoreState, receiptId: string): AcceptedReceiptEvent | undefined {
  return state.events.find((event): event is AcceptedReceiptEvent => event.type === "receipt_accepted" && event.receipt_id === receiptId);
}

function scopeMatches(scope: ReceiptScope, event: ReceiptScope): boolean {
  return scope.owner_id === event.owner_id &&
    scope.subject_id === event.subject_id &&
    scope.audience === event.audience &&
    scope.purpose === event.purpose;
}

export async function appendReceipt(state: ReceiptStoreState, envelope: ReceiptEnvelope): Promise<StoreTransition> {
  const reasons = validateScope(envelope);
  if (state.events.some((event) => event.type === "subject_erased" && event.owner_id === envelope.owner_id && event.subject_id === envelope.subject_id)) {
    reasons.push("subject_erasure_tombstone_active");
  }
  if (!validToken(envelope.receipt_id)) reasons.push("receipt_identity_invalid");
  if (!RECEIPT_KINDS.has(envelope.kind)) reasons.push("receipt_kind_invalid");
  if (!validInstant(envelope.produced_at) || !validInstant(envelope.expires_at)) reasons.push("receipt_time_invalid");
  else if (Date.parse(envelope.expires_at) <= Date.parse(envelope.produced_at)) reasons.push("receipt_expiry_invalid");
  if (!Array.isArray(envelope.correction_dependency_ids) || envelope.correction_dependency_ids.length === 0 || envelope.correction_dependency_ids.some((id) => !validToken(id))) {
    reasons.push("receipt_dependencies_invalid");
  }

  let canonicalPayload = "";
  try {
    canonicalPayload = canonicalize(envelope.payload);
  } catch {
    reasons.push("receipt_payload_not_canonical_json");
  }
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };

  const normalized = {
    ...envelope,
    correction_dependency_ids: uniqueSorted(envelope.correction_dependency_ids),
    payload: JSON.parse(canonicalPayload) as JsonValue,
  };
  const contentFingerprint = await sha256(canonicalPayload);
  const eventFingerprint = await sha256(canonicalize({ ...normalized, content_fingerprint: contentFingerprint, payload: null }));
  const existing = acceptedEvent(state, envelope.receipt_id);
  if (existing) {
    const same = existing.event_id === `receipt:${eventFingerprint}` && existing.content_fingerprint === contentFingerprint;
    return same
      ? { status: "idempotent", state }
      : { status: "held", reasons: ["receipt_identity_conflict"], state };
  }

  const event: AcceptedReceiptEvent = {
    type: "receipt_accepted",
    event_id: `receipt:${eventFingerprint}`,
    receipt_id: envelope.receipt_id,
    kind: envelope.kind,
    owner_id: envelope.owner_id,
    subject_id: envelope.subject_id,
    audience: envelope.audience,
    purpose: envelope.purpose,
    produced_at: envelope.produced_at,
    expires_at: envelope.expires_at,
    correction_dependency_ids: normalized.correction_dependency_ids,
    content_fingerprint: contentFingerprint,
  };
  const next = cloneState(state);
  next.events.push(event);
  next.content_blobs.push({ receipt_id: envelope.receipt_id, content_fingerprint: contentFingerprint, canonical_payload: canonicalPayload });
  return { status: "committed", state: next };
}

export function resolveReceipt(
  state: ReceiptStoreState,
  receiptId: string,
  scope: ReceiptScope,
  asOf: string,
): ReceiptResolution {
  if (!validInstant(asOf)) return { status: "held", reason: "read_time_invalid" };
  const accepted = acceptedEvent(state, receiptId);
  if (!accepted) return { status: "held", reason: "receipt_not_found" };
  if (!scopeMatches(scope, accepted)) return { status: "held", reason: "receipt_scope_mismatch" };
  if (state.events.some((event) => event.type === "subject_erased" && event.owner_id === scope.owner_id && event.subject_id === scope.subject_id && event.receipt_ids.includes(receiptId))) {
    return { status: "held", reason: "receipt_erased" };
  }
  if (state.events.some((event) => event.type === "receipt_invalidated" && event.receipt_id === receiptId)) {
    return { status: "held", reason: "receipt_invalidated" };
  }
  if (Date.parse(asOf) >= Date.parse(accepted.expires_at)) return { status: "held", reason: "receipt_expired" };
  const blob = state.content_blobs.find((candidate) => candidate.receipt_id === receiptId && candidate.content_fingerprint === accepted.content_fingerprint);
  if (!blob) return { status: "held", reason: "receipt_content_unavailable" };
  return {
    status: "available",
    payload: JSON.parse(blob.canonical_payload) as JsonValue,
    content_fingerprint: accepted.content_fingerprint,
  };
}

export async function invalidateByCorrection(state: ReceiptStoreState, command: CorrectionCommand): Promise<StoreTransition> {
  const reasons = validateScope(command);
  if (!validToken(command.correction_id)) reasons.push("correction_identity_invalid");
  if (!validInstant(command.invalidated_at)) reasons.push("correction_time_invalid");
  if (!Array.isArray(command.dependency_ids) || command.dependency_ids.length === 0 || command.dependency_ids.some((id) => !validToken(id))) {
    reasons.push("correction_dependencies_invalid");
  }
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };

  const normalizedDependencies = uniqueSorted(command.dependency_ids);
  const commandFingerprint = await sha256(canonicalize({ ...command, dependency_ids: normalizedDependencies }));
  const previous = state.events.find((event): event is CorrectionEvent => event.type === "receipt_invalidated" && event.correction_id === command.correction_id);
  if (previous) {
    return previous.correction_fingerprint === commandFingerprint
      ? { status: "idempotent", state }
      : { status: "held", reasons: ["correction_identity_conflict"], state };
  }

  const matches = state.events.filter((event): event is AcceptedReceiptEvent =>
    event.type === "receipt_accepted" &&
    scopeMatches(command, event) &&
    event.correction_dependency_ids.some((id) => normalizedDependencies.includes(id))
  );
  if (matches.length === 0) return { status: "held", reasons: ["correction_has_no_matching_receipt"], state };
  if (matches.some((event) => Date.parse(command.invalidated_at) < Date.parse(event.produced_at))) {
    return { status: "held", reasons: ["correction_time_precedes_receipt"], state };
  }

  const next = cloneState(state);
  for (const match of matches.sort((a, b) => a.receipt_id.localeCompare(b.receipt_id))) {
    const matchedDependencies = match.correction_dependency_ids.filter((id) => normalizedDependencies.includes(id));
    const eventFingerprint = await sha256(canonicalize({ command_fingerprint: commandFingerprint, receipt_id: match.receipt_id }));
    next.events.push({
      type: "receipt_invalidated",
      event_id: `correction:${eventFingerprint}`,
      correction_id: command.correction_id,
      correction_fingerprint: commandFingerprint,
      receipt_id: match.receipt_id,
      owner_id: command.owner_id,
      subject_id: command.subject_id,
      audience: command.audience,
      purpose: command.purpose,
      invalidated_at: command.invalidated_at,
      matched_dependency_ids: matchedDependencies,
    });
  }
  return { status: "committed", state: next };
}

export async function eraseSubject(state: ReceiptStoreState, command: ErasureCommand): Promise<StoreTransition> {
  const reasons: string[] = [];
  if (!validToken(command.erasure_id) || !validToken(command.owner_id) || !validToken(command.subject_id)) reasons.push("erasure_identity_invalid");
  if (!validInstant(command.erased_at)) reasons.push("erasure_time_invalid");
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };

  const fingerprint = await sha256(canonicalize(command));
  const previous = state.events.find((event): event is ErasureEvent => event.type === "subject_erased" && event.erasure_id === command.erasure_id);
  if (previous) {
    return previous.erasure_fingerprint === fingerprint
      ? { status: "idempotent", state }
      : { status: "held", reasons: ["erasure_identity_conflict"], state };
  }
  const receipts = state.events.filter((event): event is AcceptedReceiptEvent =>
    event.type === "receipt_accepted" && event.owner_id === command.owner_id && event.subject_id === command.subject_id
  );
  const receiptIds = receipts.map((event) => event.receipt_id).sort((a, b) => a.localeCompare(b));
  const next = cloneState(state);
  next.content_blobs = next.content_blobs.filter((blob) => !receiptIds.includes(blob.receipt_id));
  next.events.push({
    type: "subject_erased",
    event_id: `erasure:${fingerprint}`,
    erasure_id: command.erasure_id,
    erasure_fingerprint: fingerprint,
    owner_id: command.owner_id,
    subject_id: command.subject_id,
    erased_at: command.erased_at,
    receipt_ids: receiptIds,
    content_fingerprints: receipts.map((event) => event.content_fingerprint).sort((a, b) => a.localeCompare(b)),
  });
  return { status: "committed", state: next };
}

export async function registerProjection(state: ReceiptStoreState, command: ProjectionCommand): Promise<StoreTransition> {
  const reasons = validateScope(command);
  if (!validToken(command.projection_id)) reasons.push("projection_identity_invalid");
  if (!validInstant(command.registered_at)) reasons.push("projection_time_invalid");
  if (!Array.isArray(command.receipt_ids) || command.receipt_ids.length === 0 || command.receipt_ids.some((id) => !validToken(id))) {
    reasons.push("projection_receipts_invalid");
  }
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };
  const receiptIds = uniqueSorted(command.receipt_ids || []);
  const fingerprint = await sha256(canonicalize({ ...command, receipt_ids: receiptIds }));
  const previous = state.events.find((event): event is ProjectionEvent => event.type === "projection_registered" && event.projection_id === command.projection_id);
  if (previous) {
    return previous.projection_fingerprint === fingerprint
      ? { status: "idempotent", state }
      : { status: "held", reasons: ["projection_identity_conflict"], state };
  }
  for (const receiptId of receiptIds) {
    if (resolveReceipt(state, receiptId, command, command.registered_at).status !== "available") reasons.push("projection_receipt_unavailable");
  }
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };
  const next = cloneState(state);
  next.events.push({
    type: "projection_registered",
    event_id: `projection:${fingerprint}`,
    projection_id: command.projection_id,
    projection_fingerprint: fingerprint,
    receipt_ids: receiptIds,
    owner_id: command.owner_id,
    subject_id: command.subject_id,
    audience: command.audience,
    purpose: command.purpose,
    registered_at: command.registered_at,
  });
  return { status: "committed", state: next };
}

export function resolveProjection(state: ReceiptStoreState, projectionId: string, scope: ReceiptScope, asOf: string): ProjectionResolution {
  const projection = state.events.find((event): event is ProjectionEvent => event.type === "projection_registered" && event.projection_id === projectionId);
  if (!projection) return { status: "held", reason: "projection_not_found" };
  if (!scopeMatches(scope, projection)) return { status: "held", reason: "projection_scope_mismatch" };
  const stale = projection.receipt_ids.filter((receiptId) => resolveReceipt(state, receiptId, scope, asOf).status !== "available");
  return stale.length > 0
    ? { status: "held", reason: "projection_stale", stale_receipt_ids: stale }
    : { status: "current", receipt_ids: projection.receipt_ids };
}

export async function recordDelivery(state: ReceiptStoreState, command: DeliveryCommand): Promise<StoreTransition> {
  const reasons = validateScope(command);
  if (!validToken(command.delivery_id) || !validToken(command.receipt_id)) reasons.push("delivery_identity_invalid");
  if (!validInstant(command.attempted_at)) reasons.push("delivery_time_invalid");
  if (!DELIVERY_CHANNELS.has(command.channel)) reasons.push("delivery_channel_invalid");
  if (!DELIVERY_OUTCOMES.has(command.outcome)) reasons.push("delivery_outcome_invalid");
  const accepted = acceptedEvent(state, command.receipt_id);
  if (!accepted || !scopeMatches(command, accepted)) reasons.push("delivery_receipt_scope_invalid");
  else if (resolveReceipt(state, command.receipt_id, command, command.attempted_at).status !== "available") reasons.push("delivery_receipt_unavailable");
  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons), state };
  const fingerprint = await sha256(canonicalize(command));
  const previous = state.events.find((event): event is DeliveryEvent => event.type === "delivery_recorded" && event.delivery_id === command.delivery_id);
  if (previous) {
    return previous.delivery_fingerprint === fingerprint
      ? { status: "idempotent", state }
      : { status: "held", reasons: ["delivery_identity_conflict"], state };
  }
  const next = cloneState(state);
  next.events.push({
    type: "delivery_recorded",
    event_id: `delivery:${fingerprint}`,
    delivery_id: command.delivery_id,
    delivery_fingerprint: fingerprint,
    receipt_id: command.receipt_id,
    owner_id: command.owner_id,
    subject_id: command.subject_id,
    audience: command.audience,
    purpose: command.purpose,
    channel: command.channel,
    attempted_at: command.attempted_at,
    outcome: command.outcome,
  });
  return { status: "committed", state: next };
}
