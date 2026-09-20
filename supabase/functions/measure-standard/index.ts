/**
 * measure-standard: stage 5, MEASURE.
 *
 * The model sees unfamiliar work, the current compiled standard and training
 * exemplars. It never sees the leader's hidden verdict. After every prediction
 * is fixed and usage-receipted, the database joins predictions to the hidden
 * grades and atomically writes the confusion matrix and release standing.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { selectModel } from "../_shared/openai-utils.ts";
import { callLLMWithFallback, providerFromModel } from "../_shared/llm-fallback.ts";
import { estimateCostUsd } from "../_shared/ai-usage.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit, sha256Identifier } from "../_shared/public-request-guard.ts";
import {
  capCriteria,
  enforceLens,
  selectExemplars,
  type GradedItem,
  type LoadedCriterion,
  type RawVerdict,
} from "../_shared/critique-core.ts";
import { gateFromStandardVerdicts } from "../_shared/measurement-gate.ts";
import { buildStandardLensPrompt } from "../critique-artefact/prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const MAX_REQUEST_BYTES = 8_192;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,120}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_KEYS = new Set(["request_id", "sort_run_id", "standard_artifact_id"]);
const CONCURRENCY = 3;
const WEIGHTS = new Set(["essential", "important", "optional", "pitfall"]);

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface MaterialCriterion {
  id: string;
  name: string;
  check_text: string;
  weight: string;
  holds_example: string | null;
  breaks_example: string | null;
}
interface TargetItem { id: string; position: number; surface: string; body: string }
interface TrainingItem {
  id: string; body: string; verdict: "send" | "would_not_send"; why: string | null;
}
interface MeasurementMaterial {
  surface: string;
  criteria: MaterialCriterion[];
  targets: TargetItem[];
  training: TrainingItem[];
}
interface Prediction {
  item_id: string;
  gate: "holds" | "breaks" | "insufficient";
  scored_criteria: number;
  exemplar_ids: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const log = createLogger("measure-standard");
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  let client: SupabaseClient | null = null;
  let runId = "";
  let capability = "";
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(req.headers)) return json({ error: "content_type_must_be_json" }, 415);
    let payload: Record<string, unknown>;
    try {
      const raw = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_shape");
      payload = raw as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.message === "request_too_large") return json({ error: "request_too_large" }, 413);
      return json({ error: "invalid_json" }, 400);
    }
    if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) return json({ error: "unexpected_field" }, 400);

    const requestId = typeof payload.request_id === "string" ? payload.request_id.trim() : "";
    const sortRunId = typeof payload.sort_run_id === "string" ? payload.sort_run_id.trim() : "";
    const artifactId = typeof payload.standard_artifact_id === "string" ? payload.standard_artifact_id.trim() : "";
    if (!REQUEST_ID.test(requestId)) return json({ error: "request_id_required" }, 400);
    if (!UUID.test(sortRunId) || !UUID.test(artifactId)) return json({ error: "invalid_source_id" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const expectedRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    capability = Deno.env.get("MEASURE_STANDARD_RPC_SECRET") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedRef)) return json({ error: "database_configuration_error" }, 503);
    if (capability.length < 32) return json({ error: "measurement_configuration_error" }, 503);
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);
    client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const fingerprint = await sha256Identifier(JSON.stringify({ sort_run_id: sortRunId, standard_artifact_id: artifactId }));
    const { data: reserved, error: reserveError } = await client.rpc("reserve_measure_standard_run", {
      p_request_id: requestId,
      p_request_fingerprint: fingerprint,
      p_sort_run_id: sortRunId,
      p_standard_artifact_id: artifactId,
      p_capability: capability,
    });
    if (reserveError || !reserved) {
      const message = reserveError?.message ?? "";
      if (message.includes("request_conflict")) return json({ error: "request_id_conflict" }, 409);
      if (message.includes("daily_run_limit")) return json({ error: "daily_run_limit" }, 429);
      if (message.includes("daily_spend_limit")) return json({ error: "daily_spend_limit" }, 429);
      if (message.includes("no_compiled_criteria")) return json({ error: "no_compiled_criteria" }, 409);
      if (message.includes("no_graded_holdout")) return json({ error: "no_graded_holdout" }, 409);
      if (message.includes("not_owned") || message.includes("mismatched")) return json({ error: "source_not_found" }, 404);
      throw new Error(`measurement_reservation_failed:${reserveError?.code ?? "unknown"}`);
    }
    runId = String(reserved.run_id ?? "");
    if (!UUID.test(runId)) throw new Error("measurement_reservation_invalid");
    if (reserved.idempotent === true) {
      return json({
        run_id: runId,
        stage: reserved.stage,
        status: reserved.status,
        result: reserved.result ?? {},
        idempotent: true,
      }, reserved.status === "running" ? 202 : 200);
    }
    const material = readMaterial(reserved.material);
    if (!material) throw new Error("measurement_material_invalid");

    const work = measure(client, runId, capability, material, log.withContext({ run_id: runId }));
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(work);
    else await work;
    return json({ run_id: runId, stage: "reserved", status: "running" }, 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "measurement_failed";
    if (client && runId && capability) {
      await client.rpc("fail_measure_standard_run", {
        p_run_id: runId,
        p_error: message === "measure_standard_source_changed" ? "source_changed_retry" : "measurement_failed",
        p_capability: capability,
      }).catch(() => undefined);
    }
    log.error("measure-standard handler failed", { error });
    return json({ error: message === "measure_standard_source_changed" ? "source_changed_retry" : "measurement_failed" }, 500);
  }
});

async function measure(
  client: SupabaseClient,
  runId: string,
  capability: string,
  material: MeasurementMaterial,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  const criteria = capCriteria(material.criteria.map((row, index): LoadedCriterion => ({
    id: row.id,
    shortId: `C${index + 1}`,
    name: row.name,
    checkText: row.check_text,
    weight: WEIGHTS.has(row.weight) ? row.weight as LoadedCriterion["weight"] : "important",
    holdsExample: row.holds_example,
    breaksExample: row.breaks_example,
  }))).scored;
  const training: GradedItem[] = material.training.map((row) => ({ ...row, heldOut: false }));

  try {
    const { error: stageError } = await client.rpc("advance_measure_standard_run", {
      p_run_id: runId,
      p_stage: "judging",
      p_stage_detail: { target_count: material.targets.length, completed: 0 },
      p_capability: capability,
    });
    if (stageError) throw new Error(`measurement_stage_failed:${stageError.code ?? "unknown"}`);

    const predictions: Prediction[] = [];
    for (let start = 0; start < material.targets.length; start += CONCURRENCY) {
      const batch = material.targets.slice(start, start + CONCURRENCY);
      const outcomes = await Promise.all(batch.map((item) => judgeOne(client, runId, capability, material.surface, criteria, training, item, log)));
      predictions.push(...outcomes);
      const { error } = await client.rpc("advance_measure_standard_run", {
        p_run_id: runId,
        p_stage: "judging",
        p_stage_detail: { completed: predictions.length, target_count: material.targets.length },
        p_capability: capability,
      });
      if (error) throw new Error(`measurement_stage_failed:${error.code ?? "unknown"}`);
    }

    const { error: finalStageError } = await client.rpc("advance_measure_standard_run", {
      p_run_id: runId,
      p_stage: "finalizing",
      p_stage_detail: { completed: predictions.length },
      p_capability: capability,
    });
    if (finalStageError) throw new Error(`measurement_stage_failed:${finalStageError.code ?? "unknown"}`);
    const { error: finishError } = await client.rpc("finish_measure_standard_run", {
      p_run_id: runId,
      p_predictions: predictions,
      p_capability: capability,
      p_force_failure: false,
    });
    if (finishError) {
      if (finishError.message.includes("source_changed")) throw new Error("measure_standard_source_changed");
      throw new Error(`measurement_finalize_failed:${finishError.code ?? "unknown"}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "measurement_failed";
    await client.rpc("fail_measure_standard_run", {
      p_run_id: runId,
      p_error: message === "measure_standard_source_changed" ? "source_changed_retry" : "measurement_failed",
      p_capability: capability,
    }).catch(() => undefined);
    log.error("measurement worker failed", { error });
  }
}

async function judgeOne(
  client: SupabaseClient,
  runId: string,
  capability: string,
  surface: string,
  criteria: LoadedCriterion[],
  training: GradedItem[],
  item: TargetItem,
  log: ReturnType<typeof createLogger>,
): Promise<Prediction> {
  const selection = selectExemplars(item.body, training);
  const exemplarIds = selection.exemplars.map((row) => row.id);
  try {
    const prompt = buildStandardLensPrompt({
      artefact: item.body,
      surface: item.surface || surface,
      criteria,
      exemplars: selection.exemplars,
      noGradedWork: selection.none,
    });
    const startedAt = Date.now();
    const response = await callLLMWithFallback({
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      model: selectModel("complex"),
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: "json_object" },
    }, { useCache: false });
    const latencyMs = Date.now() - startedAt;
    const provider = providerFromModel(response.model);
    const cost = estimateCostUsd({
      functionName: "measure-standard",
      provider,
      model: response.model,
      purpose: "held-out-standard",
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
      latencyMs,
    });
    const { error: receiptError } = await client.rpc("record_measure_standard_usage", {
      p_run_id: runId,
      p_item_id: item.id,
      p_provider: provider,
      p_model: response.model,
      p_prompt_tokens: response.usage?.prompt_tokens ?? 0,
      p_completion_tokens: response.usage?.completion_tokens ?? 0,
      p_total_tokens: response.usage?.total_tokens ?? 0,
      p_latency_ms: latencyMs,
      p_est_cost_usd: cost,
      p_capability: capability,
    });
    if (receiptError) throw new Error(`measurement_usage_receipt_failed:${receiptError.code ?? "unknown"}`);
    const parsed = JSON.parse(response.content || "{}") as { verdicts?: unknown };
    const raw = Array.isArray(parsed.verdicts) ? parsed.verdicts as RawVerdict[] : [];
    const enforced = enforceLens(raw, item.body, { lens: "standard", allowed: criteria });
    const gate = gateFromStandardVerdicts(enforced.verdicts);
    return { item_id: item.id, gate: gate.gate, scored_criteria: gate.scoredCriteria, exemplar_ids: exemplarIds };
  } catch (error) {
    log.warn("held-out item could not be scored", { item_id: item.id, error });
    return { item_id: item.id, gate: "insufficient", scored_criteria: 0, exemplar_ids: exemplarIds };
  }
}

function readMaterial(raw: unknown): MeasurementMaterial | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.surface !== "string" || !Array.isArray(value.criteria) || !Array.isArray(value.targets) || !Array.isArray(value.training)) return null;
  const criteria = value.criteria.filter((row): row is MaterialCriterion => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const r = row as Record<string, unknown>;
    return UUID.test(String(r.id ?? "")) && typeof r.name === "string" && typeof r.check_text === "string";
  }).map((row) => ({
    ...row,
    weight: typeof row.weight === "string" ? row.weight : "important",
    holds_example: typeof row.holds_example === "string" ? row.holds_example : null,
    breaks_example: typeof row.breaks_example === "string" ? row.breaks_example : null,
  }));
  const targets = value.targets.filter((row): row is TargetItem => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const r = row as Record<string, unknown>;
    return UUID.test(String(r.id ?? "")) && typeof r.position === "number" && typeof r.body === "string" && r.body.length > 0 && r.body.length <= 24_000;
  });
  const training = value.training.filter((row): row is TrainingItem => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const r = row as Record<string, unknown>;
    return UUID.test(String(r.id ?? "")) && typeof r.body === "string" &&
      (r.verdict === "send" || r.verdict === "would_not_send");
  }).map((row) => ({ ...row, why: typeof row.why === "string" ? row.why : null }));
  if (criteria.length === 0 || targets.length === 0 || criteria.length !== value.criteria.length || targets.length !== value.targets.length) return null;
  return { surface: value.surface, criteria, targets, training };
}

