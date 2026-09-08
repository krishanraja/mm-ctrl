/** Pure, deterministic pieces of the future service-side Brain writer. */

export type BrainJson = null | boolean | number | string | BrainJson[] | { [key: string]: BrainJson };

const INGEST_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export class BrainIngestContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainIngestContractError";
  }
}

export function assertBrainIngestKey(value: string): string {
  if (!INGEST_KEY.test(value)) {
    throw new BrainIngestContractError(
      "Brain ingest key must be 8 to 128 URL-safe, non-whitespace characters.",
    );
  }
  return value;
}

export function canonicalBrainJson(value: BrainJson): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new BrainIngestContractError("Brain ingest JSON cannot contain non-finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalBrainJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalBrainJson(entry)}`).join(",")}}`;
}

export async function fingerprintBrainIngestPayload(payload: BrainJson): Promise<string> {
  const bytes = new TextEncoder().encode(`brain-ingest-v1\n${canonicalBrainJson(payload)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function resolveBrainIngestReplay(args: {
  ingestKey: string;
  incomingPayloadSha256: string;
  existingPayloadSha256: string | null;
}): "create" | "replay" {
  assertBrainIngestKey(args.ingestKey);
  if (!/^[0-9a-f]{64}$/.test(args.incomingPayloadSha256)) {
    throw new BrainIngestContractError("Incoming Brain ingest payload fingerprint is invalid.");
  }
  if (args.existingPayloadSha256 === null) return "create";
  if (!/^[0-9a-f]{64}$/.test(args.existingPayloadSha256)) {
    throw new BrainIngestContractError("Stored Brain ingest payload fingerprint is invalid.");
  }
  if (args.existingPayloadSha256 === args.incomingPayloadSha256) return "replay";
  throw new BrainIngestContractError("Brain ingest key was already used for a different payload.");
}
