import type { PreparedAudience, PreparedPurpose } from "./prepared-intelligence.r1";

export type CanonicalBrainAudience = "person_private" | "delivery_team_private";
export type PreparedAuthorityKind =
  | "brain_item_version"
  | "decision_case_snapshot"
  | "decision_claim_snapshot"
  | "external_source_receipt";

export interface PresentationReceiptScope {
  workspace_id: string;
  owner_id: string;
  subject_id: string;
  audience: PreparedAudience;
  purpose: PreparedPurpose;
}

export interface CanonicalReceiptScope {
  workspace_id: string;
  owner_id: string;
  subject_id: string;
  audience: CanonicalBrainAudience;
  purpose: PreparedPurpose;
}

export interface AuthorityReference extends CanonicalReceiptScope {
  authority_kind: PreparedAuthorityKind;
  authority_record_id: string;
  authority_version: string;
  authority_sha256: string;
  observed_at: string;
}

export interface AuthorityEnvelopeInput {
  receipt_id: string;
  scope: PresentationReceiptScope;
  dependencies: AuthorityReference[];
  current_authority: AuthorityReference[];
}

export interface PreparedAuthorityEnvelope extends CanonicalReceiptScope {
  schema_version: "ctrl.prepared-intelligence-authority-envelope.r7";
  receipt_id: string;
  dependencies: AuthorityReference[];
  authority_fingerprint: string;
}

export type AuthorityEnvelopeResult =
  | { status: "accepted"; envelope: PreparedAuthorityEnvelope }
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

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function canonicalAudience(audience: PreparedAudience): CanonicalBrainAudience | null {
  if (audience === "customer_private") return "person_private";
  if (audience === "operator_private") return "delivery_team_private";
  return null;
}

function dependencyKey(reference: Pick<AuthorityReference, "authority_kind" | "authority_record_id">): string {
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
  const bytes = new TextEncoder().encode(`prepared-authority-envelope-r7\n${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateCanonicalScope(reference: AuthorityReference, scope: CanonicalReceiptScope): string[] {
  const reasons: string[] = [];
  if (reference.workspace_id !== scope.workspace_id) reasons.push("dependency_workspace_mismatch");
  if (reference.owner_id !== scope.owner_id) reasons.push("dependency_owner_mismatch");
  if (reference.subject_id !== scope.subject_id) reasons.push("dependency_subject_mismatch");
  if (reference.audience !== scope.audience) reasons.push("dependency_audience_mismatch");
  if (reference.purpose !== scope.purpose) reasons.push("dependency_purpose_mismatch");
  return reasons;
}

function validateReference(reference: AuthorityReference): string[] {
  const reasons: string[] = [];
  if (!AUTHORITY_KINDS.has(reference.authority_kind)) reasons.push("dependency_kind_invalid");
  if (!UUID.test(reference.workspace_id) || !UUID.test(reference.owner_id) || !UUID.test(reference.subject_id) || !UUID.test(reference.authority_record_id)) {
    reasons.push("dependency_identity_invalid");
  }
  if (!VERSION.test(reference.authority_version)) reasons.push("dependency_version_invalid");
  if (!SHA256.test(reference.authority_sha256)) reasons.push("dependency_fingerprint_invalid");
  if (!validInstant(reference.observed_at)) reasons.push("dependency_observed_at_invalid");
  if (!new Set<CanonicalBrainAudience>(["person_private", "delivery_team_private"]).has(reference.audience)) reasons.push("dependency_audience_invalid");
  if (reference.purpose !== "prepared_intelligence") reasons.push("dependency_purpose_invalid");
  return reasons;
}

export async function buildPreparedAuthorityEnvelope(input: AuthorityEnvelopeInput): Promise<AuthorityEnvelopeResult> {
  const reasons: string[] = [];
  const mappedAudience = canonicalAudience(input.scope.audience);
  if (!UUID.test(input.receipt_id)) reasons.push("receipt_identity_invalid");
  if (!UUID.test(input.scope.workspace_id) || !UUID.test(input.scope.owner_id) || !UUID.test(input.scope.subject_id)) reasons.push("scope_identity_invalid");
  if (!mappedAudience) reasons.push("scope_audience_invalid");
  if (input.scope.purpose !== "prepared_intelligence") reasons.push("scope_purpose_invalid");
  if (!Array.isArray(input.dependencies) || input.dependencies.length === 0) reasons.push("dependencies_required");
  if (!Array.isArray(input.current_authority) || input.current_authority.length === 0) reasons.push("current_authority_required");
  if (reasons.length > 0 || !mappedAudience) return { status: "held", reasons: uniqueSorted(reasons) };

  const canonicalScope: CanonicalReceiptScope = {
    workspace_id: input.scope.workspace_id,
    owner_id: input.scope.owner_id,
    subject_id: input.scope.subject_id,
    audience: mappedAudience,
    purpose: input.scope.purpose,
  };
  const dependencyKeys = new Set<string>();
  const currentByKey = new Map<string, AuthorityReference>();

  for (const current of input.current_authority) {
    reasons.push(...validateReference(current), ...validateCanonicalScope(current, canonicalScope));
    const key = dependencyKey(current);
    if (currentByKey.has(key)) reasons.push("current_authority_duplicate");
    currentByKey.set(key, current);
  }

  for (const dependency of input.dependencies) {
    reasons.push(...validateReference(dependency), ...validateCanonicalScope(dependency, canonicalScope));
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
    schema_version: "ctrl.prepared-intelligence-authority-envelope.r7" as const,
    receipt_id: input.receipt_id,
    ...canonicalScope,
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
