/**
 * Strict field encryption for the new Living Brain substrate.
 *
 * This deliberately does not reuse memory-crypto.ts. The legacy helper keeps a
 * development-key fallback and derives a key by padding or truncating text so
 * old memory rows remain readable. New Brain data needs a fail-closed contract.
 *
 * The stored value is a versioned JSON envelope. AES-GCM authenticates both the
 * ciphertext and a stable context containing workspace, subject, record and
 * field identity. Moving ciphertext to a different row or field therefore
 * fails authentication. Key material is supplied as an exact 32-byte base64 or
 * base64url value and is never logged or stored in the envelope.
 */

export const BRAIN_CIPHER_VERSION = 1 as const;
export const BRAIN_CIPHER_ALGORITHM = "A256GCM" as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const RECORD_KINDS = new Set<BrainRecordKind>(["source", "assertion", "item_version", "relationship_version"]);
const FIELDS = new Set<BrainCipherContext["field"]>(["content", "statement", "meaning", "explanation"]);

export type BrainRecordKind = "source" | "assertion" | "item_version" | "relationship_version";

export interface BrainCipherContext {
  workspaceId: string;
  subjectId: string;
  recordKind: BrainRecordKind;
  recordId: string;
  field: "content" | "statement" | "meaning" | "explanation";
}

export interface BrainCipherEnvelopeV1 {
  v: typeof BRAIN_CIPHER_VERSION;
  alg: typeof BRAIN_CIPHER_ALGORITHM;
  kid: string;
  iv: string;
  ciphertext: string;
  aad_sha256: string;
}

export type BrainKeyring = Readonly<Record<string, string>>;

export class BrainCryptoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainCryptoConfigurationError";
  }
}

export class BrainCiphertextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainCiphertextError";
  }
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
    return base64ToBytes(encoded, "Brain ciphertext");
  } catch {
    throw new BrainCiphertextError("Brain ciphertext envelope is malformed.");
  }
}

function assertContext(context: BrainCipherContext): void {
  if (!UUID.test(context.workspaceId)) throw new BrainCryptoConfigurationError("Brain workspace ID must be a UUID.");
  if (!UUID.test(context.subjectId)) throw new BrainCryptoConfigurationError("Brain subject ID must be a UUID.");
  if (!UUID.test(context.recordId)) throw new BrainCryptoConfigurationError("Brain record ID must be a UUID.");
  if (!RECORD_KINDS.has(context.recordKind)) {
    throw new BrainCryptoConfigurationError("Brain record kind is invalid.");
  }
  if (!FIELDS.has(context.field)) throw new BrainCryptoConfigurationError("Brain encrypted field is invalid.");
}

export function canonicalBrainCipherContext(context: BrainCipherContext): string {
  assertContext(context);
  return JSON.stringify({
    v: BRAIN_CIPHER_VERSION,
    workspace_id: context.workspaceId.toLowerCase(),
    subject_id: context.subjectId.toLowerCase(),
    record_kind: context.recordKind,
    record_id: context.recordId.toLowerCase(),
    field: context.field,
  });
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function importBrainKey(keyring: BrainKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) {
    throw new BrainCryptoConfigurationError("Brain encryption key ID is missing or invalid.");
  }
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string" || !encoded) {
    throw new BrainCryptoConfigurationError(`Brain encryption key '${keyId}' is unavailable.`);
  }
  const bytes = base64ToBytes(encoded, `Brain encryption key '${keyId}'`);
  if (bytes.byteLength !== 32) {
    throw new BrainCryptoConfigurationError(`Brain encryption key '${keyId}' must decode to exactly 32 bytes.`);
  }
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function parseEnvelope(serialized: string): BrainCipherEnvelopeV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new BrainCiphertextError("Brain ciphertext envelope is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BrainCiphertextError("Brain ciphertext envelope is malformed.");
  }
  const candidate = parsed as Partial<BrainCipherEnvelopeV1>;
  if (
    candidate.v !== BRAIN_CIPHER_VERSION ||
    candidate.alg !== BRAIN_CIPHER_ALGORITHM ||
    typeof candidate.kid !== "string" ||
    !KEY_ID.test(candidate.kid) ||
    typeof candidate.iv !== "string" ||
    typeof candidate.ciphertext !== "string" ||
    typeof candidate.aad_sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(candidate.aad_sha256)
  ) {
    throw new BrainCiphertextError("Brain ciphertext envelope is malformed or unsupported.");
  }
  return candidate as BrainCipherEnvelopeV1;
}

export async function encryptBrainField(args: {
  plaintext: string;
  context: BrainCipherContext;
  keyring: BrainKeyring;
  activeKeyId: string;
}): Promise<string> {
  const contextBytes = new TextEncoder().encode(canonicalBrainCipherContext(args.context));
  const key = await importBrainKey(args.keyring, args.activeKeyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(args.plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
    key,
    plaintext,
  );
  const envelope: BrainCipherEnvelopeV1 = {
    v: BRAIN_CIPHER_VERSION,
    alg: BRAIN_CIPHER_ALGORITHM,
    kid: args.activeKeyId,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted)),
    aad_sha256: await sha256Hex(contextBytes),
  };
  return JSON.stringify(envelope);
}

export async function decryptBrainField(args: {
  envelope: string;
  context: BrainCipherContext;
  keyring: BrainKeyring;
}): Promise<string> {
  const parsed = parseEnvelope(args.envelope);
  const contextBytes = new TextEncoder().encode(canonicalBrainCipherContext(args.context));
  const contextHash = await sha256Hex(contextBytes);
  if (parsed.aad_sha256 !== contextHash) {
    throw new BrainCiphertextError("Brain ciphertext context does not match this record.");
  }
  const key = await importBrainKey(args.keyring, parsed.kid);
  const iv = decodeCiphertext(parsed.iv);
  if (iv.byteLength !== 12) throw new BrainCiphertextError("Brain ciphertext IV must be exactly 12 bytes.");
  const ciphertext = decodeCiphertext(parsed.ciphertext);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: contextBytes, tagLength: 128 },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new BrainCiphertextError("Brain ciphertext authentication failed.");
  }
}
