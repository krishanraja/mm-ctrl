import type { CompiledProviderDeletionRuntimeTopology } from "./provider-deletion-runtime-topology.r69";

export const PROVIDER_DELETION_PERSISTENCE_AUTHORITY_SCHEMA = "ctrl.provider-deletion-persistence-authority.r72" as const;

export type ProviderDeletionPersistencePrincipal = "authority_issuer" | "crypto_writer" | "deletion_worker" | "operator";
export type ProviderDeletionPersistenceFunction =
  | "record_dispatch"
  | "append_issuer_event"
  | "verified_register_handle"
  | "verified_lease_handle"
  | "verified_destroy_handle"
  | "append_target_event"
  | "append_operator_recovery_event";

export interface ProviderDeletionPersistenceGrant {
  principal: ProviderDeletionPersistencePrincipal;
  auth_mode: "custom_database_login" | "human_session";
  credential_ref: string | null;
  functions: ProviderDeletionPersistenceFunction[];
}

export interface ProviderDeletionPersistenceAuthorityInput {
  schema_version: typeof PROVIDER_DELETION_PERSISTENCE_AUTHORITY_SCHEMA;
  topology_sha256: string;
  grants: ProviderDeletionPersistenceGrant[];
}

export interface CompiledProviderDeletionPersistenceAuthority extends ProviderDeletionPersistenceAuthorityInput {
  authority_sha256: string;
}

export type ProviderDeletionPersistenceAuthorityResult =
  | { status: "accepted"; authority: CompiledProviderDeletionPersistenceAuthority }
  | { status: "held"; reasons: string[] };

const SHA256 = /^[0-9a-f]{64}$/;
const SECRET_REF = /^[A-Z][A-Z0-9_]{7,127}$/;
const FORBIDDEN_GENERIC_CREDENTIALS = new Set([
  "SUPABASE_DB_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL",
]);
const REQUIRED_FUNCTIONS: Record<ProviderDeletionPersistencePrincipal, ProviderDeletionPersistenceFunction[]> = {
  authority_issuer: ["append_issuer_event", "record_dispatch"],
  crypto_writer: ["append_target_event", "verified_register_handle"],
  deletion_worker: ["append_target_event", "verified_destroy_handle", "verified_lease_handle"],
  operator: ["append_operator_recovery_event"],
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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`provider-deletion-persistence-authority-r72\n${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function exactGrantKeys(grant: ProviderDeletionPersistenceGrant): boolean {
  return Object.keys(grant).sort().join("|") === "auth_mode|credential_ref|functions|principal";
}

function sameFunctions(left: ProviderDeletionPersistenceFunction[], right: ProviderDeletionPersistenceFunction[]): boolean {
  return left.length === right.length && [...new Set(left)].sort().join("|") === [...right].sort().join("|");
}

export async function compileProviderDeletionPersistenceAuthority(args: {
  topology: CompiledProviderDeletionRuntimeTopology;
  input: ProviderDeletionPersistenceAuthorityInput;
}): Promise<ProviderDeletionPersistenceAuthorityResult> {
  const reasons: string[] = [];
  const { input, topology } = args;
  if (!input || typeof input !== "object" || Object.keys(input).sort().join("|") !== "grants|schema_version|topology_sha256") {
    return { status: "held", reasons: ["persistence_authority_shape_invalid"] };
  }
  if (input.schema_version !== PROVIDER_DELETION_PERSISTENCE_AUTHORITY_SCHEMA) reasons.push("persistence_authority_schema_invalid");
  if (!SHA256.test(input.topology_sha256) || input.topology_sha256 !== topology.topology_sha256) reasons.push("persistence_topology_mismatch");
  if (!Array.isArray(input.grants) || input.grants.length !== 4) reasons.push("persistence_grants_invalid");
  if (reasons.length > 0) return { status: "held", reasons: [...new Set(reasons)].sort() };

  const byPrincipal = new Map<ProviderDeletionPersistencePrincipal, ProviderDeletionPersistenceGrant>();
  const credentialRefs = new Set<string>();
  const topologyByKind = new Map(topology.cells.map((cell) => [cell.kind, cell]));
  for (const grant of input.grants) {
    if (!grant || typeof grant !== "object" || !exactGrantKeys(grant)) {
      reasons.push("persistence_grant_shape_invalid");
      continue;
    }
    if (!new Set<ProviderDeletionPersistencePrincipal>(["authority_issuer", "crypto_writer", "deletion_worker", "operator"]).has(grant.principal)) {
      reasons.push("persistence_principal_invalid");
      continue;
    }
    if (byPrincipal.has(grant.principal)) reasons.push("persistence_principal_duplicate");
    byPrincipal.set(grant.principal, grant);
    if (!sameFunctions(grant.functions, REQUIRED_FUNCTIONS[grant.principal])) reasons.push(`${grant.principal}_persistence_functions_invalid`);

    if (grant.principal === "operator") {
      if (grant.auth_mode !== "human_session" || grant.credential_ref !== null) reasons.push("operator_persistence_identity_invalid");
    } else {
      if (grant.auth_mode !== "custom_database_login" || grant.credential_ref === null) reasons.push(`${grant.principal}_persistence_identity_invalid`);
      if (grant.credential_ref !== null) {
        if (!SECRET_REF.test(grant.credential_ref)) reasons.push("persistence_credential_ref_invalid");
        if (FORBIDDEN_GENERIC_CREDENTIALS.has(grant.credential_ref)) reasons.push("generic_privileged_credential_forbidden");
        if (credentialRefs.has(grant.credential_ref)) reasons.push("persistence_credential_reused");
        credentialRefs.add(grant.credential_ref);
      }
    }
  }

  for (const principal of ["authority_issuer", "crypto_writer", "deletion_worker", "operator"] as const) {
    if (!byPrincipal.has(principal)) reasons.push(`persistence_principal_${principal}_missing`);
  }
  const issuer = byPrincipal.get("authority_issuer");
  const writer = byPrincipal.get("crypto_writer");
  const worker = byPrincipal.get("deletion_worker");
  if (issuer?.credential_ref === topologyByKind.get("authority_issuer")?.database_credential_ref) {
    reasons.push("issuer_dispatch_credential_not_distinct");
  }
  if (writer?.credential_ref !== topologyByKind.get("crypto_writer")?.database_credential_ref) {
    reasons.push("writer_credential_topology_mismatch");
  }
  if (worker?.credential_ref !== topologyByKind.get("deletion_worker")?.database_credential_ref) {
    reasons.push("worker_credential_topology_mismatch");
  }

  const uniqueReasons = [...new Set(reasons)].sort();
  if (uniqueReasons.length > 0) return { status: "held", reasons: uniqueReasons };
  const grants = input.grants
    .map((grant) => ({ ...grant, functions: [...grant.functions].sort() as ProviderDeletionPersistenceFunction[] }))
    .sort((left, right) => left.principal.localeCompare(right.principal));
  const unsigned = { schema_version: input.schema_version, topology_sha256: input.topology_sha256, grants };
  return { status: "accepted", authority: { ...unsigned, authority_sha256: await sha256(canonicalJson(unsigned)) } };
}

