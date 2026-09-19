import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { compileStandardChange, type ChangeRequestPacket } from "../_shared/standard-change-core.ts";
import { isJsonRequest, readJsonWithLimit, safeErrorMessage, sha256Identifier } from "../_shared/public-request-guard.ts";
import { stableStringify } from "../_shared/portable-brain-package.ts";

const MAX_BYTES = 4_096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const REQUEST = /^[A-Za-z0-9_-]{16,120}$/;
const ALLOWED = new Set(["request_id", "change_request_id", "expected_request_hash"]);

function exactObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).every((key) => ALLOWED.has(key)) &&
    Object.keys(value as Record<string, unknown>).length === ALLOWED.size;
}

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(request.headers)) return response({ error: "json_required" }, 415);
    const capability = Deno.env.get("STANDARD_CHANGE_PIPELINE_RPC_SECRET") ?? "";
    if (capability.length < 32) return response({ error: "pipeline_not_configured" }, 503);

    let body: unknown;
    try {
      body = await readJsonWithLimit(request, MAX_BYTES);
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "request_too_large";
      return response({ error: tooLarge ? "request_too_large" : "invalid_json" }, tooLarge ? 413 : 400);
    }
    if (!exactObject(body)) return response({ error: "invalid_request_shape" }, 400);
    const requestId = body.request_id;
    const changeRequestId = body.change_request_id;
    const expectedHash = body.expected_request_hash;
    if (typeof requestId !== "string" || !REQUEST.test(requestId)) return response({ error: "invalid_request_id" }, 400);
    if (typeof changeRequestId !== "string" || !UUID.test(changeRequestId)) return response({ error: "invalid_change_request_id" }, 400);
    if (typeof expectedHash !== "string" || !SHA.test(expectedHash)) return response({ error: "invalid_expected_hash" }, 400);

    const fingerprint = await sha256Identifier(stableStringify(body));
    let runId: string | null = null;
    try {
      const { data: reservation, error: reserveError } = await ctx.supabase.rpc("reserve_standard_change_compile", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_change_request_id: changeRequestId,
        p_expected_request_hash: expectedHash,
        p_capability: capability,
      });
      if (reserveError) throw reserveError;
      runId = String(reservation?.run_id ?? "");
      if (!UUID.test(runId)) throw new Error("invalid_run_receipt");
      if (reservation?.idempotent) {
        return response({ status: reservation.status, result: reservation.result, idempotent: true },
          reservation.status === "running" ? 202 : 200);
      }
      const compiled = await compileStandardChange(reservation.request as ChangeRequestPacket);
      const { data: result, error: finalizeError } = await ctx.supabase.rpc("finalize_standard_change_compile", {
        p_run_id: runId,
        p_compiled: compiled.compiled,
        p_compile_sha256: compiled.compile_sha256,
        p_capability: capability,
      });
      if (finalizeError) throw finalizeError;
      return response({ status: "compiled", result, idempotent: false });
    } catch (error) {
      const message = safeErrorMessage(error);
      if (runId) {
        await ctx.supabase.rpc("fail_standard_change_stage", {
          p_run_id: runId,
          p_error: message.slice(0, 1000),
          p_capability: capability,
        }).catch(() => undefined);
      }
      if (message.includes("not_owned")) return response({ error: "not_found" }, 404);
      if (message.includes("stale") || message.includes("source_hash_changed") || message.includes("changed")) {
        return response({ error: "source_changed" }, 409);
      }
      if (message.includes("conflict") || message.includes("stage_busy") || message.includes("already_compiled") || message.includes("not_compile_ready")) {
        return response({ error: "state_conflict" }, 409);
      }
      console.error("compile-standard-change failed", { error: message });
      return response({ error: "compile_failed" }, 500);
    }
  }),
};
