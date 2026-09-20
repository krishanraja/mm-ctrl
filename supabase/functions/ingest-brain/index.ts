/**
 * ingest-brain: stage current Brain material as candidate evidence.
 *
 * This route does no model work. It composes exact quotes from current memory
 * facts and decisions, verifies their JavaScript offsets, then hands one
 * bounded payload to a database function. The database rechecks ownership and
 * current values before atomically writing the source, evidence, constructs and
 * receipt. A retry of the same Brain snapshot creates nothing. A changed Brain
 * snapshot retires only the previous ingestion's still-candidate constructs.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import {
  composeBrainSource,
  verifyOffsets,
  type BrainDecision,
  type BrainFact,
} from "../_shared/brain-to-evidence.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FACT_LIMIT = 60;
const DECISION_LIMIT = 10;
const MAX_REQUEST_BYTES = 2_048;

type AtomicIngestionResult = {
  receipt_id: string;
  source_id: string;
  input_fingerprint: string;
  already_ingested: boolean;
  facts_used: number;
  decisions_used: number;
  evidence: number;
  constructs: number;
  skipped: number;
  superseded_receipt_id: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const log = createLogger("ingest-brain");
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(req.headers)) return json({ error: "content_type_must_be_json" }, 415);

    let requestPayload: unknown;
    try {
      requestPayload = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof Error && error.message === "request_too_large") {
        return json({ error: "request_too_large" }, 413);
      }
      return json({ error: "invalid_json" }, 400);
    }
    if (
      !requestPayload ||
      typeof requestPayload !== "object" ||
      Array.isArray(requestPayload) ||
      Object.keys(requestPayload as Record<string, unknown>).length !== 0
    ) {
      return json({ error: "body_must_be_an_empty_object" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      log.error("database configuration does not match the configured project");
      return json({ error: "database_configuration_error" }, 503);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "missing_authorization" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (userError || !userId) return json({ error: "unauthorized" }, 401);

    const [factsResult, decisionsResult] = await Promise.all([
      userClient
        .from("user_memory")
        .select(
          "id, fact_label, fact_value, fact_category, fact_subtype, importance, confidence_score, verification_status, source_type, created_at",
        )
        .eq("user_id", userId)
        .eq("is_current", true)
        .order("importance", { ascending: false, nullsFirst: false })
        .limit(FACT_LIMIT),
      userClient
        .from("decision_cases")
        .select("id, statement, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(DECISION_LIMIT),
    ]);
    if (factsResult.error) throw new Error(`memory_read_failed:${factsResult.error.code ?? "unknown"}`);
    if (decisionsResult.error) throw new Error(`decision_read_failed:${decisionsResult.error.code ?? "unknown"}`);

    const facts = (factsResult.data ?? []) as BrainFact[];
    const decisions = (decisionsResult.data ?? []) as BrainDecision[];
    const source = composeBrainSource(facts, decisions);
    if (source.items.length === 0) {
      return json({
        error: "nothing_to_ingest",
        message:
          "There is nothing in your Brain to build a sort from yet. Capture a few things about how you work, or weigh a decision, and this fills up.",
        facts_seen: facts.length,
      }, 422);
    }

    const offsets = verifyOffsets(source);
    if (!offsets.ok) {
      log.error("composed offsets did not verify", { broken: offsets.broken.length });
      return json({ error: "offset_verification_failed", broken: offsets.broken.length }, 500);
    }

    const factsUsed = source.items.filter((item) => item.memoryFactId).length;
    const decisionsUsed = source.items.length - factsUsed;
    const payload = {
      schema_version: "ctrl.brain-ingest.v1",
      source: { kind: "artefact", label: source.label, body: source.body },
      items: source.items.map((item) => ({
        kind: "declared",
        body: item.quote,
        quote: item.quote,
        quote_start: item.quoteStart,
        quote_end: item.quoteEnd,
        source_label: source.label,
        source_ref: item.sourceRef,
        situated: true,
        situation: item.situation,
        speaker_is_owner: true,
        memory_fact_id: item.memoryFactId,
        emergent_pole: item.emergentPole,
      })),
      facts_used: factsUsed,
      decisions_used: decisionsUsed,
      skipped: facts.length - factsUsed,
    };

    const { data, error } = await userClient.rpc("ingest_brain_atomic", { p_payload: payload });
    if (error || !data) {
      const message = error?.message ?? "unknown";
      if (message.includes("brain_ingest_stale_input")) {
        return json({ error: "brain_changed_during_ingestion", retryable: true }, 409);
      }
      if (message.includes("brain_ingest_invalid")) {
        return json({ error: "invalid_ingestion_payload" }, 400);
      }
      throw new Error(`atomic_ingestion_failed:${error?.code ?? "unknown"}`);
    }

    const result = data as AtomicIngestionResult;
    log.info("brain ingestion completed", {
      already_ingested: result.already_ingested,
      evidence: result.evidence,
      constructs: result.constructs,
      superseded: Boolean(result.superseded_receipt_id),
    });
    return json(result);
  } catch (error) {
    log.error("ingest-brain failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return json({ error: "ingest_brain_failed" }, 500);
  }
});
