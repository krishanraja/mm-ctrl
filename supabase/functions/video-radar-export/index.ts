import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { consumeRequestRateLimit, isBearerRequest } from "../_shared/service-request.ts";
import {
  VIDEO_RADAR_SCHEMA_VERSION,
  buildVideoRadarCandidatesFromDays,
  type CachedHeadlineDay,
  type CachedTrend,
} from "../_shared/video-radar-contract.ts";

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Authorization", ...extraHeaders },
  });
}

function clamp(raw: string | null, fallback = 40): number {
  const value = Number.parseInt(raw || "", 10);
  return Number.isFinite(value) ? Math.max(1, Math.min(50, value)) : fallback;
}

serve(async (req) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const exportToken = Deno.env.get("VIDEO_STUDIO_EXPORT_TOKEN") ?? "";
  if (!isBearerRequest(req.headers.get("Authorization"), exportToken)) return json({ error: "unauthorized" }, 401);
  const retryAfter = consumeRequestRateLimit(exportToken);
  if (retryAfter > 0) return json({ error: "rate_limited" }, 429, { "Retry-After": String(retryAfter) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "server_misconfigured" }, 503);
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = clamp(url.searchParams.get("limit"));

  const [{ data: cache, error: cacheError }, { data: trends, error: trendsError }] = await Promise.all([
    supabase.from("live_headlines_cache").select("briefing_date,payload,created_at").order("briefing_date", { ascending: false }).limit(4),
    supabase.from("news_trends").select("id,detected_on,category,title,summary,implication,evidence,source_count,momentum").eq("is_current", true).order("momentum", { ascending: false }).limit(8),
  ]);
  if (cacheError) return json({ error: "headline_cache_unavailable" }, 503);
  if (trendsError) console.warn("video radar trend read failed", trendsError.message);

  const cacheRows = (Array.isArray(cache) ? cache : []) as Array<CachedHeadlineDay & { created_at?: string }>;
  const days = cacheRows
    .filter((row) => typeof row.briefing_date === "string" && Array.isArray(row.payload))
    .map((row) => ({ briefing_date: row.briefing_date, payload: row.payload }));
  const candidates = await buildVideoRadarCandidatesFromDays(
    days,
    Array.isArray(trends) ? trends as CachedTrend[] : [],
    limit,
  );
  const generatedAt = new Date();
  const cacheCreatedAt = cacheRows[0]?.created_at ? Date.parse(cacheRows[0].created_at) : Number.NaN;
  return json({
    schema_version: VIDEO_RADAR_SCHEMA_VERSION,
    provider: "mm_ctrl",
    provider_version: Deno.env.get("DENO_DEPLOYMENT_ID") || "video-radar-export-v2",
    generated_at: generatedAt.toISOString(),
    source_age: Number.isFinite(cacheCreatedAt) ? Math.max(0, Math.round((generatedAt.getTime() - cacheCreatedAt) / 1000)) : 0,
    candidates,
  });
});
