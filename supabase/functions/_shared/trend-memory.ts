/**
 * trend-memory - the permanent record underneath the twenty-card feed.
 *
 * live-headlines gathers several hundred articles a day and shows twenty. The
 * filters that get from one to the other (AI-native, seven-day age, the trust
 * floor, two-per-source, four-per-lane, top-twenty, drop damage) are all right
 * for the feed and were, until 2026-09-22, the end of the line for everything
 * they rejected. Nothing wrote down what was gathered, so no question about
 * volume, share of voice, publisher lead and lag, or the quality of our own
 * filters could be asked of a single day, let alone a year.
 *
 * This module writes that record. It is deliberately side-of-the-road: every
 * function here is best effort, returns a count rather than throwing, and is
 * called after the feed already has what it needs. A failure to archive must
 * never make Home blank, which is the same fallback-safe rule the rest of this
 * function is built on.
 *
 * Three tables, all append only and enforced as such by triggers in
 * supabase/migrations/20260922100000_ctrl_keeps_what_it_gathered.sql:
 *   live_headlines_gather          every article, with what we decided about it
 *   live_headlines_cache_versions  every version of a cached day, in order
 *   model_benchmark_snapshots      the Artificial Analysis board, once a day
 *
 * The hashing here MUST match content-engine's apps/control-plane/api/
 * _observations.ts. The two records live in different Supabase projects and
 * are meant to be joinable; a hash computed differently in either place
 * silently splits one story into two and nothing would ever report it.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { RawArticle } from "./news-cluster.ts";
import type { AaModel } from "./news-sources.ts";

/** Why an article did not reach the feed. Null when it did. */
export type GatherDropReason =
  | "not_ai_native"
  | "too_old"
  | "below_trust_floor"
  | "capped_per_source"
  | "lane_full"
  | "damage";

export interface GatherEntry {
  article: RawArticle;
  aiNative: boolean;
  selected: boolean;
  dropReason: GatherDropReason | null;
  clusterKey?: string | null;
  clusterSize?: number | null;
  category?: string | null;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Canonical URL for identity: https, lowercase host without www, no fragment,
 * no tracking parameters, no trailing slash, parameters sorted. Query strings
 * are NOT dropped wholesale, because for plenty of publishers the query string
 * is the article. Null for anything that is not an http(s) URL, and the caller
 * then keys on the text alone.
 *
 * Kept byte-for-byte in step with normalizeUrl in content-engine's
 * apps/control-plane/api/_observations.ts.
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.host = u.host.toLowerCase().replace(/^www\./, "");
    u.protocol = "https:";
    for (const p of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|source|cmpid|ito)/i.test(p)) u.searchParams.delete(p);
    }
    u.searchParams.sort();
    let out = u.toString();
    if (out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

export function hostOf(url: string | null | undefined): string | null {
  const n = normalizeUrl(url);
  if (!n) return null;
  try {
    return new URL(n).host;
  } catch {
    return null;
  }
}

/** Text identity: title plus description, case and whitespace normalised, so a
 *  reflowed snippet is not mistaken for a new story. */
export function contentHashInput(title: string, description?: string | null): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return `${norm(title)}\u0000${norm(description || "")}`;
}

/** An absolute publication timestamp, or null when the source did not give a
 *  usable one. Never substitutes the time we happened to look. */
export function publishedAtOrNull(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

const CHUNK = 500;

/** Open a run row. Returns the run id, or null when the ledger is unavailable,
 *  in which case the gather still records its articles under a local id. */
export async function startGatherRun(
  supabase: SupabaseClient,
  gatherDay: string,
  trigger: string,
): Promise<string> {
  const runId = crypto.randomUUID();
  try {
    await supabase.from("live_headlines_gather_runs").insert({
      run_id: runId,
      gather_day: gatherDay,
      trigger,
    });
  } catch (e) {
    console.warn("gather run open failed:", (e as Error)?.message);
  }
  return runId;
}

export async function finishGatherRun(
  supabase: SupabaseClient,
  runId: string,
  counts: {
    fetched: number;
    aiNative: number;
    clusters: number;
    selected: number;
    recorded: number;
    perOrigin: Record<string, number>;
    error?: string | null;
  },
): Promise<void> {
  try {
    await supabase.from("live_headlines_gather_runs").update({
      finished_at: new Date().toISOString(),
      fetched: counts.fetched,
      ai_native: counts.aiNative,
      clusters: counts.clusters,
      selected: counts.selected,
      recorded: counts.recorded,
      per_origin: counts.perOrigin,
      error: counts.error ?? null,
    }).eq("run_id", runId);
  } catch (e) {
    console.warn("gather run close failed:", (e as Error)?.message);
  }
}

/** Count articles per source, so a source that has quietly died shows up as a
 *  zero beside its neighbours rather than as a slightly thinner feed. */
export function perOriginCounts(articles: RawArticle[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of articles) out[a.origin] = (out[a.origin] ?? 0) + 1;
  return out;
}

/** Shape one gather entry into its row. Async only because of the hashing. */
export async function toGatherRow(
  gatherDay: string,
  runId: string,
  entry: GatherEntry,
): Promise<Record<string, unknown>> {
  const a = entry.article;
  const normalized = normalizeUrl(a.url);
  return {
    gather_day: gatherDay,
    run_id: runId,
    origin: a.origin,
    title: (a.title || "").trim(),
    url: normalized ?? a.url ?? null,
    description: a.description ?? null,
    source_host: hostOf(a.url) ?? (a.source || null),
    source_tier: Number.isFinite(a.sourceTier) ? a.sourceTier : null,
    engagement: Number.isFinite(a.engagement) ? a.engagement : 0,
    published_at: publishedAtOrNull(a.publishedIso),
    ai_native: entry.aiNative,
    cluster_key: entry.clusterKey ?? null,
    cluster_size: entry.clusterSize ?? null,
    selected: entry.selected,
    drop_reason: entry.selected ? null : entry.dropReason,
    category: entry.category ?? null,
    url_hash: normalized ? await sha256Hex(normalized) : null,
    content_hash: await sha256Hex(contentHashInput(a.title, a.description)),
    raw: { article: a },
  };
}

/**
 * Write the gather. Duplicates within the batch are collapsed first: two
 * sources handing us the same article in one run would otherwise make Postgres
 * reject the whole chunk, because one INSERT cannot resolve a conflict against
 * a row in its own payload.
 */
export async function recordGather(
  supabase: SupabaseClient,
  gatherDay: string,
  runId: string,
  entries: GatherEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;

  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const entry of entries) {
    if (!entry.article?.title?.trim()) continue;
    const row = await toGatherRow(gatherDay, runId, entry);
    const key = `${row.url_hash ?? ""}|${row.content_hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    try {
      const { error, count } = await supabase
        .from("live_headlines_gather")
        .upsert(rows.slice(i, i + CHUNK), {
          onConflict: "gather_day,url_hash,content_hash",
          ignoreDuplicates: true,
          count: "exact",
        });
      if (error) {
        console.warn("gather record failed:", error.message);
        break;
      }
      written += count ?? 0;
    } catch (e) {
      console.warn("gather record threw:", (e as Error)?.message);
      break;
    }
  }
  return written;
}

/**
 * Append a version of a day's payload before the cache row is written over.
 *
 * This is what makes ?force=1 and ?backfill=1 safe. Both overwrite
 * live_headlines_cache in place, so a prewarm that lands after a user request
 * has been replacing what that user was served, and the backfill has been
 * rewriting past days while keeping their original created_at, leaving an
 * edited day indistinguishable from an original one. Every such write now
 * leaves the previous reading readable.
 */
export async function recordCacheVersion(
  supabase: SupabaseClient,
  briefingDate: string,
  payload: unknown[],
  writtenBy: "gather" | "force" | "backfill" | "pre_record",
): Promise<number | null> {
  try {
    const { data, error: vErr } = await supabase
      .rpc("next_live_headlines_cache_version", { p_day: briefingDate });
    if (vErr) {
      console.warn("cache version lookup failed:", vErr.message);
      return null;
    }
    const version = typeof data === "number" ? data : 1;
    const { error } = await supabase.from("live_headlines_cache_versions").insert({
      briefing_date: briefingDate,
      version,
      payload,
      written_by: writtenBy,
      card_count: Array.isArray(payload) ? payload.length : 0,
    });
    if (error) {
      console.warn("cache version write failed:", error.message);
      return null;
    }
    return version;
  } catch (e) {
    console.warn("cache version threw:", (e as Error)?.message);
    return null;
  }
}

/**
 * Capture whatever is already in the cache for a day, before anything
 * overwrites it, unless this day has been versioned already.
 *
 * Every payload written from here on is versioned as it is written, so the
 * history is complete going forward. The gap is backwards: every day cached
 * before this shipped has no version at all, and the first force or backfill
 * to touch one of those days would destroy the only copy that has ever
 * existed. That is exactly the loss this whole change is meant to stop, and it
 * would have happened on the first prewarm after deploy.
 *
 * So the first write to touch an unversioned day preserves what was there as
 * version 1, attributed to 'pre_record' because we genuinely do not know which
 * path produced it. Cheap, runs once per day ever, and it means no cached day
 * in the table's history is lost to this change going live.
 */
export async function preserveExistingCacheVersion(
  supabase: SupabaseClient,
  briefingDate: string,
): Promise<number | null> {
  try {
    const { data: existing } = await supabase
      .from("live_headlines_cache_versions")
      .select("id")
      .eq("briefing_date", briefingDate)
      .limit(1);
    if (Array.isArray(existing) && existing.length > 0) return null;

    const { data: row } = await supabase
      .from("live_headlines_cache")
      .select("payload")
      .eq("briefing_date", briefingDate)
      .maybeSingle();
    const payload = (row as { payload?: unknown } | null)?.payload;
    if (!Array.isArray(payload) || payload.length === 0) return null;

    return await recordCacheVersion(supabase, briefingDate, payload, "pre_record");
  } catch (e) {
    console.warn("cache pre-record threw:", (e as Error)?.message);
    return null;
  }
}

/**
 * Snapshot the Artificial Analysis leaderboard for the day.
 *
 * These numbers are fetched on every gather already and their six-hour cache
 * is deleted before each insert, so the frontier price and capability curve
 * has been discarded daily for months. One row per model per day, and the
 * unique constraint means repeat gathers on the same day are free.
 */
export async function recordBenchmarks(
  supabase: SupabaseClient,
  snapshotOn: string,
  models: AaModel[],
): Promise<number> {
  if (!models.length) return 0;
  const rows = models.map((m) => ({
    snapshot_on: snapshotOn,
    provider: "artificial_analysis",
    model: m.name,
    model_key: m.matchKey,
    intelligence_index: m.intelligence,
    price_per_1m: m.pricePer1m,
    rank: m.rank,
    raw: { model: m },
  }));
  try {
    const { error, count } = await supabase
      .from("model_benchmark_snapshots")
      .upsert(rows, {
        onConflict: "snapshot_on,provider,model_key",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (error) {
      console.warn("benchmark snapshot failed:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.warn("benchmark snapshot threw:", (e as Error)?.message);
    return 0;
  }
}
