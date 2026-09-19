/**
 * build-sort - stage 2 of the harness chain, the build half.
 *
 * POST { surface, depth?: "short" | "full", session_label?, context?, request_id }
 *   -> 202 { run_id, stage: "planning" }
 *
 * Assembles one forced-sort deck. The FULL deck is 33 screens: 20 synthesised
 * items as 5 constructs x 2 matched pairs, up to 6 of the person's own real
 * artefacts, up to 4 public attributed peer pieces, and 3 repeat probes
 * appended. The SHORT deck (the default) is 22 screens and cuts the synthesised
 * and peer halves while leaving the same four own items in training, because
 * own work is the accept side and starving it makes every criterion compile
 * 'untested'. Both budgets and every placement rule live in
 * ../_shared/sort-composition.ts, which is pure and unit-tested; this file does
 * auth, IO and stage-writing only.
 *
 * The short deck cannot ever be called Verified (its hold-out is below the
 * release floor). That is written into stage_detail as `can_reach_verified` so
 * the screen can say it rather than the reader having to work it out.
 *
 * Shape of the response is deliberate (CH-15). Generating ten matched pairs is
 * one large model call; the chain has no run state to poll unless we create it,
 * and section 9 bans covering a minute of work with a spinner. So a
 * harness_runs row is reserved atomically, returned immediately, and the work runs in
 * EdgeRuntime.waitUntil writing `stage` as it goes:
 *
 *   planning -> generating_pairs -> assembling -> ready
 *                                             \-> failed (+ error)
 *
 * exactly as decision-engine/pipeline.ts advances decision_cases.stage. The
 * caller's JWT and RLS remain the only database access path. A security-definer
 * function binds reservation, usage receipt and final deck writes to auth.uid().
 *
 * Two things this function will not do, both load-bearing:
 *
 *   1. It never pads the `own` class. Fewer than six real artefacts means the
 *      deck is short and the shortfall is written into stage_detail. Model
 *      prose labelled as the person's own work would be a lie told to the one
 *      instrument that exists to measure them (CH-08 wants own items because
 *      they are REAL, not because they are six).
 *   2. It never quietly fixes a bad pair. The Phase 0.5 hand run graded items
 *      as the generator produced them precisely so the measurement lands on the
 *      generator; the same rule holds here. Deterministic rejects (empty half,
 *      unknown construct, identical halves) are counted and reported, and the
 *      em dash count is logged rather than silently rewritten.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { selectModel } from "../_shared/openai-utils.ts";
import { callLLMWithFallback, providerFromModel } from "../_shared/llm-fallback.ts";
import { estimateCostUsd } from "../_shared/ai-usage.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";
import {
  budgetForDepth,
  chooseHoldOut,
  makeRng,
  minPairSeparation,
  parseSortDepth,
  planDeck,
  seedFromString,
  type PairInput,
  type PeerInput,
  type PlannedItem,
  type SortBudget,
  type SortDepth,
} from "../_shared/sort-composition.ts";
import { canReachVerified } from "../_shared/discrimination.ts";
import { peerCorpusStatus, peerSamplesForSurface, peerSourceLabel } from "../_shared/peer-corpus.ts";
import { getUserContext } from "../_shared/user-context.ts";
import {
  buildPairSystemPrompt,
  buildPairUserPrompt,
  composeContextLine,
  type PairPromptConstruct,
} from "./prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SURFACE_CHARS = 120;
const MAX_LABEL_CHARS = 200;
const MAX_CONTEXT_CHARS = 600;
const MAX_REQUEST_ID_CHARS = 120;
const MAX_REQUEST_BYTES = 4_096;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,120}$/;
const REQUEST_KEYS = new Set(["surface", "depth", "session_label", "context", "request_id"]);

/** Quotes handed to the generator per construct, and how much of each. */
const QUOTES_PER_CONSTRUCT = 3;
const MAX_QUOTE_CHARS = 400;
/** An own artefact longer than this is not a screen; it is a document. */
const MAX_OWN_BODY_CHARS = 4000;
const MIN_ITEM_BODY_CHARS = 40;

// EdgeRuntime is a Supabase runtime global; declared for the type checker.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface ConstructRow {
  id: string;
  emergent_pole: string;
  evidence_ids: string[] | null;
  created_at: string;
}

interface GeneratedPair {
  construct_id?: unknown;
  pair_index?: unknown;
  intended_dimension?: unknown;
  satisfies?: unknown;
  violates?: unknown;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const log = createLogger("build-sort");
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(req.headers)) return json({ error: "content_type_must_be_json" }, 415);

    let payload: Record<string, unknown>;
    try {
      const raw = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_shape");
      payload = raw as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.message === "request_too_large") {
        return json({ error: "request_too_large" }, 413);
      }
      return json({ error: "invalid_json" }, 400);
    }
    if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) {
      return json({ error: "unexpected_field" }, 400);
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

    const surface = typeof payload.surface === "string" ? payload.surface.trim() : "";
    const sessionLabel = typeof payload.session_label === "string" ? payload.session_label.trim() : "";
    const contextLine = typeof payload.context === "string" ? payload.context.trim() : "";
    const requestId = typeof payload.request_id === "string" ? payload.request_id.trim() : "";
    if (!surface || surface.length > MAX_SURFACE_CHARS) {
      return json({ error: "surface_required" }, 400);
    }
    if (sessionLabel.length > MAX_LABEL_CHARS || contextLine.length > MAX_CONTEXT_CHARS) {
      return json({ error: "field_too_long" }, 400);
    }
    if (!REQUEST_ID.test(requestId) || requestId.length > MAX_REQUEST_ID_CHARS) {
      return json({ error: "request_id_required" }, 400);
    }
    if (payload.depth !== undefined && payload.depth !== "short" && payload.depth !== "full") {
      return json({ error: "invalid_depth" }, 400);
    }
    const depth = parseSortDepth(payload.depth);
    const budget = budgetForDepth(depth);
    const reachesVerified = canReachVerified(budget);
    const requestFingerprint = await sha256Hex(JSON.stringify({
      surface,
      depth,
      session_label: sessionLabel,
      context: contextLine,
      budget,
      can_reach_verified: reachesVerified,
    }));

    const { data: reservation, error: reservationError } = await userClient.rpc("reserve_build_sort_run", {
      p_request_id: requestId,
      p_request_fingerprint: requestFingerprint,
      p_surface: surface,
      p_depth: depth,
      p_session_label: sessionLabel,
      p_budget: budget,
      p_can_reach_verified: reachesVerified,
    });
    if (reservationError || !reservation?.run_id) {
      const message = reservationError?.message ?? "unknown";
      if (message.includes("build_sort_daily_run_limit")) {
        return json({ error: "daily_run_limit", retryable: false }, 429);
      }
      if (message.includes("build_sort_daily_spend_limit")) {
        return json({ error: "daily_spend_limit", retryable: false }, 429);
      }
      if (message.includes("build_sort_invalid_reservation")) {
        return json({ error: "invalid_reservation" }, 400);
      }
      if (message.includes("build_sort_request_conflict")) {
        return json({ error: "request_id_conflict", retryable: false }, 409);
      }
      throw new Error(`sort_reservation_failed:${reservationError?.code ?? "unknown"}`);
    }
    if (reservation.idempotent) {
      return json({
        run_id: reservation.run_id,
        stage: reservation.stage,
        status: reservation.status,
        idempotent: true,
      }, 200);
    }
    const runId = reservation.run_id as string;
    const work = buildDeck(userClient, {
      runId,
      userId,
      surface,
      contextLine,
      depth,
      budget,
      log: log.withContext({ run_id: runId, depth }),
    });
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(work);
    } else {
      await work;
    }

    return json({ run_id: runId, stage: "planning", idempotent: false }, 202);
  } catch (error) {
    log.error("build-sort handler error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return json({ error: "build_sort_failed" }, 500);
  }
});

interface BuildParams {
  runId: string;
  userId: string;
  surface: string;
  contextLine: string;
  depth: SortDepth;
  budget: SortBudget;
  log: ReturnType<typeof createLogger>;
}

/**
 * The background pass. Every exit writes a terminal stage, because a run stuck
 * on 'generating_pairs' forever is worse than a run that says it failed.
 */
async function buildDeck(client: SupabaseClient, params: BuildParams): Promise<void> {
  const { runId, userId, surface, contextLine, depth, budget, log } = params;
  const detail: Record<string, unknown> = {};

  const setStage = async (stage: string, extra: Record<string, unknown> = {}) => {
    Object.assign(detail, extra);
    const { error } = await client
      .from("harness_runs")
      .update({ stage, stage_detail: { ...detail }, updated_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", userId);
    if (error) throw new Error(`run_stage_write_failed:${error.code ?? "unknown"}`);
  };

  const fail = async (message: string, extra: Record<string, unknown> = {}) => {
    Object.assign(detail, extra);
    const { error } = await client
      .from("harness_runs")
      .update({
        stage: "failed",
        status: "failed",
        error: message,
        stage_detail: { ...detail },
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);
    if (error) log.error("failed to persist terminal sort state", { code: error.code ?? "unknown" });
    log.warn("build-sort run failed", { reason: message });
  };

  try {
    // Merge the request_id / session_label already on the row so setStage does
    // not overwrite them with a fresh object.
    const { data: existingRun, error: existingRunError } = await client
      .from("harness_runs")
      .select("stage_detail")
      .eq("id", runId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingRunError) throw new Error(`run_read_failed:${existingRunError.code ?? "unknown"}`);
    Object.assign(detail, (existingRun?.stage_detail as Record<string, unknown>) ?? {});

    // --- 1. constructs ------------------------------------------------------
    // Top 5 candidates, most evidence first. PostgREST cannot order by
    // array_length, so a bounded page is sorted here.
    const { data: constructRows, error: constructErr } = await client
      .from("constructs")
      .select("id, emergent_pole, evidence_ids, created_at")
      .eq("user_id", userId)
      .eq("status", "candidate")
      .order("created_at", { ascending: false })
      .limit(50);
    if (constructErr) throw new Error(`constructs read failed: ${constructErr.message}`);

    const constructs = ((constructRows ?? []) as ConstructRow[])
      .sort((a, b) => {
        const byEvidence = (b.evidence_ids?.length ?? 0) - (a.evidence_ids?.length ?? 0);
        if (byEvidence !== 0) return byEvidence;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      })
      .slice(0, budget.constructs);

    if (constructs.length === 0) {
      await fail(
        "There is nothing to build a sort from yet. Add a call transcript or some of your writing first, and the candidates it produces become the pairs.",
        { constructs: 0 },
      );
      return;
    }

    // Evidence quotes, so the generator writes in the person's world rather
    // than a generic one. Quotes are context only; they are never reused as
    // item text (prompt rule 4).
    const evidenceIds = [...new Set(constructs.flatMap((c) => c.evidence_ids ?? []))].slice(0, 60);
    const quotesByEvidence = new Map<string, { quote: string; situation: string | null }>();
    if (evidenceIds.length > 0) {
      const { data: evidenceRows, error: evidenceError } = await client
        .from("evidence")
        .select("id, quote, body, situation, redacted_at")
        .eq("user_id", userId)
        .in("id", evidenceIds);
      if (evidenceError) throw new Error(`evidence_read_failed:${evidenceError.code ?? "unknown"}`);
      for (const row of evidenceRows ?? []) {
        // A redacted row keeps its pointer and loses its words (CH-06). It
        // contributes nothing to the prompt and that is correct.
        if (row.redacted_at) continue;
        const text = (row.quote ?? row.body ?? "").toString().trim();
        if (!text) continue;
        quotesByEvidence.set(row.id as string, {
          quote: text.slice(0, MAX_QUOTE_CHARS),
          situation: (row.situation as string | null) ?? null,
        });
      }
    }

    const promptConstructs: PairPromptConstruct[] = constructs.map((c) => {
      const evidence = (c.evidence_ids ?? [])
        .map((id) => quotesByEvidence.get(id))
        .filter((e): e is { quote: string; situation: string | null } => Boolean(e))
        .slice(0, QUOTES_PER_CONSTRUCT);
      return {
        id: c.id,
        emergentPole: c.emergent_pole,
        quotes: evidence.map((e) => e.quote),
        situation: evidence.find((e) => e.situation)?.situation ?? null,
      };
    });

    // The doc's CONTEXT block, from facts already held. Best-effort: a missing
    // profile means a generic-but-honest context, never an invented employer.
    let resolvedContext = contextLine;
    if (!resolvedContext) {
      try {
        const ctx = await getUserContext(client, userId);
        resolvedContext = composeContextLine(
          { role: ctx.role, company: ctx.company, industry: ctx.industry },
          surface,
        );
      } catch (e) {
        log.warn("context lookup failed, using the generic block", { error: e });
        resolvedContext = composeContextLine({}, surface);
      }
    }

    await setStage("generating_pairs", {
      constructs: constructs.length,
      constructs_expected: budget.constructs,
      quotes: quotesByEvidence.size,
    });

    // --- 2. one generation call --------------------------------------------
    // Temperature 0.7 on purpose: ten pairs from one call need variety in
    // subject and register, or the deck reads as ten versions of one email and
    // measures the topic instead of the construct.
    const modelStartedAt = Date.now();
    const aiResponse = await callLLMWithFallback(
      {
        messages: [
          { role: "system", content: buildPairSystemPrompt() },
          {
            role: "user",
            content: buildPairUserPrompt({
              surface,
              context: resolvedContext,
              constructs: promptConstructs,
            }),
          },
        ],
        model: selectModel("complex"),
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      },
      { useCache: false },
    );

    const provider = providerFromModel(aiResponse.model);
    const latencyMs = Date.now() - modelStartedAt;
    const estimatedCost = estimateCostUsd({
      provider,
      model: aiResponse.model,
      functionName: "build-sort",
      promptTokens: aiResponse.usage?.prompt_tokens,
      completionTokens: aiResponse.usage?.completion_tokens,
      totalTokens: aiResponse.usage?.total_tokens,
      latencyMs,
    });
    const { error: usageError } = await client.rpc("record_build_sort_usage", {
      p_run_id: runId,
      p_provider: provider,
      p_model: aiResponse.model,
      p_prompt_tokens: aiResponse.usage?.prompt_tokens ?? 0,
      p_completion_tokens: aiResponse.usage?.completion_tokens ?? 0,
      p_total_tokens: aiResponse.usage?.total_tokens ?? 0,
      p_latency_ms: latencyMs,
      p_est_cost_usd: estimatedCost,
    });
    if (usageError) throw new Error(`usage_receipt_failed:${usageError.code ?? "unknown"}`);

    let parsed: { pairs?: unknown };
    try {
      parsed = JSON.parse(aiResponse.content || "{}");
    } catch {
      await fail("The pair generator returned something we could not read. Try building the sort again.");
      return;
    }

    const knownConstructIds = new Set(constructs.map((c) => c.id));
    const rawPairs: GeneratedPair[] = Array.isArray(parsed?.pairs) ? parsed.pairs as GeneratedPair[] : [];
    const rejects: Array<{ reason: string; construct_id?: string }> = [];
    const pairs: PairInput[] = [];
    let emDashPairs = 0;

    for (const raw of rawPairs) {
      const constructId = typeof raw?.construct_id === "string" ? raw.construct_id.trim() : "";
      const satisfies = typeof raw?.satisfies === "string" ? raw.satisfies.trim() : "";
      const violates = typeof raw?.violates === "string" ? raw.violates.trim() : "";
      const intended = typeof raw?.intended_dimension === "string" ? raw.intended_dimension.trim() : "";
      const pairIndex = Number(raw?.pair_index) === 2 ? 2 : 1;

      if (!knownConstructIds.has(constructId)) {
        rejects.push({ reason: "unknown_construct", construct_id: constructId || undefined });
        continue;
      }
      if (satisfies.length < MIN_ITEM_BODY_CHARS || violates.length < MIN_ITEM_BODY_CHARS) {
        rejects.push({ reason: "half_too_short", construct_id: constructId });
        continue;
      }
      if (satisfies === violates) {
        rejects.push({ reason: "halves_identical", construct_id: constructId });
        continue;
      }
      if (!intended) {
        // No answer key means no manipulation check and no way to read a
        // non-splitting pair. Drop it rather than write one without a key.
        rejects.push({ reason: "no_intended_dimension", construct_id: constructId });
        continue;
      }
      if (pairs.some((p) => p.constructId === constructId && p.pairIndex === pairIndex)) {
        rejects.push({ reason: "duplicate_pair_index", construct_id: constructId });
        continue;
      }
      // Logged, not repaired. A pair is graded as the generator produced it.
      if (satisfies.includes("\u2014") || violates.includes("\u2014")) emDashPairs += 1;

      pairs.push({ constructId, pairIndex, satisfies, violates, intendedDimension: intended });
    }

    if (pairs.length === 0) {
      await fail("The pair generator produced nothing usable. Try building the sort again.", {
        pairs: 0,
        pair_rejects: rejects,
      });
      return;
    }

    await setStage("assembling", {
      pairs: pairs.length,
      pairs_expected: budget.pairs,
      pair_rejects: rejects,
      em_dash_pairs: emDashPairs,
    });

    // --- 3. the person's own work (CH-08) -----------------------------------
    const { data: artefactRows, error: artefactError } = await client
      .from("evidence")
      .select("id, body, source_label, created_at, redacted_at")
      .eq("user_id", userId)
      .eq("kind", "artefact")
      .is("redacted_at", null)
      .order("created_at", { ascending: false })
      .limit(budget.own * 3);
    if (artefactError) throw new Error(`artefact_read_failed:${artefactError.code ?? "unknown"}`);

    const own: string[] = [];
    for (const row of artefactRows ?? []) {
      const body = (row.body ?? "").toString().trim();
      if (body.length < MIN_ITEM_BODY_CHARS) continue;
      own.push(body.slice(0, MAX_OWN_BODY_CHARS));
      if (own.length >= budget.own) break;
    }
    const ownShortfall = Math.max(0, budget.own - own.length);

    // --- 4. peer items (CH-11) ----------------------------------------------
    const peerStatus = peerCorpusStatus(surface);
    const peer: PeerInput[] = peerSamplesForSurface(surface, budget.peer).map((sample) => ({
      body: sample.body,
      sourceLabel: peerSourceLabel(sample),
    }));

    // --- 5. plan + hold out --------------------------------------------------
    // Seeded from the run id, so the same run rebuilds the same deck and an
    // auditor can reproduce it.
    const rng = makeRng(seedFromString(runId));
    const planned = planDeck({ pairs, own, peer, rng, budget });
    const holdOut = chooseHoldOut(planned, budget);
    const heldOut = new Set(holdOut.heldOutIds);
    const separation = minPairSeparation(planned);

    // --- 6. write the deck atomically ---------------------------------------
    const pairIdByKey = new Map<string, string>();
    for (const item of planned) {
      if (item.pairKey && !pairIdByKey.has(item.pairKey)) {
        pairIdByKey.set(item.pairKey, crypto.randomUUID());
      }
    }

    const unique = planned.filter((it) => !it.repeatOfKey);
    const repeats = planned.filter((it) => it.repeatOfKey);
    const idByKey = new Map(planned.map((item) => [item.key, crypto.randomUUID()]));

    // Peer attribution rides stage_detail.peer_attribution because source_label
    // is not part of the atomic RPC item contract. The attribution is the whole
    // basis on which a peer item is allowed in the deck (CH-11); it does not get
    // to go missing.
    const rows = planned.map((item: PlannedItem) => ({
      id: idByKey.get(item.key),
      surface,
      body: item.body,
      origin: item.origin,
      pair_id: item.pairKey ? pairIdByKey.get(item.pairKey) ?? null : null,
      pair_role: item.pairRole,
      intended_dimension: item.intendedDimension,
      targets: item.constructId ? [item.constructId] : [],
      held_out: heldOut.has(item.key),
      repeat_of: item.repeatOfKey ? idByKey.get(item.repeatOfKey) ?? null : null,
      position: item.position,
    }));
    if (rows.some((row) => !row.id || (row.position > unique.length && !row.repeat_of))) {
      throw new Error("deck_identity_invalid");
    }

    const peerAttribution = planned
      .filter((it) => it.origin === "peer" && it.sourceLabel)
      .map((it) => ({ position: it.position, source_label: it.sourceLabel }));
    const finalDetail = {
      ...detail,
      // Every `_expected` is the chosen budget's target, never the full deck's.
      items: unique.length,
      items_expected: budget.unique,
      repeats: repeats.length,
      own_available: own.length,
      own_expected: budget.own,
      own_shortfall: ownShortfall,
      peer_available: peer.length,
      peer_expected: budget.peer,
      peer_shortfall: peerStatus.shortfall,
      peer_awaiting_curation: peerStatus.awaitingCuration,
      peer_surface: peerStatus.resolvedSurface,
      peer_attribution: peerAttribution,
      held_out: holdOut.heldOutIds.length,
      held_out_expected: budget.holdOut.items,
      held_out_shape: { pairs: holdOut.pairs, own: holdOut.own, peer: holdOut.peer },
      min_pair_separation: Number.isFinite(separation) ? separation : null,
    };
    const { data: finalized, error: finalizeError } = await client.rpc("finalize_build_sort_run", {
      p_run_id: runId,
      p_items: rows,
      p_stage_detail: finalDetail,
    });
    if (finalizeError || !finalized) {
      if (finalizeError?.message?.includes("build_sort_stale_construct")) {
        throw new Error("The Brain changed while this check was being built. Start it again with the current evidence.");
      }
      throw new Error(`deck_finalization_failed:${finalizeError?.code ?? "unknown"}`);
    }

    log.info("sort deck ready", {
      depth,
      items: unique.length,
      repeats: repeats.length,
      pairs: pairs.length,
      own: own.length,
      own_shortfall: ownShortfall,
      peer: peer.length,
      held_out: holdOut.heldOutIds.length,
    });
  } catch (e) {
    await fail(e instanceof Error ? e.message : "Unknown error building the sort");
    log.error("build-sort background error", { error: e });
  }
}
