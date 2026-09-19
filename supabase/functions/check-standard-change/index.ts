import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  checkStandardChangeCandidate,
  type CandidateBuild,
  type ChangeRequestPacket,
  type CompiledStandardChange,
} from "../_shared/standard-change-core.ts";
import { isJsonRequest, readJsonWithLimit, safeErrorMessage, sha256Identifier } from "../_shared/public-request-guard.ts";
import { stableStringify } from "../_shared/portable-brain-package.ts";

const MAX_BYTES = 4_096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const REQUEST = /^[A-Za-z0-9_-]{16,120}$/;
const ALLOWED = new Set(["request_id", "build_id", "expected_package_hash"]);

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
    const buildId = body.build_id;
    const expectedHash = body.expected_package_hash;
    if (typeof requestId !== "string" || !REQUEST.test(requestId)) return response({ error: "invalid_request_id" }, 400);
    if (typeof buildId !== "string" || !UUID.test(buildId)) return response({ error: "invalid_build_id" }, 400);
    if (typeof expectedHash !== "string" || !SHA.test(expectedHash)) return response({ error: "invalid_expected_hash" }, 400);

    const fingerprint = await sha256Identifier(stableStringify(body));
    let runId: string | null = null;
    try {
      const { data: reservation, error: reserveError } = await ctx.supabase.rpc("reserve_standard_change_check", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_build_id: buildId,
        p_expected_package_sha256: expectedHash,
        p_capability: capability,
      });
      if (reserveError) throw reserveError;
      runId = String(reservation?.run_id ?? "");
      if (!UUID.test(runId)) throw new Error("invalid_run_receipt");
      if (reservation?.idempotent) {
        return response({ status: reservation.status, result: reservation.result, idempotent: true },
          reservation.status === "running" ? 202 : 200);
      }
      const checked = await checkStandardChangeCandidate({
        request: reservation.request as ChangeRequestPacket,
        compiled: reservation.compiled as CompiledStandardChange,
        compile_sha256: String(reservation.compile_sha256),
        build: reservation.build as CandidateBuild,
        source_body: String(reservation.source_body),
        current_standard_artifact_id: String(reservation.current_standard_artifact_id),
        current_standard_sha256: String(reservation.current_standard_sha256),
        holdout_receipt: {
          manifest_sha256: String(reservation.holdout_receipt?.manifest_sha256 ?? ""),
          item_count: Number(reservation.holdout_receipt?.item_count),
          intersection_count: Number(reservation.holdout_receipt?.intersection_count),
        },
      });
      const resultSha = await sha256Identifier(stableStringify(checked));
      const { data: result, error: finalizeError } = await ctx.supabase.rpc("finalize_standard_change_check", {
        p_run_id: runId,
        p_build_id: buildId,
        p_check: checked,
        p_result_sha256: resultSha,
        p_capability: capability,
      });
      if (finalizeError) throw finalizeError;
      return response({ status: "checked", verdict: checked.verdict, result, findings: checked.findings, idempotent: false });
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
      if (message.includes("conflict") || message.includes("stage_busy") || message.includes("already_checked") || message.includes("not_check_ready")) {
        return response({ error: "state_conflict" }, 409);
      }
      console.error("check-standard-change failed", { error: message });
      return response({ error: "check_failed" }, 500);
    }
  }),
};
