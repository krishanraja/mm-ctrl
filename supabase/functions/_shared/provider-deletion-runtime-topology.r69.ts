export const PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA = "ctrl.provider-deletion-runtime-topology.r69" as const;

export type ProviderDeletionRuntimeCellKind = "authority_issuer" | "crypto_writer" | "deletion_worker";
export type ProviderDeletionRuntimeOperation = "issue_authority" | "register" | "lease" | "destroy" | "provider_delete";

export interface ProviderDeletionRuntimeCell {
  kind: ProviderDeletionRuntimeCellKind;
  deployment_boundary_id: string;
  secret_domain_id: string;
  operations: ProviderDeletionRuntimeOperation[];
  authority_signing_key_ref: string | null;
  database_credential_ref: string | null;
  encrypt_capability_ref: string | null;
  decrypt_capability_ref: string | null;
  provider_deletion_credential_ref: string | null;
}

export interface ProviderDeletionRuntimeTopologyInput {
  schema_version: typeof PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA;
  topology_id: string;
  cells: ProviderDeletionRuntimeCell[];
}

export interface CompiledProviderDeletionRuntimeTopology {
  schema_version: typeof PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA;
  topology_id: string;
  cells: ProviderDeletionRuntimeCell[];
  topology_sha256: string;
}

export type ProviderDeletionRuntimeTopologyResult =
  | { status: "accepted"; topology: CompiledProviderDeletionRuntimeTopology }
  | { status: "held"; reasons: string[] };

const ID = /^[a-z0-9][a-z0-9._/-]{2,127}$/;
const SECRET_REF = /^[A-Z][A-Z0-9_]{7,127}$/;
const FORBIDDEN_GENERIC_CREDENTIALS = new Set([
  "SUPABASE_DB_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SECRET_KEYS",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
]);
const EXPECTED_OPERATIONS: Record<ProviderDeletionRuntimeCellKind, ProviderDeletionRuntimeOperation[]> = {
  authority_issuer: ["issue_authority"],
  crypto_writer: ["register"],
  deletion_worker: ["destroy", "lease", "provider_delete"],
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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`provider-deletion-runtime-topology-r69\n${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameMembers(left: string[], right: string[]): boolean {
  return [...new Set(left)].sort().join("|") === [...new Set(right)].sort().join("|") && left.length === right.length;
}

function validateReference(value: string | null, field: string, reasons: string[]): void {
  if (value === null) return;
  if (!SECRET_REF.test(value)) reasons.push(`${field}_invalid`);
  if (FORBIDDEN_GENERIC_CREDENTIALS.has(value)) reasons.push("generic_privileged_credential_forbidden");
}

function exactCellKeys(cell: ProviderDeletionRuntimeCell): boolean {
  return Object.keys(cell).sort().join("|") === [
    "authority_signing_key_ref",
    "database_credential_ref",
    "decrypt_capability_ref",
    "deployment_boundary_id",
    "encrypt_capability_ref",
    "kind",
    "operations",
    "provider_deletion_credential_ref",
    "secret_domain_id",
  ].join("|");
}

export async function compileProviderDeletionRuntimeTopology(
  input: ProviderDeletionRuntimeTopologyInput,
): Promise<ProviderDeletionRuntimeTopologyResult> {
  const reasons: string[] = [];
  if (!input || typeof input !== "object" || Object.keys(input).sort().join("|") !== "cells|schema_version|topology_id") {
    return { status: "held", reasons: ["topology_shape_invalid"] };
  }
  if (input.schema_version !== PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA) reasons.push("topology_schema_invalid");
  if (!ID.test(input.topology_id)) reasons.push("topology_id_invalid");
  if (!Array.isArray(input.cells) || input.cells.length !== 3) reasons.push("topology_cells_invalid");
  if (reasons.length > 0) return { status: "held", reasons: [...new Set(reasons)].sort() };

  const byKind = new Map<ProviderDeletionRuntimeCellKind, ProviderDeletionRuntimeCell>();
  const deploymentBoundaries = new Set<string>();
  const secretDomains = new Set<string>();
  const nonNullSecretRefs = new Set<string>();
  for (const cell of input.cells) {
    if (!cell || typeof cell !== "object" || !exactCellKeys(cell)) {
      reasons.push("runtime_cell_shape_invalid");
      continue;
    }
    if (!new Set<ProviderDeletionRuntimeCellKind>(["authority_issuer", "crypto_writer", "deletion_worker"]).has(cell.kind)) {
      reasons.push("runtime_cell_kind_invalid");
      continue;
    }
    if (byKind.has(cell.kind)) reasons.push("runtime_cell_duplicate");
    byKind.set(cell.kind, cell);
    if (!ID.test(cell.deployment_boundary_id)) reasons.push("deployment_boundary_invalid");
    if (!ID.test(cell.secret_domain_id)) reasons.push("secret_domain_invalid");
    if (deploymentBoundaries.has(cell.deployment_boundary_id)) reasons.push("deployment_boundary_not_isolated");
    if (secretDomains.has(cell.secret_domain_id)) reasons.push("secret_domain_not_isolated");
    deploymentBoundaries.add(cell.deployment_boundary_id);
    secretDomains.add(cell.secret_domain_id);
    if (!sameMembers(cell.operations, EXPECTED_OPERATIONS[cell.kind])) reasons.push(`${cell.kind}_operations_invalid`);

    const references = [
      [cell.authority_signing_key_ref, "authority_signing_key_ref"],
      [cell.database_credential_ref, "database_credential_ref"],
      [cell.encrypt_capability_ref, "encrypt_capability_ref"],
      [cell.decrypt_capability_ref, "decrypt_capability_ref"],
      [cell.provider_deletion_credential_ref, "provider_deletion_credential_ref"],
    ] as const;
    for (const [reference, field] of references) {
      validateReference(reference, field, reasons);
      if (reference !== null) {
        if (nonNullSecretRefs.has(reference)) reasons.push("secret_reference_reused_across_cells");
        nonNullSecretRefs.add(reference);
      }
    }
  }

  for (const kind of ["authority_issuer", "crypto_writer", "deletion_worker"] as const) {
    if (!byKind.has(kind)) reasons.push(`runtime_cell_${kind}_missing`);
  }
  const issuer = byKind.get("authority_issuer");
  const writer = byKind.get("crypto_writer");
  const worker = byKind.get("deletion_worker");
  if (issuer && (
    issuer.authority_signing_key_ref === null || issuer.database_credential_ref !== null ||
    issuer.encrypt_capability_ref !== null || issuer.decrypt_capability_ref !== null ||
    issuer.provider_deletion_credential_ref !== null
  )) reasons.push("authority_issuer_secret_boundary_invalid");
  if (writer && (
    writer.authority_signing_key_ref !== null || writer.database_credential_ref === null ||
    writer.encrypt_capability_ref === null || writer.decrypt_capability_ref !== null ||
    writer.provider_deletion_credential_ref !== null
  )) reasons.push("crypto_writer_secret_boundary_invalid");
  if (worker && (
    worker.authority_signing_key_ref !== null || worker.database_credential_ref === null ||
    worker.encrypt_capability_ref !== null || worker.decrypt_capability_ref === null ||
    worker.provider_deletion_credential_ref === null
  )) reasons.push("deletion_worker_secret_boundary_invalid");

  const uniqueReasons = [...new Set(reasons)].sort();
  if (uniqueReasons.length > 0) return { status: "held", reasons: uniqueReasons };
  const cells = [...input.cells]
    .map((cell) => ({ ...cell, operations: [...cell.operations].sort() as ProviderDeletionRuntimeOperation[] }))
    .sort((left, right) => left.kind.localeCompare(right.kind));
  const unsigned = { schema_version: input.schema_version, topology_id: input.topology_id, cells };
  return {
    status: "accepted",
    topology: { ...unsigned, topology_sha256: await sha256(canonicalJson(unsigned)) },
  };
}

