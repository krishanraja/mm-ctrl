import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildMemoryContext } from "../_shared/memory-context-builder.ts";
import { getResponseHeaders } from "../_shared/security-headers.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formats = new Set(["markdown", "chatgpt", "claude", "gemini", "cursor", "claude-code"]);
const useCases = new Set([
  "general", "meeting", "decision", "code", "email", "strategy", "delegation", "board", "edge",
  "writing_persona", "strength_framework", "delegation_playbook", "strategic_advisor", "decision_journal",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: getResponseHeaders(),
    });
  }
  if (!isJsonRequest(req.headers)) {
    return new Response(JSON.stringify({ error: "JSON required" }), {
      status: 415,
      headers: getResponseHeaders(),
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: getResponseHeaders(),
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await readJsonWithLimit(req, 8_192).catch((error) => {
      if ((error as Error).message === "request_too_large") throw error;
      return {};
    }) as Record<string, unknown>;
    const { format = "markdown", useCase = "general", maxTokens = 4000 } = body;
    if (typeof format !== "string" || !formats.has(format)) {
      return new Response(JSON.stringify({ error: "Unsupported export format" }), {
        status: 400,
        headers: getResponseHeaders(),
      });
    }
    if (typeof useCase !== "string" || !useCases.has(useCase)) {
      return new Response(JSON.stringify({ error: "Unsupported use case" }), {
        status: 400,
        headers: getResponseHeaders(),
      });
    }
    if (!Number.isInteger(maxTokens) || Number(maxTokens) < 500 || Number(maxTokens) > 12_000) {
      return new Response(JSON.stringify({ error: "maxTokens must be between 500 and 12000" }), {
        status: 400,
        headers: getResponseHeaders(),
      });
    }

    const result = await buildMemoryContext(supabase, user.id, {
      includeWarm: true,
      format: format as "markdown" | "chatgpt" | "claude" | "gemini" | "cursor" | "claude-code",
      useCase: useCase as "general" | "meeting" | "decision" | "code" | "email" | "strategy" | "delegation" | "board" | "edge" | "writing_persona" | "strength_framework" | "delegation_playbook" | "strategic_advisor" | "decision_journal",
      maxTokens: Number(maxTokens),
    });

    // Reliance is part of the export receipt, so wait for it rather than
    // hoping a fire-and-forget request survives function shutdown.
    {
      const touchIds = result.touchedFactIds ?? [];
      if (touchIds.length) {
        const { error } = await supabase.rpc("touch_memory_facts", { p_fact_ids: touchIds });
        if (error) console.warn("touch failed:", error.message);
      }
    }

    // Surface artefacts + primary-file hints for the client wizard. Keep
    // `context` for legacy callers that grab the first blob.
    const primary = result.artefacts?.[0];
    return new Response(
      JSON.stringify({
        ...result,
        primary_filename: primary?.filename,
        primary_mime: primary?.mime,
      }),
      {
        status: 200,
        headers: getResponseHeaders(),
      },
    );
  } catch (err) {
    if ((err as Error).message === "request_too_large") {
      return new Response(JSON.stringify({ error: "Request is too large" }), {
        status: 413,
        headers: getResponseHeaders(),
      });
    }
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: getResponseHeaders(),
      },
    );
  }
});
