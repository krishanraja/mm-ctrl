const MAX_IDENTITY_LENGTH = 128;

/**
 * Returns the platform-supplied client address used only for abuse controls.
 * It is not an authentication identity.
 */
export function publicClientIdentity(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];
  const value = candidates.find((candidate) => candidate?.trim())?.trim() ?? "unknown";
  return value.slice(0, MAX_IDENTITY_LENGTH);
}

export function isJsonRequest(headers: Headers): boolean {
  const contentType = headers.get("content-type")?.toLowerCase() ?? "";
  return contentType === "application/json" || contentType.startsWith("application/json;");
}

/** Read JSON without trusting an absent or forged Content-Length header. */
export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  return JSON.parse(await readTextWithLimit(request, maxBytes));
}

/** Read the exact text payload with a hard byte budget. */
export async function readTextWithLimit(request: Request, maxBytes: number): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("request_too_large");
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("request_too_large");
      throw new Error("request_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function sha256Identifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error);
}
