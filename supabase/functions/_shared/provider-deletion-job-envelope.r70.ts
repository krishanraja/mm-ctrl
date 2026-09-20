import {
  verifyDatabaseVerifiableProviderHandleAuthority,
  type ProviderHandleDbAuthorityVerification,
} from "./provider-deletion-handle-db-authority.r68";
import type {
  ExpectedProviderHandleAuthority,
  ProviderHandleAuthorityKeyring,
  ProviderHandleAuthorityOperation,
} from "./provider-deletion-handle-authority.r66";

export const PROVIDER_DELETION_JOB_SCHEMA = "ctrl.provider-deletion-job-envelope.r70" as const;

export type ProviderDeletionJobTarget = "crypto_writer" | "deletion_worker";

export interface ProviderDeletionJobEnvelopeInput {
  schema_version: typeof PROVIDER_DELETION_JOB_SCHEMA;
  dispatch_id: string;
  topology_sha256: string;
  target_cell: ProviderDeletionJobTarget;
  attempt: number;
  predecessor_dispatch_id: string | null;
  authority_token: string;
  issued_at: string;
  expires_at: string;
}

export interface CompiledProviderDeletionJobEnvelope extends ProviderDeletionJobEnvelopeInput {
  workspace_id: string;
  receipt_id: string;
  handle_id: string;
  provider: "elevenlabs" | "stripe";
  job_id: string;
  operation: ProviderHandleAuthorityOperation;
  authority_token_sha256: string;
  envelope_sha256: string;
}

export type ProviderDeletionJobEnvelopeResult =
  | { status: "accepted"; envelope: CompiledProviderDeletionJobEnvelope }
  | { status: "held"; reasons: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const MAX_JOB_LIFETIME_MS = 5 * 60 * 1_000;

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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`provider-deletion-job-envelope-r70\n${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function targetForOperation(operation: ProviderHandleAuthorityOperation): ProviderDeletionJobTarget {
  return operation === "register" ? "crypto_writer" : "deletion_worker";
}

function verificationReasons(verification: ProviderHandleDbAuthorityVerification): string[] {
  return verification.status === "held"
    ? verification.reasons.map((reason) => reason.startsWith("authority_") ? reason : `authority_${reason}`)
    : [];
}

export async function compileProviderDeletionJobEnvelope(args: {
  input: ProviderDeletionJobEnvelopeInput;
  expectedTopologySha256: string;
  expectedAuthority: ExpectedProviderHandleAuthority;
  authorityKeyring: ProviderHandleAuthorityKeyring;
  now: string;
}): Promise<ProviderDeletionJobEnvelopeResult> {
  const reasons: string[] = [];
  const input = args.input;
  if (!input || typeof input !== "object" || Object.keys(input).sort().join("|") !== [
    "attempt", "authority_token", "dispatch_id", "expires_at", "issued_at", "predecessor_dispatch_id",
    "schema_version", "target_cell", "topology_sha256",
  ].join("|")) return { status: "held", reasons: ["job_envelope_shape_invalid"] };
  if (input.schema_version !== PROVIDER_DELETION_JOB_SCHEMA) reasons.push("job_envelope_schema_invalid");
  if (!UUID.test(input.dispatch_id)) reasons.push("dispatch_identity_invalid");
  if (!SHA256.test(input.topology_sha256) || input.topology_sha256 !== args.expectedTopologySha256) reasons.push("topology_fingerprint_mismatch");
  if (!Number.isInteger(input.attempt) || input.attempt < 1 || input.attempt > 5) reasons.push("dispatch_attempt_invalid");
  if (input.attempt === 1 && input.predecessor_dispatch_id !== null) reasons.push("dispatch_predecessor_invalid");
  if (input.attempt > 1 && (!input.predecessor_dispatch_id || !UUID.test(input.predecessor_dispatch_id))) reasons.push("dispatch_predecessor_invalid");
  if (input.predecessor_dispatch_id === input.dispatch_id) reasons.push("dispatch_predecessor_invalid");
  if (!validInstant(input.issued_at) || !validInstant(input.expires_at) || !validInstant(args.now)) {
    reasons.push("dispatch_time_invalid");
  } else {
    const lifetime = Date.parse(input.expires_at) - Date.parse(input.issued_at);
    const now = Date.parse(args.now);
    if (lifetime <= 0 || lifetime > MAX_JOB_LIFETIME_MS) reasons.push("dispatch_lifetime_invalid");
    if (now < Date.parse(input.issued_at)) reasons.push("dispatch_not_yet_valid");
    if (now >= Date.parse(input.expires_at)) reasons.push("dispatch_expired");
  }

  const verification = await verifyDatabaseVerifiableProviderHandleAuthority({
    token: input.authority_token,
    keyring: args.authorityKeyring,
    expected: args.expectedAuthority,
    now: args.now,
  });
  reasons.push(...verificationReasons(verification));
  if (verification.status === "accepted") {
    const authority = verification.authority;
    if (input.target_cell !== targetForOperation(authority.operation)) reasons.push("dispatch_target_mismatch");
    if (validInstant(input.issued_at) && Date.parse(input.issued_at) < Date.parse(authority.issued_at)) {
      reasons.push("dispatch_before_authority");
    }
    if (validInstant(input.expires_at) && Date.parse(input.expires_at) > Date.parse(authority.expires_at)) {
      reasons.push("dispatch_exceeds_authority");
    }
  }
  const uniqueReasons = [...new Set(reasons)].sort();
  if (uniqueReasons.length > 0 || verification.status !== "accepted") {
    return { status: "held", reasons: uniqueReasons };
  }

  const authority = verification.authority;
  const unsigned = {
    ...input,
    workspace_id: authority.workspace_id,
    receipt_id: authority.receipt_id,
    handle_id: authority.handle_id,
    provider: authority.provider,
    job_id: authority.job_id,
    operation: authority.operation,
    authority_token_sha256: verification.token_sha256,
  };
  return {
    status: "accepted",
    envelope: { ...unsigned, envelope_sha256: await sha256(canonicalJson(unsigned)) },
  };
}
