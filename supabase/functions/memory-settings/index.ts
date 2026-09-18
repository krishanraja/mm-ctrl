import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getResponseHeaders } from "../_shared/security-headers.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const defaultSettings = Object.freeze({
  store_memory_enabled: true,
  store_voice_transcripts: true,
  auto_summarize_enabled: true,
  retention_days: null,
});
const settingKeys = new Set(Object.keys(defaultSettings));
const cacheKeys = Object.freeze([
  "mindmaker-memory-draft",
  "mindmaker-memory-cache",
  "mindmaker-offline-memories",
]);

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: getResponseHeaders() });
}

function publicSettings(row: Record<string, unknown> | null): Record<string, unknown> {
  if (!row) return { ...defaultSettings, persisted: false };
  return {
    store_memory_enabled: row.store_memory_enabled,
    store_voice_transcripts: row.store_voice_transcripts,
    auto_summarize_enabled: row.auto_summarize_enabled,
    retention_days: row.retention_days,
    updated_at: row.updated_at,
    persisted: true,
  };
}

function validateSettings(value: unknown): Record<string, boolean | number | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("settings_invalid");
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !settingKeys.has(key))) throw new Error("settings_keys_invalid");

  const updates: Record<string, boolean | number | null> = {};
  for (const key of ["store_memory_enabled", "store_voice_transcripts", "auto_summarize_enabled"]) {
    if (key in body) {
      if (typeof body[key] !== "boolean") throw new Error(`${key}_invalid`);
      updates[key] = body[key] as boolean;
    }
  }
  if ("retention_days" in body) {
    if (body.retention_days !== null && body.retention_days !== 30 && body.retention_days !== 90) {
      throw new Error("retention_days_invalid");
    }
    updates.retention_days = body.retention_days as number | null;
  }
  return updates;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!["GET", "PUT", "POST"].includes(req.method)) return response({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return response({ error: "Authentication required" }, 401);
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return response({ error: "Authentication required" }, 401);

    if (req.method === "GET") {
      const { data, error } = await client
        .from("user_memory_settings")
        .select("store_memory_enabled, store_voice_transcripts, auto_summarize_enabled, retention_days, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw new Error(`memory_settings_read_failed:${error.code ?? "unknown"}`);
      return response({ settings: publicSettings(data) });
    }

    if (!isJsonRequest(req.headers)) return response({ error: "JSON required" }, 415);
    const body = await readJsonWithLimit(req, 4_096);

    if (req.method === "POST") {
      if (!body || typeof body !== "object" || Array.isArray(body) ||
          JSON.stringify(Object.keys(body).sort()) !== JSON.stringify(["action"]) ||
          (body as { action?: unknown }).action !== "clear_local_cache") {
        return response({ error: "Unsupported action" }, 400);
      }
      return response({ action: "clear_local_storage", keys_to_clear: cacheKeys });
    }

    const updates = validateSettings(body);
    const { data, error } = await client
      .from("user_memory_settings")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
      .select("store_memory_enabled, store_voice_transcripts, auto_summarize_enabled, retention_days, updated_at")
      .single();
    if (error || !data) throw new Error(`memory_settings_write_failed:${error?.code ?? "unknown"}`);
    return response({ settings: publicSettings(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory settings failed";
    if (message === "request_too_large") return response({ error: "Request is too large" }, 413);
    if (message.endsWith("_invalid")) return response({ error: message }, 400);
    return response({ error: "Memory settings unavailable" }, 500);
  }
});
