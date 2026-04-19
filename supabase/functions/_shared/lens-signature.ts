/**
 * Stable signature for a lens item.
 *
 * Lens items are regenerated per briefing, so their ids (decision_0,
 * interest_beat_<uuid>, etc.) change on every run for non-interest items.
 * To persist negative feedback across days we key on (type, normalized text)
 * instead. Normalization: lowercase, trim, collapse whitespace.
 *
 * SHA-256 hex is used to keep the signature a fixed-length, index-friendly
 * TEXT. The Web Crypto API is always available in Deno.
 */

export function normalizeLensText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Bucket the full LensItemType enum into a coarse axis so "interest_beat"
 * and "interest_entity" feedback don't leak across different axes. Decisions,
 * missions, objectives and blockers are all "goal"-shaped and can share an
 * axis; watchlist + entities are "entity"-shaped; interests stay their own
 * axes. Patterns get their own axis.
 */
export function bucketLensType(type: string): string {
  switch (type) {
    case "interest_beat":
      return "interest_beat";
    case "interest_entity":
      return "interest_entity";
    case "watchlist":
      return "entity";
    case "pattern":
      return "pattern";
    case "decision":
    case "mission":
    case "objective":
    case "blocker":
    default:
      return "goal";
  }
}

/**
 * Compute the SHA-256 signature for a lens item. Safe to call from any edge
 * function; no external deps.
 */
export async function computeLensSignature(type: string, text: string): Promise<string> {
  const bucket = bucketLensType(type);
  const normal = normalizeLensText(text);
  const input = `${bucket}|${normal}`;
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
