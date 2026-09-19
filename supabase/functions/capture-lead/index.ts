/**
 * capture-lead
 *
 * Public email capture for the /download starter-kit landing page. No auth
 * required (a cold visitor has no session yet). Mirrors submit-decision-capture
 * / send-kit-pack for CORS + response shape.
 *
 * Validates the email server side, silently drops any submission where the
 * `website` honeypot field is filled in (a sign of a bot filling every field),
 * then forwards the lead to the marketing automation webhook
 * (CAPTURE_WEBHOOK_URL, an n8n flow that sends the kit link email and any
 * follow ups). The webhook URL is never hardcoded; it is read from the
 * function's own env so the browser never talks to a third party directly.
 */

import { corsHeaders, getResponseHeaders } from "../_shared/security-headers.ts";
import { fetchWithTimeout } from "../_shared/with-timeout.ts";
import { createLogger } from "../_shared/logger.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { consumeRequestRateLimit } from "../_shared/service-request.ts";
import {
  isJsonRequest,
  publicClientIdentity,
  readJsonWithLimit,
  sha256Identifier,
} from "../_shared/public-request-guard.ts";

const log = createLogger("capture-lead");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 16_384;

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), { status, headers: getResponseHeaders() });
}

function str(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (!isJsonRequest(req.headers)) return jsonResponse({ error: "JSON required." }, 415);

  try {
    const clientIdentity = publicClientIdentity(req.headers);
    const retryAfter = consumeRequestRateLimit(`capture-lead:${clientIdentity}`, Date.now(), 8, 10 * 60_000);
    if (retryAfter > 0) {
      return jsonResponse({ error: "Too many attempts. Try again later." }, 429);
    }

    const body = await readJsonWithLimit(req, MAX_BODY_BYTES).catch((error) => {
      if ((error as Error).message === "request_too_large") throw error;
      return {};
    }) as Record<string, unknown>;

    // Honeypot: a real visitor never fills this field (it is offscreen and
    // never focusable). A filled honeypot is a bot; drop it silently with a
    // success-shaped response so the bot never learns it was caught.
    const website = str(body?.website, 200);
    if (website) {
      log.info("honeypot triggered, dropping silently");
      return jsonResponse({ ok: true }, 200);
    }

    const email = str(body?.email, 320).toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      log.error("rate-limit authority is not configured");
      return jsonResponse({ error: "Could not send right now. Try again." }, 503);
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const emailHash = await sha256Identifier(email);
    const limits = [
      { key: `capture-lead:ip:${clientIdentity}`, max: 15, window: 3_600 },
      { key: `capture-lead:email:${emailHash}`, max: 3, window: 86_400 },
    ];
    for (const limit of limits) {
      const { data, error } = await supabase.rpc("check_rate_limit", {
        p_rate_limit_key: limit.key,
        p_max_requests: limit.max,
        p_window_seconds: limit.window,
      });
      const outcome = Array.isArray(data) ? data[0] : data;
      if (error || typeof outcome?.allowed !== "boolean") {
        log.error("distributed rate-limit check failed");
        return jsonResponse({ error: "Could not send right now. Try again." }, 503);
      }
      if (!outcome.allowed) {
        return jsonResponse({ error: "Too many attempts. Try again later." }, 429);
      }
    }

    const webhookUrl = Deno.env.get("CAPTURE_WEBHOOK_URL");
    if (!webhookUrl) {
      // Not configured yet. We cannot honor the promise to email the kit
      // link, so tell the truth instead of a fake success.
      log.error("CAPTURE_WEBHOOK_URL is not set");
      return jsonResponse({ error: "Could not send right now. Try again." }, 500);
    }

    const payload = {
      email,
      full_name: null,
      artifact_name: "CTRL starter kit",
      utm_source: str(body?.utm_source, 100) || "direct",
      utm_medium: str(body?.utm_medium, 100) || "organic",
      utm_campaign: str(body?.utm_campaign, 100) || "mm_ctrl_capture_page",
      utm_content: str(body?.utm_content, 100) || null,
      utm_term: str(body?.utm_term, 100) || null,
      page_url: str(body?.page_url, 500),
    };

    const res = await fetchWithTimeout(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeoutMs: 10_000,
      provider: "capture-webhook",
    });

    if (!res.ok) {
      log.error("capture webhook returned non-ok", { status: res.status });
      return jsonResponse({ error: "Could not send right now. Try again." }, 502);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    if ((err as Error).message === "request_too_large") {
      return jsonResponse({ error: "Request is too large." }, 413);
    }
    log.error("capture-lead error", { error: (err as Error).message });
    return jsonResponse({ error: "Something went wrong. Try again." }, 500);
  }
});
