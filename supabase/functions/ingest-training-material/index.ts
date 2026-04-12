/**
 * ingest-training-material
 *
 * Admin endpoint that accepts a YAML or JSON training-material document,
 * validates it against the schema, and stores it in `training_material`.
 *
 * Auth: requires the caller to present the Supabase SERVICE ROLE KEY via
 * the Authorization header. Any other caller gets 401.
 *
 * Body shape (one of):
 *   { "format": "yaml", "body": "<yaml text>" }
 *   { "format": "json", "body": {...parsed json...} }
 *   { "scope": "global" | "user", "user_id": "<uuid>" (for scope=user) }
 *
 * Returns: { version, scope, user_id, is_active: true }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/parse.ts";
import { validateTrainingMaterial } from "../_shared/training-schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (token !== serviceKey) {
      return json({ error: "Service role key required" }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    const { format, body, scope = "global", user_id = null, cohort_key = null } = payload;

    if (!format || !body) {
      return json({ error: "format and body are required" }, 400);
    }
    if (scope !== "global" && scope !== "user" && scope !== "cohort") {
      return json({ error: "scope must be global|user|cohort" }, 400);
    }
    if (scope === "user" && !user_id) {
      return json({ error: "user_id required for scope=user" }, 400);
    }

    // Parse + validate
    let rawText: string;
    let parsed: unknown;
    if (format === "yaml") {
      if (typeof body !== "string") return json({ error: "yaml body must be a string" }, 400);
      rawText = body;
      parsed = parseYaml(body);
    } else if (format === "json") {
      rawText = typeof body === "string" ? body : JSON.stringify(body);
      parsed = typeof body === "string" ? JSON.parse(body) : body;
    } else {
      return json({ error: `unsupported format: ${format}` }, 400);
    }

    let validated;
    try {
      validated = validateTrainingMaterial(parsed);
    } catch (e) {
      return json({ error: `validation failed: ${(e as Error).message}` }, 400);
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Determine next version number for this scope.
    const versionQuery = supabase
      .from("training_material")
      .select("version")
      .eq("scope", scope)
      .order("version", { ascending: false })
      .limit(1);
    if (scope === "user") versionQuery.eq("user_id", user_id);
    const { data: prev } = await versionQuery.maybeSingle();
    const nextVersion = (prev?.version ?? 0) + 1;

    // Transactionally: deactivate old, insert new. RPC would be cleanest but
    // two statements is fine here since scope+is_active has a unique partial
    // index enforcing single-active.
    const deactivateQuery = supabase
      .from("training_material")
      .update({ is_active: false })
      .eq("scope", scope)
      .eq("is_active", true);
    if (scope === "user") deactivateQuery.eq("user_id", user_id);
    await deactivateQuery;

    const { data: inserted, error: insertErr } = await supabase
      .from("training_material")
      .insert({
        scope,
        user_id,
        cohort_key,
        body_raw: rawText,
        body_parsed: validated as unknown as Record<string, unknown>,
        version: nextVersion,
        is_active: true,
      })
      .select("id, scope, user_id, version, is_active")
      .single();

    if (insertErr) return json({ error: insertErr.message }, 500);

    return json({ ok: true, ...inserted });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }

  function json(obj: unknown, status = 200): Response {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
