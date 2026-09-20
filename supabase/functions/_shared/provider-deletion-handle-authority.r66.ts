export const PROVIDER_HANDLE_AUTHORITY_SCHEMA = "ctrl.provider-deletion-handle-authority.r66" as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const MAX_AUTHORITY_LIFETIME_MS = 5 * 60 * 1_000;

export type ProviderHandleAuthorityKeyring = Readonly<Record<string, string>>;
export type ProviderHandleAuthorityRole = "provider_handle_crypto_writer" | "provider_deletion_worker";
export type ProviderHandleAuthorityOperation = "register" | "lease" | "destroy";
export type ProviderHandleAuthorityProvider = "elevenlabs" | "stripe";
export type ProviderHandleDestructionReason = "exchange_expired" | "operational_deletion_succeeded" | "account_closure_succeeded";

interface ProviderHandleAuthorityBase {
  schema_version: typeof PROVIDER_HANDLE_AUTHORITY_SCHEMA;
  authority_id: string;
  workspace_id: string;
  receipt_id: string;
  handle_id: string;
  provider: ProviderHandleAuthorityProvider;
  actor_id: string;
  job_id: string;
  issued_at: string;
  expires_at: string;
}

export interface RegisterProviderHandleAuthority extends ProviderHandleAuthorityBase {
  role: "provider_handle_crypto_writer";
  operation: "register";
  cipher_envelope_sha256: string;
}

export interface LeaseProviderHandleAuthority extends ProviderHandleAuthorityBase {
  role: "provider_deletion_worker";
  operation: "lease";
  lease_seconds: number;
}

export interface DestroyProviderHandleAuthority extends ProviderHandleAuthorityBase {
  role: "provider_deletion_worker";
  operation: "destroy";
  destruction_reason: ProviderHandleDestructionReason;
  success_fact_id: string | null;
}

export type ProviderHandleAuthority =
  | RegisterProviderHandleAuthority
  | LeaseProviderHandleAuthority
  | DestroyProviderHandleAuthority;

export type ProviderHandleAuthorityRequest =
  | Omit<RegisterProviderHandleAuthority, "schema_version" | "role">
  | Omit<LeaseProviderHandleAuthority, "schema_version" | "role">
  | Omit<DestroyProviderHandleAuthority, "schema_version" | "role">;

export interface ProviderHandleAuthorityTokenV1 {
  v: 1;
  alg: "HS256";
  kid: string;
  authority: ProviderHandleAuthority;
  signature: string;
}

export interface ExpectedProviderHandleAuthority {
  operation: ProviderHandleAuthorityOperation;
  workspace_id: string;
  receipt_id: string;
  handle_id: string;
  provider: ProviderHandleAuthorityProvider;
  job_id: string;
}

export type ProviderHandleAuthorityVerification =
  | { status: "accepted"; authority: ProviderHandleAuthority }
  | { status: "held"; reasons: string[] };

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

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(encoded: string): Uint8Array | null {
  if (!encoded || !BASE64.test(encoded)) return null;
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importHmacKey(keyring: ProviderHandleAuthorityKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) throw new Error("authority_key_id_invalid");
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string") throw new Error("authority_key_unavailable");
  const bytes = base64ToBytes(encoded);
  if (!bytes || bytes.byteLength < 32) throw new Error("authority_key_invalid");
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function roleForOperation(operation: ProviderHandleAuthorityOperation): ProviderHandleAuthorityRole {
  return operation === "register" ? "provider_handle_crypto_writer" : "provider_deletion_worker";
}

function validateAuthority(authority: ProviderHandleAuthority): string[] {
  const reasons: string[] = [];
  for (const identity of [authority.authority_id, authority.workspace_id, authority.receipt_id, authority.handle_id, authority.actor_id, authority.job_id]) {
    if (!UUID.test(identity)) reasons.push("authority_identity_invalid");
  }
  if (!new Set<ProviderHandleAuthorityProvider>(["elevenlabs", "stripe"]).has(authority.provider)) reasons.push("authority_provider_invalid");
  if (authority.role !== roleForOperation(authority.operation)) reasons.push("authority_role_operation_mismatch");
  if (!validInstant(authority.issued_at) || !validInstant(authority.expires_at)) {
    reasons.push("authority_time_invalid");
  } else {
    const lifetime = Date.parse(authority.expires_at) - Date.parse(authority.issued_at);
    if (lifetime <= 0 || lifetime > MAX_AUTHORITY_LIFETIME_MS) reasons.push("authority_lifetime_invalid");
  }

  if (authority.operation === "register") {
    if (!SHA256.test(authority.cipher_envelope_sha256)) reasons.push("authority_cipher_digest_invalid");
  } else if (authority.operation === "lease") {
    if (!Number.isInteger(authority.lease_seconds) || authority.lease_seconds < 1 || authority.lease_seconds > 300) {
      reasons.push("authority_lease_invalid");
    }
  } else {
    if (authority.destruction_reason === "exchange_expired") {
      if (authority.provider !== "elevenlabs" || authority.success_fact_id !== null) reasons.push("authority_destruction_evidence_invalid");
    } else if (authority.destruction_reason === "operational_deletion_succeeded") {
      if (!authority.success_fact_id || !UUID.test(authority.success_fact_id)) reasons.push("authority_destruction_evidence_invalid");
    } else if (authority.destruction_reason === "account_closure_succeeded") {
      if (authority.provider !== "stripe" || !authority.success_fact_id || !UUID.test(authority.success_fact_id)) {
        reasons.push("authority_destruction_evidence_invalid");
      }
    } else {
      reasons.push("authority_destruction_reason_invalid");
    }
  }
  return [...new Set(reasons)].sort();
}

function exactAuthorityKeys(authority: ProviderHandleAuthority): boolean {
  const base = [
    "actor_id", "authority_id", "expires_at", "handle_id", "issued_at", "job_id", "operation",
    "provider", "receipt_id", "role", "schema_version", "workspace_id",
  ];
  const operation = authority.operation === "register"
    ? ["cipher_envelope_sha256"]
    : authority.operation === "lease"
      ? ["lease_seconds"]
      : ["destruction_reason", "success_fact_id"];
  return Object.keys(authority).sort().join("|") === [...base, ...operation].sort().join("|");
}

function buildAuthority(request: ProviderHandleAuthorityRequest): ProviderHandleAuthority {
  const common = {
    ...request,
    schema_version: PROVIDER_HANDLE_AUTHORITY_SCHEMA,
    role: roleForOperation(request.operation),
  };
  return common as ProviderHandleAuthority;
}

function unsignedToken(keyId: string, authority: ProviderHandleAuthority): Omit<ProviderHandleAuthorityTokenV1, "signature"> {
  return { v: 1, alg: "HS256", kid: keyId, authority };
}

export async function issueProviderHandleAuthority(args: {
  request: ProviderHandleAuthorityRequest;
  keyring: ProviderHandleAuthorityKeyring;
  activeKeyId: string;
}): Promise<string> {
  const authority = buildAuthority(args.request);
  const reasons = validateAuthority(authority);
  if (!exactAuthorityKeys(authority)) reasons.push("authority_payload_malformed");
  if (reasons.length > 0) throw new Error(reasons.join(","));
  const key = await importHmacKey(args.keyring, args.activeKeyId);
  const unsigned = unsignedToken(args.activeKeyId, authority);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonicalJson(unsigned)));
  return canonicalJson({ ...unsigned, signature: bytesToBase64Url(new Uint8Array(signature)) });
}

export async function verifyProviderHandleAuthority(args: {
  token: string;
  keyring: ProviderHandleAuthorityKeyring;
  expected: ExpectedProviderHandleAuthority;
  now: string;
}): Promise<ProviderHandleAuthorityVerification> {
  const reasons: string[] = [];
  let token: ProviderHandleAuthorityTokenV1;
  try {
    token = JSON.parse(args.token) as ProviderHandleAuthorityTokenV1;
  } catch {
    return { status: "held", reasons: ["authority_token_malformed"] };
  }
  if (!token || typeof token !== "object" || Object.keys(token).sort().join("|") !== "alg|authority|kid|signature|v") {
    return { status: "held", reasons: ["authority_token_malformed"] };
  }
  if (token.v !== 1 || token.alg !== "HS256" || typeof token.kid !== "string" || typeof token.signature !== "string") {
    reasons.push("authority_token_unsupported");
  }
  if (!token.authority || typeof token.authority !== "object" || !exactAuthorityKeys(token.authority)) {
    reasons.push("authority_payload_malformed");
  } else {
    if (token.authority.schema_version !== PROVIDER_HANDLE_AUTHORITY_SCHEMA) reasons.push("authority_schema_invalid");
    reasons.push(...validateAuthority(token.authority));
    if (token.authority.operation !== args.expected.operation) reasons.push("authority_operation_mismatch");
    if (token.authority.workspace_id !== args.expected.workspace_id) reasons.push("authority_workspace_mismatch");
    if (token.authority.receipt_id !== args.expected.receipt_id) reasons.push("authority_receipt_mismatch");
    if (token.authority.handle_id !== args.expected.handle_id) reasons.push("authority_handle_mismatch");
    if (token.authority.provider !== args.expected.provider) reasons.push("authority_provider_mismatch");
    if (token.authority.job_id !== args.expected.job_id) reasons.push("authority_job_mismatch");
    if (!validInstant(args.now)) reasons.push("authority_verification_time_invalid");
    else if (validInstant(token.authority.issued_at) && validInstant(token.authority.expires_at)) {
      const now = Date.parse(args.now);
      if (now < Date.parse(token.authority.issued_at)) reasons.push("authority_not_yet_valid");
      if (now >= Date.parse(token.authority.expires_at)) reasons.push("authority_expired");
    }
  }

  try {
    const key = await importHmacKey(args.keyring, token.kid);
    const signature = base64ToBytes(token.signature);
    if (!signature || !(await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(canonicalJson(unsignedToken(token.kid, token.authority))),
    ))) reasons.push("authority_signature_invalid");
  } catch {
    reasons.push("authority_key_unavailable");
  }

  const uniqueReasons = [...new Set(reasons)].sort();
  return uniqueReasons.length > 0
    ? { status: "held", reasons: uniqueReasons }
    : { status: "accepted", authority: token.authority };
}
