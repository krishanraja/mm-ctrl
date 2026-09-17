import {
  BrainCiphertextError,
  BrainCryptoConfigurationError,
  type BrainKeyring,
  type PreparedReceiptAudience,
} from "./brain-crypto";

export const PREPARED_CUSTODY_CIPHER_VERSION = 2 as const;
export const PREPARED_CUSTODY_CIPHER_ALGORITHM = "A256GCM" as const;
export const PREPARED_CUSTODY_CONTEXT_VERSION = "ctrl.brain-prepared-custody-cipher-context.r26" as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const CONTEXT_KEYS = new Set([
  "workspaceId",
  "custodyPrincipalId",
  "subjectId",
  "recordId",
  "audience",
  "purpose",
  "authorityFingerprint",
]);

export interface PreparedCustodyCipherContext {
  workspaceId: string;
  custodyPrincipalId: string;
  subjectId: string;
  recordId: string;
  audience: PreparedReceiptAudience;
  purpose: "prepared_intelligence";
  authorityFingerprint: string;
}

export interface PreparedCustodyCipherEnvelopeV2 {
  v: typeof PREPARED_CUSTODY_CIPHER_VERSION;
  alg: typeof PREPARED_CUSTODY_CIPHER_ALGORITHM;
  kid: string;
  iv: string;
  ciphertext: string;
  aad_sha256: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(encoded: string, label: string): Uint8Array {
  if (!encoded || !BASE64.test(encoded)) {
    throw new BrainCryptoConfigurationError(`${label} must be base64 or base64url.`);
  }
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new BrainCryptoConfigurationError(`${label} must be valid base64 or base64url.`);
  }
}

function decodeCiphertext(encoded: string): Uint8Array {
  try {
    return base64ToBytes(encoded, "Prepared custody ciphertext");
  } catch {
    throw new BrainCiphertextError("Prepared custody ciphertext envelope is malformed.");
  }
}

function assertContext(context: PreparedCustodyCipherContext): void {
  if (Object.keys(context).some((key) => !CONTEXT_KEYS.has(key)) || Object.keys(context).length !== CONTEXT_KEYS.size) {
    throw new BrainCryptoConfigurationError("Prepared custody cipher context shape is invalid.");
  }
  if (!UUID.test(context.workspaceId)) throw new BrainCryptoConfigurationError("Brain workspace ID must be a UUID.");
  if (!UUID.test(context.custodyPrincipalId)) {
    throw new BrainCryptoConfigurationError("Brain custody principal ID must be a UUID.");
  }
  if (!UUID.test(context.subjectId)) throw new BrainCryptoConfigurationError("Brain subject ID must be a UUID.");
  if (!UUID.test(context.recordId)) throw new BrainCryptoConfigurationError("Brain record ID must be a UUID.");
  if (!new Set<PreparedReceiptAudience>(["person_private", "delivery_team_private"]).has(context.audience)) {
    throw new BrainCryptoConfigurationError("Prepared custody audience is invalid.");
  }
  if (context.purpose !== "prepared_intelligence") {
    throw new BrainCryptoConfigurationError("Prepared custody purpose is invalid.");
  }
  if (!SHA256.test(context.authorityFingerprint)) {
    throw new BrainCryptoConfigurationError("Prepared custody authority fingerprint is invalid.");
  }
}

export function canonicalPreparedCustodyCipherContext(context: PreparedCustodyCipherContext): string {
  assertContext(context);
  return JSON.stringify({
    v: PREPARED_CUSTODY_CIPHER_VERSION,
    schema_version: PREPARED_CUSTODY_CONTEXT_VERSION,
    workspace_id: context.workspaceId.toLowerCase(),
    custody_principal_id: context.custodyPrincipalId.toLowerCase(),
    subject_id: context.subjectId.toLowerCase(),
    record_kind: "prepared_custody_receipt",
    record_id: context.recordId.toLowerCase(),
    field: "payload",
    audience: context.audience,
    purpose: context.purpose,
    authority_fingerprint: context.authorityFingerprint,
  });
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function importKey(keyring: BrainKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) {
    throw new BrainCryptoConfigurationError("Prepared custody encryption key ID is missing or invalid.");
  }
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string" || !encoded) {
    throw new BrainCryptoConfigurationError(`Prepared custody encryption key '${keyId}' is unavailable.`);
  }
  const bytes = base64ToBytes(encoded, `Prepared custody encryption key '${keyId}'`);
  if (bytes.byteLength !== 32) {
    throw new BrainCryptoConfigurationError(
      `Prepared custody encryption key '${keyId}' must decode to exactly 32 bytes.`,
    );
  }
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function parseEnvelope(serialized: string): PreparedCustodyCipherEnvelopeV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new BrainCiphertextError("Prepared custody ciphertext envelope is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BrainCiphertextError("Prepared custody ciphertext envelope is malformed.");
  }
  const candidate = parsed as Partial<PreparedCustodyCipherEnvelopeV2>;
  if (
    Object.keys(candidate).length !== 6 ||
    !["v", "alg", "kid", "iv", "ciphertext", "aad_sha256"].every((key) => Object.hasOwn(candidate, key)) ||
    candidate.v !== PREPARED_CUSTODY_CIPHER_VERSION ||
    candidate.alg !== PREPARED_CUSTODY_CIPHER_ALGORITHM ||
    typeof candidate.kid !== "string" ||
    !KEY_ID.test(candidate.kid) ||
    typeof candidate.iv !== "string" ||
    typeof candidate.ciphertext !== "string" ||
    typeof candidate.aad_sha256 !== "string" ||
    !SHA256.test(candidate.aad_sha256)
  ) {
    throw new BrainCiphertextError("Prepared custody ciphertext envelope is malformed or unsupported.");
  }
  return candidate as PreparedCustodyCipherEnvelopeV2;
}

export async function encryptPreparedCustodyPayload(args: {
  plaintext: string;
  context: PreparedCustodyCipherContext;
  keyring: BrainKeyring;
  activeKeyId: string;
}): Promise<string> {
  const contextBytes = new TextEncoder().encode(canonicalPreparedCustodyCipherContext(args.context));
  const key = await importKey(args.keyring, args.activeKeyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(args.plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
    key,
    plaintext,
  );
  const envelope: PreparedCustodyCipherEnvelopeV2 = {
    v: PREPARED_CUSTODY_CIPHER_VERSION,
    alg: PREPARED_CUSTODY_CIPHER_ALGORITHM,
    kid: args.activeKeyId,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted)),
    aad_sha256: await sha256Hex(contextBytes),
  };
  return JSON.stringify(envelope);
}

export async function decryptPreparedCustodyPayload(args: {
  envelope: string;
  context: PreparedCustodyCipherContext;
  keyring: BrainKeyring;
}): Promise<string> {
  const parsed = parseEnvelope(args.envelope);
  const contextBytes = new TextEncoder().encode(canonicalPreparedCustodyCipherContext(args.context));
  if (parsed.aad_sha256 !== await sha256Hex(contextBytes)) {
    throw new BrainCiphertextError("Prepared custody ciphertext context does not match this receipt.");
  }
  const key = await importKey(args.keyring, parsed.kid);
  const iv = decodeCiphertext(parsed.iv);
  if (iv.byteLength !== 12) {
    throw new BrainCiphertextError("Prepared custody ciphertext IV must be exactly 12 bytes.");
  }
  const ciphertext = decodeCiphertext(parsed.ciphertext);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new BrainCiphertextError("Prepared custody ciphertext authentication failed.");
  }
}
