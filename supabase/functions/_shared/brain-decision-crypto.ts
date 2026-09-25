/**
 * Exact application-side AES-256-GCM contract for the consequential-decision
 * spine. The canonical context is byte-for-byte compatible with
 * private.brain_decision_cipher_aad_sha256 in migration 20260921100000.
 */

export const BRAIN_DECISION_CIPHER_VERSION = 1 as const;
export const BRAIN_DECISION_CIPHER_ALGORITHM = "A256GCM" as const;
export const BRAIN_DECISION_CIPHER_CONTEXT_VERSION = "ctrl.brain-decision-cipher-context.r142" as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const SHA256 = /^[0-9a-f]{64}$/;

const RECORD_FIELDS = {
  subject_profile: new Set(["display_name", "role", "organisation", "brain_name", "primary_aim"]),
  decision_version: new Set(["title", "stakes", "provisional_view", "analysis"]),
  decision_route: new Set(["tab_label", "content"]),
  decision_human_prior: new Set(["position", "rationale"]),
  decision_question: new Set(["prompt", "guidance", "choices"]),
  decision_answer: new Set(["answer"]),
  decision_source: new Set(["content"]),
  decision_assertion: new Set(["statement"]),
  decision_candidate: new Set(["claim"]),
  decision_call: new Set(["call", "conditions"]),
  decision_outcome: new Set(["result"]),
  decision_authority_revocation: new Set(["reason"]),
} as const;

export type BrainDecisionRecordKind = keyof typeof RECORD_FIELDS;
export type BrainDecisionCipherField =
  | "display_name" | "role" | "organisation" | "brain_name" | "primary_aim"
  | "title" | "stakes" | "provisional_view" | "analysis"
  | "tab_label" | "content" | "position" | "rationale"
  | "prompt" | "guidance" | "choices" | "answer"
  | "content" | "statement" | "claim"
  | "call" | "conditions" | "result" | "reason";

export interface BrainDecisionCipherContext {
  workspaceId: string;
  subjectId: string;
  recordId: string;
  recordKind: BrainDecisionRecordKind;
  field: BrainDecisionCipherField;
}

export type BrainDecisionKeyring = Readonly<Record<string, string>>;

export interface BrainDecisionCipherEnvelopeV1 {
  v: typeof BRAIN_DECISION_CIPHER_VERSION;
  alg: typeof BRAIN_DECISION_CIPHER_ALGORITHM;
  kid: string;
  iv: string;
  ciphertext: string;
  aad_sha256: string;
}

export class BrainDecisionCryptoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainDecisionCryptoConfigurationError";
  }
}

export class BrainDecisionCiphertextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainDecisionCiphertextError";
  }
}

export function parseBrainDecisionKeyring(serialized: string): BrainDecisionKeyring {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new BrainDecisionCryptoConfigurationError("Decision keyring is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BrainDecisionCryptoConfigurationError("Decision keyring must be an object.");
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 8) {
    throw new BrainDecisionCryptoConfigurationError("Decision keyring must contain between one and eight keys.");
  }
  const keyring: Record<string, string> = {};
  for (const [keyId, encoded] of entries) {
    if (!KEY_ID.test(keyId) || typeof encoded !== "string") {
      throw new BrainDecisionCryptoConfigurationError("Decision keyring contains an invalid entry.");
    }
    if (base64ToBytes(encoded, `Decision encryption key '${keyId}'`).byteLength !== 32) {
      throw new BrainDecisionCryptoConfigurationError(`Decision encryption key '${keyId}' must decode to exactly 32 bytes.`);
    }
    keyring[keyId] = encoded;
  }
  return Object.freeze(keyring);
}

export async function brainDecisionRequestFingerprint(args: {
  integrityKey: string;
  material: string;
}): Promise<string> {
  const keyBytes = base64ToBytes(args.integrityKey, "Decision integrity key");
  if (keyBytes.byteLength !== 32) {
    throw new BrainDecisionCryptoConfigurationError("Decision integrity key must decode to exactly 32 bytes.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(args.material));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertContext(context: BrainDecisionCipherContext): void {
  if (!UUID.test(context.workspaceId)) throw new BrainDecisionCryptoConfigurationError("Decision workspace ID is invalid.");
  if (!UUID.test(context.subjectId)) throw new BrainDecisionCryptoConfigurationError("Decision subject ID is invalid.");
  if (!UUID.test(context.recordId)) throw new BrainDecisionCryptoConfigurationError("Decision record ID is invalid.");
  const fields = RECORD_FIELDS[context.recordKind];
  if (!fields || !(fields as ReadonlySet<string>).has(context.field)) {
    throw new BrainDecisionCryptoConfigurationError("Decision record kind and encrypted field do not match.");
  }
}

export function canonicalBrainDecisionCipherContext(context: BrainDecisionCipherContext): string {
  assertContext(context);
  return JSON.stringify({
    v: BRAIN_DECISION_CIPHER_VERSION,
    schema_version: BRAIN_DECISION_CIPHER_CONTEXT_VERSION,
    workspace_id: context.workspaceId.toLowerCase(),
    subject_id: context.subjectId.toLowerCase(),
    record_kind: context.recordKind,
    record_id: context.recordId.toLowerCase(),
    field: context.field,
  });
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function brainDecisionCipherAadSha256(context: BrainDecisionCipherContext): Promise<string> {
  return sha256Hex(new TextEncoder().encode(canonicalBrainDecisionCipherContext(context)));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(encoded: string, label: string): Uint8Array {
  if (!encoded || !BASE64.test(encoded)) {
    throw new BrainDecisionCryptoConfigurationError(`${label} must be base64 or base64url.`);
  }
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new BrainDecisionCryptoConfigurationError(`${label} must be valid base64 or base64url.`);
  }
}

async function importKey(keyring: BrainDecisionKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) throw new BrainDecisionCryptoConfigurationError("Decision encryption key ID is invalid.");
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string" || !encoded) {
    throw new BrainDecisionCryptoConfigurationError(`Decision encryption key '${keyId}' is unavailable.`);
  }
  const bytes = base64ToBytes(encoded, `Decision encryption key '${keyId}'`);
  if (bytes.byteLength !== 32) {
    throw new BrainDecisionCryptoConfigurationError(`Decision encryption key '${keyId}' must decode to exactly 32 bytes.`);
  }
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function parseEnvelope(serialized: string): BrainDecisionCipherEnvelopeV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new BrainDecisionCiphertextError("Decision ciphertext envelope is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BrainDecisionCiphertextError("Decision ciphertext envelope is malformed.");
  }
  const candidate = parsed as Partial<BrainDecisionCipherEnvelopeV1>;
  const keys = Object.keys(candidate);
  if (
    keys.length !== 6 ||
    !["v", "alg", "kid", "iv", "ciphertext", "aad_sha256"].every((key) => Object.hasOwn(candidate, key)) ||
    candidate.v !== BRAIN_DECISION_CIPHER_VERSION ||
    candidate.alg !== BRAIN_DECISION_CIPHER_ALGORITHM ||
    typeof candidate.kid !== "string" || !KEY_ID.test(candidate.kid) ||
    typeof candidate.iv !== "string" || !/^[A-Za-z0-9+/_-]{16}$/.test(candidate.iv) ||
    typeof candidate.ciphertext !== "string" || !/^[A-Za-z0-9+/_-]{22,}={0,2}$/.test(candidate.ciphertext) ||
    typeof candidate.aad_sha256 !== "string" || !SHA256.test(candidate.aad_sha256)
  ) {
    throw new BrainDecisionCiphertextError("Decision ciphertext envelope is malformed or unsupported.");
  }
  return candidate as BrainDecisionCipherEnvelopeV1;
}

export async function encryptBrainDecisionField(args: {
  plaintext: string;
  context: BrainDecisionCipherContext;
  keyring: BrainDecisionKeyring;
  activeKeyId: string;
}): Promise<string> {
  const contextBytes = new TextEncoder().encode(canonicalBrainDecisionCipherContext(args.context));
  const key = await importKey(args.keyring, args.activeKeyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
    key,
    new TextEncoder().encode(args.plaintext),
  );
  return JSON.stringify({
    v: BRAIN_DECISION_CIPHER_VERSION,
    alg: BRAIN_DECISION_CIPHER_ALGORITHM,
    kid: args.activeKeyId,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted)),
    aad_sha256: await sha256Hex(contextBytes),
  } satisfies BrainDecisionCipherEnvelopeV1);
}

export async function decryptBrainDecisionField(args: {
  envelope: string;
  context: BrainDecisionCipherContext;
  keyring: BrainDecisionKeyring;
}): Promise<string> {
  const parsed = parseEnvelope(args.envelope);
  const contextBytes = new TextEncoder().encode(canonicalBrainDecisionCipherContext(args.context));
  if (parsed.aad_sha256 !== await sha256Hex(contextBytes)) {
    throw new BrainDecisionCiphertextError("Decision ciphertext context does not match this record.");
  }
  const key = await importKey(args.keyring, parsed.kid);
  const iv = base64ToBytes(parsed.iv, "Decision ciphertext IV");
  if (iv.byteLength !== 12) throw new BrainDecisionCiphertextError("Decision ciphertext IV must be exactly 12 bytes.");
  const ciphertext = base64ToBytes(parsed.ciphertext, "Decision ciphertext");
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new BrainDecisionCiphertextError("Decision ciphertext authentication failed.");
  }
}
