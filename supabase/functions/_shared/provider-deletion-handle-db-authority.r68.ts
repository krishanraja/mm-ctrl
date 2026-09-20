import {
  issueProviderHandleAuthority,
  verifyProviderHandleAuthority,
  type ExpectedProviderHandleAuthority,
  type ProviderHandleAuthority,
  type ProviderHandleAuthorityKeyring,
  type ProviderHandleAuthorityRequest,
} from "./provider-deletion-handle-authority.r66";
import type { ProviderDeletionHandleEnvelopeV1 } from "./provider-deletion-handle-crypto.r64";

export const PROVIDER_HANDLE_DB_AUTHORITY_SCHEMA = "ctrl.provider-deletion-handle-authority-token.r68" as const;
export const PROVIDER_HANDLE_ENVELOPE_FINGERPRINT_DOMAIN = "ctrl.provider-deletion-handle-envelope-fingerprint.r68" as const;

const KEY_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const BASE64_URL = /^[A-Za-z0-9_-]+$/;

interface ProviderHandleDbAuthorityHeader {
  alg: "HS256";
  kid: string;
  schema_version: typeof PROVIDER_HANDLE_DB_AUTHORITY_SCHEMA;
  typ: "CTRL-PHAT";
  v: 2;
}

export type ProviderHandleDbAuthorityVerification =
  | { status: "accepted"; authority: ProviderHandleAuthority; token_sha256: string }
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

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!BASE64_URL.test(value)) return null;
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return bytesToBase64Url(bytes) === value ? bytes : null;
  } catch {
    return null;
  }
}

function encodeJson(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(canonicalJson(value)));
}

function decodeJson(value: string): unknown {
  const bytes = base64UrlToBytes(value);
  if (!bytes) throw new Error("authority_token_encoding_invalid");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

async function importHmacKey(keyring: ProviderHandleAuthorityKeyring, keyId: string): Promise<CryptoKey> {
  if (!KEY_ID.test(keyId)) throw new Error("authority_key_id_invalid");
  const encoded = Object.prototype.hasOwnProperty.call(keyring, keyId) ? keyring[keyId] : undefined;
  if (typeof encoded !== "string") throw new Error("authority_key_unavailable");
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  let bytes: Uint8Array;
  try {
    const binary = atob(normalized + padding);
    bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("authority_key_invalid");
  }
  if (bytes.byteLength < 32) throw new Error("authority_key_invalid");
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseEnvelope(envelope: ProviderDeletionHandleEnvelopeV1): ProviderDeletionHandleEnvelopeV1 {
  if (
    !envelope || typeof envelope !== "object" ||
    Object.keys(envelope).sort().join("|") !== "aad_sha256|alg|ciphertext|iv|kid|v" ||
    envelope.v !== 1 || envelope.alg !== "A256GCM" || !KEY_ID.test(envelope.kid) ||
    !BASE64_URL.test(envelope.iv) || envelope.iv.length !== 16 ||
    !BASE64_URL.test(envelope.ciphertext) || envelope.ciphertext.length < 23 || envelope.ciphertext.length > 1024 ||
    !SHA256.test(envelope.aad_sha256)
  ) throw new Error("provider_deletion_handle_cipher_envelope_invalid");
  return envelope;
}

export async function fingerprintProviderDeletionHandleEnvelope(envelope: ProviderDeletionHandleEnvelopeV1): Promise<string> {
  const exact = parseEnvelope(envelope);
  return sha256Hex([
    PROVIDER_HANDLE_ENVELOPE_FINGERPRINT_DOMAIN,
    String(exact.v),
    exact.alg,
    exact.kid,
    exact.iv,
    exact.ciphertext,
    exact.aad_sha256,
  ].join("\u001f"));
}

export async function issueDatabaseVerifiableProviderHandleAuthority(args: {
  request: ProviderHandleAuthorityRequest;
  keyring: ProviderHandleAuthorityKeyring;
  activeKeyId: string;
}): Promise<string> {
  const r66Token = await issueProviderHandleAuthority(args);
  const authority = (JSON.parse(r66Token) as { authority: ProviderHandleAuthority }).authority;
  const header: ProviderHandleDbAuthorityHeader = {
    alg: "HS256",
    kid: args.activeKeyId,
    schema_version: PROVIDER_HANDLE_DB_AUTHORITY_SCHEMA,
    typ: "CTRL-PHAT",
    v: 2,
  };
  const signingInput = `${encodeJson(header)}.${encodeJson(authority)}`;
  const key = await importHmacKey(args.keyring, args.activeKeyId);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyDatabaseVerifiableProviderHandleAuthority(args: {
  token: string;
  keyring: ProviderHandleAuthorityKeyring;
  expected: ExpectedProviderHandleAuthority;
  now: string;
}): Promise<ProviderHandleDbAuthorityVerification> {
  const reasons: string[] = [];
  const segments = args.token.split(".");
  if (segments.length !== 3) return { status: "held", reasons: ["authority_token_malformed"] };
  let header: ProviderHandleDbAuthorityHeader;
  let authority: ProviderHandleAuthority;
  try {
    header = decodeJson(segments[0]) as ProviderHandleDbAuthorityHeader;
    authority = decodeJson(segments[1]) as ProviderHandleAuthority;
  } catch {
    return { status: "held", reasons: ["authority_token_malformed"] };
  }
  if (
    !header || typeof header !== "object" ||
    Object.keys(header).sort().join("|") !== "alg|kid|schema_version|typ|v" ||
    header.v !== 2 || header.alg !== "HS256" || header.typ !== "CTRL-PHAT" ||
    header.schema_version !== PROVIDER_HANDLE_DB_AUTHORITY_SCHEMA || !KEY_ID.test(header.kid)
  ) reasons.push("authority_header_invalid");

  try {
    const key = await importHmacKey(args.keyring, header.kid);
    const signature = base64UrlToBytes(segments[2]);
    if (!signature || !(await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(`${segments[0]}.${segments[1]}`),
    ))) reasons.push("authority_signature_invalid");
  } catch {
    reasons.push("authority_key_unavailable");
  }

  try {
    const { schema_version: _schemaVersion, role: _role, ...request } = authority;
    const rebuiltR66 = await issueProviderHandleAuthority({
      request: request as ProviderHandleAuthorityRequest,
      keyring: args.keyring,
      activeKeyId: header.kid,
    });
    const rebuiltAuthority = (JSON.parse(rebuiltR66) as { authority: ProviderHandleAuthority }).authority;
    if (canonicalJson(rebuiltAuthority) !== canonicalJson(authority)) reasons.push("authority_payload_invalid");
    const verifiedR66 = await verifyProviderHandleAuthority({
      token: rebuiltR66,
      keyring: args.keyring,
      expected: args.expected,
      now: args.now,
    });
    if (verifiedR66.status === "held") reasons.push(...verifiedR66.reasons);
  } catch {
    reasons.push("authority_payload_invalid");
  }

  const uniqueReasons = [...new Set(reasons)].sort();
  return uniqueReasons.length > 0
    ? { status: "held", reasons: uniqueReasons }
    : { status: "accepted", authority, token_sha256: await sha256Hex(args.token) };
}
