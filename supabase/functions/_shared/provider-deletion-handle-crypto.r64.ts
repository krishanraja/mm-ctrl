import {
  BrainCiphertextError,
  BrainCryptoConfigurationError,
  type BrainKeyring,
} from "./brain-crypto";

export const PROVIDER_DELETION_HANDLE_CIPHER_VERSION = 1 as const;
export const PROVIDER_DELETION_HANDLE_CONTEXT_VERSION = "ctrl.provider-deletion-handle-context.r64" as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const PROVIDER_HANDLE = /^[\x21-\x7e]{1,512}$/;
const MAX_EXCHANGE_WINDOW_MS = 35 * 24 * 60 * 60 * 1_000;

export type DeletionHandleProvider = "elevenlabs" | "stripe";
export type DeletionHandleRetentionClass = "exchange_window" | "account_lifetime";

export interface ProviderDeletionHandleContext {
  workspaceId: string;
  receiptId: string;
  handleId: string;
  provider: DeletionHandleProvider;
  retentionClass: DeletionHandleRetentionClass;
  createdAt: string;
  expiresAt: string | null;
  purpose: "provider_deletion";
}

export interface ProviderDeletionHandleEnvelopeV1 {
  v: typeof PROVIDER_DELETION_HANDLE_CIPHER_VERSION;
  alg: "A256GCM";
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
  if (!encoded || !BASE64.test(encoded)) throw new BrainCryptoConfigurationError(`${label} must be base64 or base64url.`);
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new BrainCryptoConfigurationError(`${label} must be valid base64 or base64url.`);
  }
}

function assertContext(context: ProviderDeletionHandleContext): void {
  if (!UUID.test(context.workspaceId) || !UUID.test(context.receiptId) || !UUID.test(context.handleId)) {
    throw new BrainCryptoConfigurationError("Provider deletion handle identity is invalid.");
  }
  if (context.purpose !== "provider_deletion") {
    throw new BrainCryptoConfigurationError("Provider deletion handle purpose is invalid.");
  }
  if (!ISO_INSTANT.test(context.createdAt) || Number.isNaN(Date.parse(context.createdAt))) {
    throw new BrainCryptoConfigurationError("Provider deletion handle creation time is invalid.");
  }
  if (context.provider === "elevenlabs" && context.retentionClass !== "exchange_window") {
    throw new BrainCryptoConfigurationError("ElevenLabs deletion handles must use the exchange window.");
  }
  if (context.provider === "stripe" && context.retentionClass !== "account_lifetime") {
    throw new BrainCryptoConfigurationError("Stripe deletion handles must use account-lifetime custody.");
  }
  if (context.retentionClass === "exchange_window") {
    if (!context.expiresAt || !ISO_INSTANT.test(context.expiresAt) || Number.isNaN(Date.parse(context.expiresAt))) {
      throw new BrainCryptoConfigurationError("Exchange-window deletion handle expiry is invalid.");
    }
    const lifetime = Date.parse(context.expiresAt) - Date.parse(context.createdAt);
    if (lifetime <= 0 || lifetime > MAX_EXCHANGE_WINDOW_MS) {
      throw new BrainCryptoConfigurationError("Exchange-window deletion handle must expire within 35 days.");
    }
  } else if (context.expiresAt !== null) {
    throw new BrainCryptoConfigurationError("Account-lifetime deletion handles cannot use a calendar expiry.");
  }
}

export function canonicalProviderDeletionHandleContext(context: ProviderDeletionHandleContext): string {
  assertContext(context);
  return JSON.stringify({
    v: PROVIDER_DELETION_HANDLE_CIPHER_VERSION,
    schema_version: PROVIDER_DELETION_HANDLE_CONTEXT_VERSION,
    workspace_id: context.workspaceId.toLowerCase(),
    receipt_id: context.receiptId.toLowerCase(),
    handle_id: context.handleId.toLowerCase(),
    provider: context.provider,
    retention_class: context.retentionClass,
    created_at: context.createdAt,
    expires_at: context.expiresAt,
    purpose: context.purpose,
  });
}

async function importKey(keyring: BrainKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) throw new BrainCryptoConfigurationError("Provider deletion key ID is invalid.");
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string" || !encoded) throw new BrainCryptoConfigurationError(`Provider deletion key '${keyId}' is unavailable.`);
  const bytes = base64ToBytes(encoded, `Provider deletion key '${keyId}'`);
  if (bytes.byteLength !== 32) throw new BrainCryptoConfigurationError(`Provider deletion key '${keyId}' must decode to exactly 32 bytes.`);
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseEnvelope(serialized: string): ProviderDeletionHandleEnvelopeV1 {
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch {
    throw new BrainCiphertextError("Provider deletion handle envelope is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") throw new BrainCiphertextError("Provider deletion handle envelope is malformed.");
  const candidate = parsed as Partial<ProviderDeletionHandleEnvelopeV1>;
  if (
    Object.keys(candidate).length !== 6 ||
    !["v", "alg", "kid", "iv", "ciphertext", "aad_sha256"].every((key) => Object.hasOwn(candidate, key)) ||
    candidate.v !== PROVIDER_DELETION_HANDLE_CIPHER_VERSION || candidate.alg !== "A256GCM" ||
    typeof candidate.kid !== "string" || !KEY_ID.test(candidate.kid) ||
    typeof candidate.iv !== "string" || typeof candidate.ciphertext !== "string" ||
    typeof candidate.aad_sha256 !== "string" || !SHA256.test(candidate.aad_sha256)
  ) throw new BrainCiphertextError("Provider deletion handle envelope is malformed or unsupported.");
  return candidate as ProviderDeletionHandleEnvelopeV1;
}

export async function encryptProviderDeletionHandle(args: {
  providerHandle: string;
  context: ProviderDeletionHandleContext;
  keyring: BrainKeyring;
  activeKeyId: string;
}): Promise<string> {
  if (!PROVIDER_HANDLE.test(args.providerHandle)) {
    throw new BrainCryptoConfigurationError("Provider deletion handle must be a bounded printable token.");
  }
  const aad = new TextEncoder().encode(canonicalProviderDeletionHandleContext(args.context));
  const key = await importKey(args.keyring, args.activeKeyId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    key,
    new TextEncoder().encode(args.providerHandle),
  );
  return JSON.stringify({
    v: PROVIDER_DELETION_HANDLE_CIPHER_VERSION,
    alg: "A256GCM",
    kid: args.activeKeyId,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    aad_sha256: await sha256Hex(aad),
  } satisfies ProviderDeletionHandleEnvelopeV1);
}

export async function decryptProviderDeletionHandle(args: {
  envelope: string;
  context: ProviderDeletionHandleContext;
  keyring: BrainKeyring;
}): Promise<string> {
  const parsed = parseEnvelope(args.envelope);
  const aad = new TextEncoder().encode(canonicalProviderDeletionHandleContext(args.context));
  if (parsed.aad_sha256 !== await sha256Hex(aad)) {
    throw new BrainCiphertextError("Provider deletion handle context does not match this record.");
  }
  const key = await importKey(args.keyring, parsed.kid);
  const iv = base64ToBytes(parsed.iv, "Provider deletion handle IV");
  if (iv.byteLength !== 12) throw new BrainCiphertextError("Provider deletion handle IV must be exactly 12 bytes.");
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
      key,
      base64ToBytes(parsed.ciphertext, "Provider deletion handle ciphertext"),
    );
    const handle = new TextDecoder().decode(plaintext);
    if (!PROVIDER_HANDLE.test(handle)) throw new BrainCiphertextError("Provider deletion handle plaintext is invalid.");
    return handle;
  } catch (error) {
    if (error instanceof BrainCiphertextError) throw error;
    throw new BrainCiphertextError("Provider deletion handle authentication failed.");
  }
}
