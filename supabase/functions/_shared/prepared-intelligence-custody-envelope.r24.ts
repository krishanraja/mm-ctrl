import type { PreparedAudience, PreparedPurpose } from "./prepared-intelligence.r1";
import type { CanonicalBrainAudience, PreparedAuthorityKind } from "./prepared-intelligence-authority-envelope.r7";

export interface StableCustodyScope {
  workspace_id: string;
  custody_principal_id: string;
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
}

export interface CustodyReadback {
  workspace_id: string;
  custody_principal_id: string;
  status: "active" | "transfer_required" | "closed";
  observed_at: string;
}

export interface CustodyAuthorityReference {
  workspace_id: string;
  custody_principal_id: string;
  subject_id: string;
  audience: CanonicalBrainAudience;
  purpose: PreparedPurpose;
  authority_kind: PreparedAuthorityKind;
  authority_record_id: string;
  authority_version: string;
  authority_sha256: string;
  observed_at: string;
}

export interface CustodyEnvelopeInput {
  receipt_id: string;
  scope: StableCustodyScope;
  custody_readback: CustodyReadback;
  dependencies: CustodyAuthorityReference[];
  current_authority: CustodyAuthorityReference[];
}

export interface PreparedCustodyEnvelope {
  schema_version: "ctrl.prepared-intelligence-custody-envelope.r24";
  receipt_id: string;
  workspace_id: string;
  custody_principal_id: string;
  subject_id: string;
  audience: CanonicalBrainAudience;
  purpose: PreparedPurpose;
  dependencies: CustodyAuthorityReference[];
  authority_fingerprint: string;
}

export type CustodyEnvelopeResult =
  | { status: "accepted"; envelope: PreparedCustodyEnvelope }
  | { status: "held"; reasons: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const AUTHORITY_KINDS = new Set<PreparedAuthorityKind>([
  "brain_item_version",
  "decision_case_snapshot",
  "decision_claim_snapshot",
  "external_source_receipt",
]);
const SCOPE_KEYS = new Set(["workspace_id", "custody_principal_id", "subject_id", "audience", "purpose"]);
const CUSTODY_KEYS = new Set(["workspace_id", "custody_principal_id", "status", "observed_at"]);
const REFERENCE_KEYS = new Set([
  "workspace_id",
  "custody_principal_id",
  "subject_id",
  "audience",
  "purpose",
  "authority_kind",
  "authority_record_id",
  "authority_version",
  "authority_sha256",
  "observed_at",
]);
const CUSTODY_STATUSES = new Set<CustodyReadback["status"]>(["active", "transfer_required", "closed"]);

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function unknownFields(value: object, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).some((key) => !allowed.has(key));
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function canonicalAudience(audience: PreparedAudience): CanonicalBrainAudience | null {
  if (audience === "customer_private") return "person_private";
  if (audience === "operator_private") return "delivery_team_private";
  return null;
}

function dependencyKey(reference: Pick<CustodyAuthorityReference, "authority_kind" | "authority_record_id">): string {
  return `${reference.authority_kind}:${reference.authority_record_id}`;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value !== "object") throw new Error("non_json_value");
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(`prepared-custody-envelope-r24\n${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateReference(reference: CustodyAuthorityReference, scope: Omit<PreparedCustodyEnvelope, "schema_version" | "receipt_id" | "dependencies" | "authority_fingerprint">): string[] {
  const reasons: string[] = [];
  if (unknownFields(reference, REFERENCE_KEYS)) reasons.push("dependency_unknown_field");
  if (!AUTHORITY_KINDS.has(reference.authority_kind)) reasons.push("dependency_kind_invalid");
  if (!UUID.test(reference.workspace_id) || !UUID.test(reference.custody_principal_id) ||
      !UUID.test(reference.subject_id) || !UUID.test(reference.authority_record_id)) {
    reasons.push("dependency_identity_invalid");
  }
  if (!VERSION.test(reference.authority_version)) reasons.push("dependency_version_invalid");
  if (!SHA256.test(reference.authority_sha256)) reasons.push("dependency_fingerprint_invalid");
  if (!validInstant(reference.observed_at)) reasons.push("dependency_observed_at_invalid");
  if (!new Set<CanonicalBrainAudience>(["person_private", "delivery_team_private"]).has(reference.audience)) {
    reasons.push("dependency_audience_invalid");
  }
  if (reference.purpose !== "prepared_intelligence") reasons.push("dependency_purpose_invalid");
  if (reference.workspace_id !== scope.workspace_id) reasons.push("dependency_workspace_mismatch");
  if (reference.custody_principal_id !== scope.custody_principal_id) reasons.push("dependency_custody_mismatch");
  if (reference.subject_id !== scope.subject_id) reasons.push("dependency_subject_mismatch");
  if (reference.audience !== scope.audience) reasons.push("dependency_audience_mismatch");
  if (reference.purpose !== scope.purpose) reasons.push("dependency_purpose_mismatch");
  return reasons;
}

export async function buildPreparedCustodyEnvelope(input: CustodyEnvelopeInput): Promise<CustodyEnvelopeResult> {
  const reasons: string[] = [];
  const mappedAudience = canonicalAudience(input.scope.audience);
  if (unknownFields(input.scope, SCOPE_KEYS)) reasons.push("scope_unknown_field");
  if (unknownFields(input.custody_readback, CUSTODY_KEYS)) reasons.push("custody_unknown_field");
  if (!UUID.test(input.receipt_id)) reasons.push("receipt_identity_invalid");
  if (!UUID.test(input.scope.workspace_id) || !UUID.test(input.scope.custody_principal_id) || !UUID.test(input.scope.subject_id)) {
    reasons.push("scope_identity_invalid");
  }
  if (!mappedAudience) reasons.push("scope_audience_invalid");
  if (input.scope.purpose !== "prepared_intelligence") reasons.push("scope_purpose_invalid");
  if (!validInstant(input.custody_readback.observed_at)) reasons.push("custody_observed_at_invalid");
  if (input.custody_readback.workspace_id !== input.scope.workspace_id) reasons.push("custody_workspace_mismatch");
  if (input.custody_readback.custody_principal_id !== input.scope.custody_principal_id) reasons.push("custody_principal_mismatch");
  if (!CUSTODY_STATUSES.has(input.custody_readback.status)) reasons.push("custody_status_invalid");
  else if (input.custody_readback.status !== "active") reasons.push(`custody_${input.custody_readback.status}`);
  if (!Array.isArray(input.dependencies) || input.dependencies.length === 0) reasons.push("dependencies_required");
  if (!Array.isArray(input.current_authority) || input.current_authority.length === 0) reasons.push("current_authority_required");
  if (reasons.length > 0 || !mappedAudience) return { status: "held", reasons: uniqueSorted(reasons) };

  const scope = {
    workspace_id: input.scope.workspace_id,
    custody_principal_id: input.scope.custody_principal_id,
    subject_id: input.scope.subject_id,
    audience: mappedAudience,
    purpose: input.scope.purpose,
  };
  const dependencyKeys = new Set<string>();
  const currentByKey = new Map<string, CustodyAuthorityReference>();

  for (const current of input.current_authority) {
    reasons.push(...validateReference(current, scope));
    const key = dependencyKey(current);
    if (currentByKey.has(key)) reasons.push("current_authority_duplicate");
    currentByKey.set(key, current);
  }

  for (const dependency of input.dependencies) {
    reasons.push(...validateReference(dependency, scope));
    const key = dependencyKey(dependency);
    if (dependencyKeys.has(key)) reasons.push("dependency_duplicate");
    dependencyKeys.add(key);
    const current = currentByKey.get(key);
    if (!current) {
      reasons.push("dependency_authority_missing");
      continue;
    }
    if (dependency.authority_version !== current.authority_version || dependency.authority_sha256 !== current.authority_sha256) {
      reasons.push("dependency_authority_stale");
    }
  }

  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  const dependencies = [...input.dependencies].sort((left, right) => {
    const keyOrder = dependencyKey(left).localeCompare(dependencyKey(right));
    if (keyOrder !== 0) return keyOrder;
    return left.authority_version.localeCompare(right.authority_version);
  });
  const unsigned = {
    schema_version: "ctrl.prepared-intelligence-custody-envelope.r24" as const,
    receipt_id: input.receipt_id,
    ...scope,
    dependencies,
  };
  return {
    status: "accepted",
    envelope: {
      ...unsigned,
      authority_fingerprint: await sha256(canonicalJson(unsigned)),
    },
  };
}
