import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getResponseHeaders } from "../_shared/security-headers.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";
import { PORTABLE_BRAIN_MAX_BYTES, validatePortableBrainPackage } from "../_shared/portable-brain-package.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: getResponseHeaders() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  if (!isJsonRequest(req.headers)) return response({ error: "JSON required" }, 415);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return response({ error: "Unauthorized" }, 401);

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);

    const body = await readJsonWithLimit(req, PORTABLE_BRAIN_MAX_BYTES) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !("package" in body)) {
      return response({ error: "Expected one portable Brain package" }, 400);
    }
    const brainPackage = await validatePortableBrainPackage((body as { package: unknown }).package);
    const { data, error } = await client.rpc("import_portable_brain_package", { p_package: brainPackage });
    if (error) throw new Error(`portable_import_failed:${error.code ?? "unknown"}`);

    return response({
      ...data,
      package_fingerprint: brainPackage.manifest.content_sha256,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portable import failed";
    if (message === "request_too_large") return response({ error: "Request is too large" }, 413);
    if (message.startsWith("portable_brain_") || message.endsWith("_invalid")) return response({ error: message }, 400);
    return response({ error: message }, 500);
  }
});
