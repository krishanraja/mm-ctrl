/**
 * briefing-lens — Stage 1 (Importance Lens) + Stage 2 (Query Planner)
 *
 * The lens is the core abstraction of briefing v2: instead of flattening every
 * profile table into one prompt, we first produce an explicit ranked list of
 * what matters to this user TODAY for THIS briefing type. Every downstream
 * story is scored against this lens, and every retained segment carries the
 * id of the lens item it matched. That is the "evidence" in "evidence-based
 * relevance".
 *
 * Cache key MUST include briefing_type — a macro_trends lens weights the
 * watchlist differently than a boardroom_prep lens weights decisions.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCachedResponse, setCachedResponse, hashPrompt } from "./ai-cache.ts";
import type { TrainingMaterial } from "./training-schema.ts";

export type LensItemType =
  | "decision"
  | "mission"
  | "watchlist"
  | "blocker"
  | "objective"
  | "pattern";

export interface LensItem {
  id: string;
  type: LensItemType;
  ref_id: string | null;
  text: string;
  weight: number;
}

export interface PlannedQuery {
  query: string;
  intent: string;
  target_lens_item_id: string;
}

export interface LensSource {
  userId: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  objectives: Array<{ id?: string; text: string }>;
  blockers: Array<{ id?: string; text: string }>;
  missions: Array<{ id: string; title: string }>;
  decisions: Array<{ id: string; text: string }>;
  watchingCompanies: string[];
  patterns: Array<{ type: string; text: string; confidence: number }>;
}

const LENS_CACHE_MODEL = "briefing-lens-v2";
const LENS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Build a deterministic prompt hash that uniquely identifies a lens.
 * Includes user, briefing_type, date AND a signature of the input profile
 * so a profile change within the day invalidates the cache.
 */
function buildLensCacheKey(
  userId: string,
  briefingType: string,
  date: string,
  source: LensSource,
): string {
  const signature = JSON.stringify({
    o: source.objectives.map(o => o.text).sort(),
    m: source.missions.map(m => m.title).sort(),
    d: source.decisions.map(d => d.text).sort(),
    w: [...source.watchingCompanies].sort(),
    b: source.blockers.map(b => b.text).sort(),
    r: source.role,
    c: source.company,
    i: source.industry,
  });
  return hashPrompt(`lens:${userId}:${briefingType}:${date}:${signature}`);
}

function lensItemId(type: LensItemType, idx: number): string {
  return `${type}_${idx}`;
}

/**
 * Deterministic fallback lens. Used when the LLM lens call fails or is
 * skipped. Weights are hand-tuned per briefing_type to match the intent of
 * each briefing.
 *
 * Returns at most 8 items, newest/most-active first, weighted 1.0 for the
 * top-priority item type of this briefing and 0.6 for supporting items.
 */
function deterministicLens(
  source: LensSource,
  briefingType: string,
): LensItem[] {
  const items: LensItem[] = [];
  let idx = 0;

  const typeWeights: Record<string, { decision: number; mission: number; watchlist: number; objective: number; blocker: number; pattern: number }> = {
    default: { decision: 1.0, mission: 0.9, watchlist: 0.7, objective: 0.8, blocker: 0.6, pattern: 0.4 },
    macro_trends: { decision: 0.7, mission: 0.8, watchlist: 0.6, objective: 1.0, blocker: 0.5, pattern: 0.3 },
    vendor_landscape: { decision: 1.0, mission: 0.7, watchlist: 0.9, objective: 0.6, blocker: 0.7, pattern: 0.3 },
    competitive_intel: { decision: 0.8, mission: 0.7, watchlist: 1.0, objective: 0.6, blocker: 0.5, pattern: 0.3 },
    boardroom_prep: { decision: 0.9, mission: 1.0, watchlist: 0.7, objective: 0.9, blocker: 0.5, pattern: 0.3 },
    team_update: { decision: 0.7, mission: 1.0, watchlist: 0.5, objective: 0.7, blocker: 0.9, pattern: 0.4 },
    ai_landscape: { decision: 0.9, mission: 0.6, watchlist: 0.6, objective: 0.8, blocker: 0.7, pattern: 0.3 },
    custom_voice: { decision: 0.8, mission: 0.8, watchlist: 0.8, objective: 0.8, blocker: 0.8, pattern: 0.4 },
  };
  const w = typeWeights[briefingType] || typeWeights.default;

  for (const d of source.decisions.slice(0, 3)) {
    items.push({ id: lensItemId("decision", idx++), type: "decision", ref_id: d.id, text: d.text, weight: w.decision });
  }
  for (const m of source.missions.slice(0, 3)) {
    items.push({ id: lensItemId("mission", idx++), type: "mission", ref_id: m.id, text: m.title, weight: w.mission });
  }
  for (const wCo of source.watchingCompanies.slice(0, 4)) {
    items.push({ id: lensItemId("watchlist", idx++), type: "watchlist", ref_id: null, text: wCo, weight: w.watchlist });
  }
  for (const o of source.objectives.slice(0, 3)) {
    items.push({ id: lensItemId("objective", idx++), type: "objective", ref_id: o.id ?? null, text: o.text, weight: w.objective });
  }
  for (const b of source.blockers.slice(0, 2)) {
    items.push({ id: lensItemId("blocker", idx++), type: "blocker", ref_id: b.id ?? null, text: b.text, weight: w.blocker });
  }

  return items
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

/**
 * Stage 1: Importance Lens. Asks gpt-4o-mini to reorder and reweight the
 * deterministic lens based on today's briefing type — letting the LLM apply
 * judgement about which profile items actually matter for THIS briefing.
 *
 * Cached 24h keyed on (user, briefing_type, date, profile_signature).
 * Falls back to the deterministic lens on any error.
 */
export async function buildImportanceLens(
  supabase: SupabaseClient,
  openaiKey: string | undefined,
  source: LensSource,
  briefingType: string,
  model: string = "gpt-4o-mini",
): Promise<LensItem[]> {
  const today = new Date().toISOString().split("T")[0];
  const baseline = deterministicLens(source, briefingType);

  if (baseline.length === 0) return [];
  if (!openaiKey) return baseline;

  const cacheKey = buildLensCacheKey(source.userId, briefingType, today, source);
  const cached = await getCachedResponse(supabase, cacheKey, LENS_CACHE_MODEL, LENS_CACHE_TTL_MS);
  if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
    return cached.items as LensItem[];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              `You build a RELEVANCE LENS for a personalised news briefing. Reorder and reweight the candidate lens items so the items most relevant to a "${briefingType}" briefing rise to the top. Weights must be between 0 and 1. Keep every item id unchanged. Return AT MOST 8 items, sorted by weight descending. Do not invent new items. Return JSON: {"items": [{"id":"...","type":"...","ref_id":"...","text":"...","weight":0.85}]}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              leader: {
                role: source.role,
                company: source.company,
                industry: source.industry,
              },
              briefing_type: briefingType,
              candidate_items: baseline,
            }),
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return baseline;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return baseline;

    const parsed = JSON.parse(content);
    const raw = Array.isArray(parsed.items) ? parsed.items : [];
    const allowedIds = new Set(baseline.map(b => b.id));
    const baselineById = new Map(baseline.map(b => [b.id, b]));

    const items: LensItem[] = raw
      .filter((r: Record<string, unknown>) => typeof r.id === "string" && allowedIds.has(r.id as string))
      .map((r: Record<string, unknown>) => {
        const b = baselineById.get(r.id as string)!;
        const w = typeof r.weight === "number" ? r.weight : b.weight;
        return { ...b, weight: Math.max(0, Math.min(1, w)) };
      })
      .slice(0, 8);

    const finalItems = items.length > 0 ? items : baseline;
    await setCachedResponse(supabase, cacheKey, LENS_CACHE_MODEL, { items: finalItems }, LENS_CACHE_TTL_MS);
    return finalItems;
  } catch (e) {
    console.warn("briefing-lens: LLM lens failed, using deterministic", e instanceof Error ? e.message : e);
    return baseline;
  }
}

/**
 * Stage 2: Query Planner. Turns the lens into 4-6 targeted news queries.
 * Uses training_material.hot_signal_taxonomy and watchlist to bias queries
 * toward must-include categories and away from drop categories.
 *
 * If no LLM is available, falls back to a deterministic template (verbatim
 * lens_item.text). The template fallback is per-plan design: the lens itself
 * is the real unlock; the planner LLM is polish.
 */
export async function planQueries(
  openaiKey: string | undefined,
  lens: LensItem[],
  training: TrainingMaterial | undefined,
  briefingType: string,
  customContext: string | undefined,
  model: string = "gpt-4o-mini",
): Promise<PlannedQuery[]> {
  const topLens = lens.slice(0, 6);
  if (topLens.length === 0) return [];

  const deterministic: PlannedQuery[] = topLens.slice(0, 5).map(item => ({
    query: queryForLensItem(item, briefingType),
    intent: `Coverage of ${item.type} "${truncate(item.text, 60)}"`,
    target_lens_item_id: item.id,
  }));

  if (!openaiKey) return deterministic;

  try {
    const mustInclude = training?.hot_signal_taxonomy?.must_include ?? [];
    const drop = training?.hot_signal_taxonomy?.drop ?? [];
    const watchlist = training?.watchlist ?? { companies: [], people: [], themes: [] };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              `You are a news-search query planner. Given a lens (items that matter to a specific leader today) produce 4-6 distinct web-search queries. Each query must target exactly one lens item. Every query must cite the target lens item's id. Prefer specific named entities over generic topics. Bias queries toward must_include categories; never target drop categories. Return JSON: {"queries":[{"query":"...","intent":"...","target_lens_item_id":"..."}]}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              briefing_type: briefingType,
              custom_context: customContext ?? null,
              lens: topLens,
              must_include: mustInclude,
              drop,
              watchlist,
            }),
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return deterministic;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return deterministic;

    const parsed = JSON.parse(content);
    const raw = Array.isArray(parsed.queries) ? parsed.queries : [];
    const allowedIds = new Set(topLens.map(t => t.id));
    const cleaned: PlannedQuery[] = raw
      .filter((q: Record<string, unknown>) =>
        typeof q.query === "string" &&
        (q.query as string).trim().length > 3 &&
        typeof q.target_lens_item_id === "string" &&
        allowedIds.has(q.target_lens_item_id as string),
      )
      .map((q: Record<string, unknown>) => ({
        query: (q.query as string).trim(),
        intent: typeof q.intent === "string" ? (q.intent as string) : "Coverage",
        target_lens_item_id: q.target_lens_item_id as string,
      }))
      .slice(0, 6);

    return cleaned.length >= 3 ? cleaned : deterministic;
  } catch (e) {
    console.warn("briefing-lens: planner failed, using deterministic", e instanceof Error ? e.message : e);
    return deterministic;
  }
}

function queryForLensItem(item: LensItem, briefingType: string): string {
  const base = item.text.trim();
  switch (item.type) {
    case "watchlist":
      return briefingType === "competitive_intel"
        ? `"${base}" strategy OR product OR hiring latest`
        : `"${base}" news latest`;
    case "decision":
      return `${base} industry news 2026`;
    case "mission":
      return `${base} latest developments`;
    case "objective":
      return `${base} trends 2026`;
    case "blocker":
      return `${base} solutions OR tools`;
    case "pattern":
      return base;
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "\u2026";
}
