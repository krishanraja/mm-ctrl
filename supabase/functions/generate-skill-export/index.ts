/**
 * generate-skill-export
 *
 * Voice-to-Agent-Skill pipeline. The leader describes a repetitive workflow,
 * we run a bounded-trigger check plus Four Honest Tests triage gate, generate
 * an agentskills.io-compliant skill via the LLM, validate it through the
 * quality gate, and package it as a router-plus-leaves ZIP the client can drop
 * into ~/.claude/skills/.
 *
 * Triage failures (Memory Web facts, Custom Instructions, saved styles) are
 * still recorded in skill_exports with triage_result set accordingly, so the
 * UI can route the leader to the right surface without losing the input.
 *
 * Free for now: open to any authenticated user (kit graduates and new signups
 * taste the real pipeline). The cost driver is the LLM call (~6-10k tokens in,
 * ~3k out) plus the ZIP assembly, bounded by a generous daily soft cap.
 *
 * ---------------------------------------------------------------------------
 * Phase 3b: every rule carries a pointer
 * ---------------------------------------------------------------------------
 *
 * The three prov.* checks are BLOCKING here. This is the one function that can
 * satisfy them: it loads the leader's compiled criteria and their evidence,
 * offers their own transcript as citable spans, and hands the model short stable
 * ids to cite. They stay advisory in free-skill-export, which has neither.
 *
 * Blocking never means rejecting. A block returns to generation ONCE with the
 * specific violations named, and if the second pass still fails, the package
 * ships with the findings listed and the leader decides. A bare rejection would
 * take a real piece of work away from someone because a gate we wrote was
 * unhappy, and the gate is not the product.
 *
 * That one retry is an EDIT, not a reroll: provenanceOffenders below names each
 * offending line with the file, the line number and the exact text, because the
 * first acceptance run lost a single unpointed imperative through both passes
 * while being told only how many there were.
 *
 * ---------------------------------------------------------------------------
 * Stage 7a: the deterministic close
 * ---------------------------------------------------------------------------
 *
 * Asking twice is not an invariant. Across three real acceptance runs the
 * unpointed count came back 6, then 1, then 4, because two generation passes
 * cannot guarantee model compliance. Spec 4.7a rule 3 already specifies the
 * deterministic answer: "Unresolved claims are deleted or rewritten as NOT
 * ESTABLISHED, never shipped."
 *
 * So after the last generation pass, and before a single ZIP byte is written,
 * demoteUnpointedClaims rewrites every rule that still points at nothing into
 * its honest NOT ESTABLISHED form, in place. Then the checks are RE-RUN over the
 * demoted package and the result is asserted, not assumed: if anything is still
 * unpointed that is a bug in the demoter, so it is logged as an error and the
 * block stands rather than being reported as a pass.
 *
 * Two numbers ship, and both are needed. baseline_unresolved_claims is the count
 * BEFORE demotion and is the measurement of generator quality, so the repair is
 * never allowed to flatter it. unpointed_after_demotion is what the leader
 * actually received. The honest reading is "the generator left 4 unsourced; the
 * system demoted all 4; zero unsourced rules shipped."
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildMemoryContext } from "../_shared/memory-context-builder.ts";
import { selectModel } from "../_shared/openai-utils.ts";
import { callLLMWithFallback, providerFromModel } from "../_shared/llm-fallback.ts";
import {
  buildRegenerationPrompt,
  buildSkillSystemPrompt,
  buildSkillUserPrompt,
  type ProvenanceOffender,
} from "./prompt.ts";
import { runQualityGate, type QualityCheck, type SkillData } from "./quality-gate.ts";
import { buildSkillZipFromPackage, packageFromZipInput, type BuildSkillZipInput } from "./zip.ts";
import { estimateCostUsd } from "../_shared/ai-usage.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";
import {
  collectClaims,
  collectNotEstablished,
  parseImperativeTotal,
  parseUnpointedImperatives,
  PROVENANCE_CHECK_IDS,
  runProvenanceChecksOverClaims,
  situatedGeneralisationOffenders,
  unpointedClaims,
  unresolvedPointerClaims,
  type LocatedClaim,
  type ProvenanceOptions,
} from "../_shared/provenance-checks.ts";
import { demoteUnpointedClaims } from "../_shared/demote-claims.ts";
import {
  flattenPackageForPull,
  gatedFiles,
  routerLineCount,
  surfaceLeafPath,
  verbatimSpans,
  type SkillPackage,
} from "../_shared/skill-package.ts";
import {
  buildMemoryLinkRows,
  buildProvenanceRows,
  citedEvidenceShortIds,
  citedMemoryFactIds,
  loadGradedWork,
  loadPointerTargets,
  prepareCitedSpans,
} from "./provenance.ts";
import { loadReleaseContext } from "./release.ts";
import { threeNumbers } from "../_shared/skill-release.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("generate-skill-export");

/** Spec 4.5: one regeneration attempt, then the leader decides. Never a loop. */
const MAX_GENERATION_PASSES = 2;
const MAX_REQUEST_BYTES = 100_000;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,120}$/;
const REQUEST_KEYS = new Set(["request_id", "transcript", "own_words", "skill_name_hint", "seed"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriageResult {
  passed: boolean;
  result: "skill" | "custom_instruction" | "memory_fact" | "saved_style";
  reasoning?: string;
}

interface SkillJson {
  triage: TriageResult;
  skill?: {
    name: string;
    description: string;
    body: string;
    references?: Array<{ filename: string; content: string }>;
    test_prompts?: string[];
    gotchas?: string[];
    archetype?: string;
  };
}

async function sha256Hex(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function advanceRun(
  client: SupabaseClient,
  runId: string,
  stage: "generating" | "checking" | "packaging",
  detail: Record<string, unknown>,
  capability: string,
): Promise<void> {
  const { error } = await client.rpc("advance_generate_skill_export_run", {
    p_run_id: runId,
    p_stage: stage,
    p_stage_detail: detail,
    p_capability: capability,
  });
  if (error) throw new Error(`skill_export_stage_failed:${error.code ?? "unknown"}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let markFailed: ((message: string) => Promise<void>) | null = null;
  let removeUploaded: (() => Promise<void>) | null = null;
  try {
    if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(req.headers)) return jsonResponse({ error: "content_type_must_be_json" }, 415);

    let body: Record<string, unknown>;
    try {
      const raw = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_shape");
      body = raw as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.message === "request_too_large") {
        return jsonResponse({ error: "request_too_large" }, 413);
      }
      return jsonResponse({ error: "invalid_json" }, 400);
    }
    if (Object.keys(body).some((key) => !REQUEST_KEYS.has(key))) {
      return jsonResponse({ error: "unexpected_field" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    const rpcCapability = Deno.env.get("GENERATE_SKILL_EXPORT_RPC_SECRET") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      log.error("database configuration does not match the configured project");
      return jsonResponse({ error: "database_configuration_error" }, 503);
    }
    if (rpcCapability.length < 32) return jsonResponse({ error: "skill_export_configuration_error" }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const requestId = typeof body.request_id === "string" ? body.request_id.trim() : "";
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const skillNameHint = typeof body?.skill_name_hint === "string"
      ? body.skill_name_hint.trim()
      : undefined;

    /**
     * The leader's OWN material, and the only text a rule is allowed to quote.
     *
     * The Automator used to hand its composed narration in as `transcript`, and
     * that narration is CTRL's own template prose selected by tapping chips.
     * The transcript is split into citable spans, so every surviving [E#] in a
     * built skill resolved to a sentence we wrote and attributed to the leader.
     * A provenance chain that terminates in our own template library is worse
     * than none, because it looks sourced.
     *
     * So a caller that composes any part of its transcript must say which part
     * is actually the person's. Only this is offered for citation. Callers that
     * pass nothing keep the old behaviour, where the whole transcript is the
     * leader's because they typed or spoke it.
     */
    const ownWords = typeof body.own_words === "string" ? body.own_words.trim() : "";

    // Optional seed: when an entry point (Edge view chip, Memory blocker
    // button, Briefing decision_trigger button) hands the user a pre-anchored
    // pain, we forward it so the LLM grounds extraction in the leader's actual
    // language instead of inventing a more abstract trigger.
    const SEED_KINDS = ["blocker", "decision", "mission", "briefing_segment", "example"] as const;
    type SeedKind = typeof SEED_KINDS[number];
    let seed: { kind: SeedKind; text: string } | undefined;
    if (body.seed !== undefined) {
      if (!body.seed || typeof body.seed !== "object" || Array.isArray(body.seed)) {
        return jsonResponse({ error: "invalid_seed" }, 400);
      }
      const rawSeed = body.seed as Record<string, unknown>;
      if (Object.keys(rawSeed).some((key) => !["kind", "text"].includes(key))) {
        return jsonResponse({ error: "invalid_seed" }, 400);
      }
      const rawKind = rawSeed.kind;
      const rawText = rawSeed.text;
      if (
        typeof rawText === "string" &&
        rawText.trim().length > 0 && rawText.trim().length <= 1000 &&
        SEED_KINDS.includes(rawKind as SeedKind)
      ) {
        seed = { kind: rawKind as SeedKind, text: rawText.trim() };
      } else {
        return jsonResponse({ error: "invalid_seed" }, 400);
      }
    }

    if (!REQUEST_ID.test(requestId)) return jsonResponse({ error: "request_id_required" }, 400);
    if (transcript.length < 20 || transcript.length > 50_000) {
      return jsonResponse(
        { error: "Transcript must be at least 20 characters. Describe the workflow in more detail." },
        400,
      );
    }
    if (ownWords.length > 30_000 || (ownWords && !transcript.includes(ownWords))) {
      return jsonResponse({ error: "invalid_own_words" }, 400);
    }
    if (skillNameHint && (skillNameHint.length > 120 || /[\u0000-\u001f]/.test(skillNameHint))) {
      return jsonResponse({ error: "invalid_skill_name_hint" }, 400);
    }

    const requestFingerprint = await sha256Hex(JSON.stringify({
      transcript,
      own_words: ownWords,
      skill_name_hint: skillNameHint ?? null,
      seed: seed ?? null,
    }));
    const transcriptSha = await sha256Hex(transcript);
    const { data: reservation, error: reserveError } = await supabase.rpc(
      "reserve_generate_skill_export_run",
      {
        p_request_id: requestId,
        p_request_fingerprint: requestFingerprint,
        p_transcript_sha: transcriptSha,
        p_capability: rpcCapability,
      },
    );
    if (reserveError || !reservation) {
      const message = reserveError?.message ?? "unknown";
      if (message.includes("generate_skill_export_request_conflict")) return jsonResponse({ error: "request_id_conflict" }, 409);
      if (message.includes("generate_skill_export_daily_run_limit")) return jsonResponse({ error: "daily_run_limit" }, 429);
      if (message.includes("generate_skill_export_daily_spend_limit")) return jsonResponse({ error: "daily_spend_limit" }, 429);
      throw new Error(`skill_export_reservation_failed:${reserveError?.code ?? "unknown"}`);
    }
    const generateRunId = typeof reservation.run_id === "string" ? reservation.run_id : "";
    if (!generateRunId) throw new Error("skill_export_reservation_invalid");
    if (reservation.idempotent === true) {
      return jsonResponse({
        run_id: generateRunId,
        stage: reservation.stage,
        status: reservation.status,
        result: reservation.result ?? {},
        idempotent: true,
      }, reservation.status === "running" ? 202 : 200);
    }

    markFailed = async (message: string) => {
      await supabase.rpc("finish_generate_skill_export_run", {
        p_run_id: generateRunId,
        p_stage: "failed",
        p_status: "failed",
        p_stage_detail: { failed_at: new Date().toISOString() },
        p_error: message.slice(0, 1000),
        p_capability: rpcCapability,
      });
    };

    await advanceRun(supabase, generateRunId, "generating", {}, rpcCapability);

    // Pull Memory Web context + edge profile so the LLM has the leader's
    // background. Identical pattern to generate-custom-export.
    const memoryResult = await buildMemoryContext(supabase, user.id, {
      includeWarm: true,
      format: "markdown",
      useCase: "general",
      maxTokens: 3000,
      // The generator sees where each fact came from, so a rule it writes can
      // point back at it rather than read as invented.
      withProvenance: true,
    });

    // Fire-and-forget reliance signal on the facts that shipped into the
    // context. Never awaited; user-JWT client is fenced by auth.uid().
    {
      const touchIds = memoryResult.touchedFactIds ?? [];
      if (touchIds.length) {
        void supabase.rpc("touch_memory_facts", { p_fact_ids: touchIds })
          .then(({ error }) => { if (error) console.warn("touch failed:", error.message); });
      }
    }

    const { data: edgeProfile } = await supabase
      .from("edge_profiles")
      .select("strengths, weaknesses")
      .eq("user_id", user.id)
      .single();

    let profileContext = "";
    if (edgeProfile) {
      const strengths = (edgeProfile.strengths || [])
        .map((s: { label: string; summary: string }) => `- ${s.label}: ${s.summary}`)
        .join("\n");
      const weaknesses = (edgeProfile.weaknesses || [])
        .map((w: { label: string; summary: string }) => `- ${w.label}: ${w.summary}`)
        .join("\n");
      if (strengths) profileContext += `LEADER'S STRENGTHS:\n${strengths}\n`;
      if (weaknesses) profileContext += `LEADER'S GAPS TO COVER:\n${weaknesses}\n`;
    }

    // Extract voice profile block for explicit prompt injection (in addition to
    // the section embedded in memoryContext by buildMemoryContext).
    const voiceProfileMatch = memoryResult.context.match(
      /## Voice profile[\s\S]*?(?=\n## |\n*$)/,
    );
    const voiceProfileContext = voiceProfileMatch?.[0]?.trim() ?? "";

    // What this leader can cite, and what those citations resolve to. Empty is
    // the normal state for anyone who has not run the chain, and it is why the
    // transcript itself is offered as citable spans: without it the pointer
    // requirement is satisfiable only by a package that says nothing.
    //
    // `citableText` is the leader's own words and nothing else. When a caller
    // composed part of its transcript, the composed part must never reach this,
    // or a rule ends up citing a sentence CTRL wrote. Fewer citable spans is
    // the correct outcome there: demoteUnpointedClaims rewrites what cannot be
    // sourced as NOT ESTABLISHED, which is the system working rather than
    // failing.
    const citableText = ownWords || transcript;
    const targets = await loadPointerTargets(supabase, user.id, citableText)
      .catch((err) => {
        log.warn("pointer targets unavailable, prov.* checks stay advisory", {
          userId: user.id,
          error: err,
        });
        return null;
      });
    const gradedWork = await loadGradedWork(supabase, user.id);

    // What this package is compiled from, and what (if anything) was actually
    // measured about those rules. Read once, before the generation loop, and
    // used in two places that must never disagree: the status in the package's
    // own frontmatter, and the release block on the artefact row.
    const releaseContext = await loadReleaseContext(
      supabase,
      user.id,
      targets?.surface ?? null,
    );

    let parsed: SkillJson | null = null;
    let pkg: SkillPackage | null = null;
    let qualityGate: ReturnType<typeof runQualityGate> | null = null;
    let claims: LocatedClaim[] = [];
    let notEstablished: LocatedClaim[] = [];
    let violations: string[] = [];
    let offenders: ProvenanceOffender[] = [];
    // Blocking only where the demand can be met. With nothing to cite, the
    // checks report an honest skip and a block would be a gate nobody can
    // satisfy, which the chain forbids. Declared out here because stage 7a
    // below fires on exactly this condition, not only the retry loop.
    const blocking = Boolean(targets?.hasTargets);
    let lastModel = "";
    let pass = 0;
    const passLedger: Array<{ pass: number; claims: LocatedClaim[]; notEstablished: LocatedClaim[] }> = [];
    // Hoisted so stage 7a below reads the SAME masked spans and the SAME id sets
    // the gate read. A demotion pass working off a differently-built view would
    // eventually edit a line the gate never flagged.
    let gateQuotes: string[] = [];
    let gateOptions: ProvenanceOptions = {};
    let citedSource: { id: string; kind: "transcript"; label: string; body: string } | null = null;
    const citedEvidence: Array<{
      id: string;
      body: string;
      quote: string;
      quote_start: number;
      quote_end: number;
      source_label: string;
      situated: true;
      situation: string;
    }> = [];

    // The first user turn, identical on both passes. The regeneration pass
    // appends the previous attempt and a repair instruction to it rather than
    // replacing it, so the model edits work it can see instead of writing a
    // second package from the same brief and hoping.
    const firstTurn = buildSkillUserPrompt({
      transcript,
      memoryContext: memoryResult.context,
      profileContext,
      voiceProfileContext,
      seed,
      criteria: targets?.promptCriteria ?? [],
      evidence: targets?.promptEvidence ?? [],
    });
    let previousAttempt = "";

    while (pass < MAX_GENERATION_PASSES) {
      pass += 1;

      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: buildSkillSystemPrompt() },
        { role: "user", content: firstTurn },
      ];
      if (pass > 1) {
        // The repair instruction goes in either way. Losing the previous
        // attempt would make the edit harder; losing the findings would make
        // the second pass a coin toss.
        if (previousAttempt) messages.push({ role: "assistant", content: previousAttempt });
        messages.push({ role: "user", content: buildRegenerationPrompt(violations, offenders) });
      }

      // Generate via the LLM. JSON mode keeps the model on-format. The
      // system prompt encodes the triage gate + extraction rules.
      const modelStartedAt = Date.now();
      const aiResponse = await callLLMWithFallback(
        {
          messages,
          model: selectModel("complex"),
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        },
        { useCache: false },
      );
      previousAttempt = aiResponse.content ?? "";

      lastModel = aiResponse.model;

      const provider = providerFromModel(aiResponse.model);
      const latencyMs = Date.now() - modelStartedAt;
      const estimatedCost = estimateCostUsd({
        functionName: "generate-skill-export",
        provider,
        model: aiResponse.model,
        promptTokens: aiResponse.usage?.prompt_tokens,
        completionTokens: aiResponse.usage?.completion_tokens,
        totalTokens: aiResponse.usage?.total_tokens,
        latencyMs,
      });
      const { error: usageError } = await supabase.rpc("record_generate_skill_export_usage", {
        p_run_id: generateRunId,
        p_pass: pass,
        p_provider: provider,
        p_model: aiResponse.model,
        p_prompt_tokens: aiResponse.usage?.prompt_tokens ?? 0,
        p_completion_tokens: aiResponse.usage?.completion_tokens ?? 0,
        p_total_tokens: aiResponse.usage?.total_tokens ?? 0,
        p_latency_ms: latencyMs,
        p_est_cost_usd: estimatedCost,
        p_capability: rpcCapability,
      });
      if (usageError) throw new Error(`usage_receipt_failed:${usageError.code ?? "unknown"}`);

      try {
        parsed = JSON.parse(aiResponse.content || "{}") as SkillJson;
      } catch (err) {
        console.error("generate-skill-export: failed to parse LLM JSON", err, aiResponse.content?.slice(0, 200));
        throw new Error("skill_generation_unreadable");
      }

      if (!parsed?.triage) {
        throw new Error("skill_generation_unreadable");
      }

      // Triage failure - record the routing decision so the UI can show what to do next.
      if (!parsed.triage.passed) {
        const triageResult = parsed.triage.result || "memory_fact";
        const { data: triageFinalized, error: triageError } = await supabase.rpc(
          "finalize_generate_skill_export_triage",
          {
            p_run_id: generateRunId,
            p_skill_export_id: crypto.randomUUID(),
            p_export: {
              skill_name: skillNameHint || "(triage routed)",
              description: parsed.triage.reasoning || "",
              transcript,
              triage_result: triageResult,
            },
            p_stage_detail: { triage_result: triageResult, passes: pass },
            p_capability: rpcCapability,
          },
        );
        if (triageError || !triageFinalized) {
          if ((triageError?.message ?? "").includes("generate_skill_export_stale_source")) {
            throw new Error("source_changed_retry");
          }
          throw new Error(`triage_finalization_failed:${triageError?.code ?? "unknown"}`);
        }
        markFailed = null;

        return jsonResponse({
          run_id: generateRunId,
          triage: {
            passed: false,
            result: triageResult,
            reasoning: parsed.triage.reasoning || "",
          },
          idempotent: triageFinalized.already_finalized === true,
        }, 200);
      }

      const skill = parsed.skill;
      if (!skill || !skill.name || !skill.description || !skill.body) {
        throw new Error("skill_generation_incomplete");
      }

      const zipInput: BuildSkillZipInput = {
        name: skill.name,
        description: skill.description,
        body: skill.body,
        references: skill.references || [],
        testPrompts: skill.test_prompts || [],
        archetype: skill.archetype,
        client: user.email || undefined,
        surface: targets?.surface ?? null,
        criteria: targets?.packageCriteria ?? [],
        evidence: targets?.packageEvidence ?? [],
        exemplars: gradedWork.exemplars,
        holdout: gradedWork.holdout,
        // From releaseVerdict, never from the existence of a rubric. A package
        // whose criteria have never been measured is a Draft even though the
        // criteria are real, because "compiled" and "shown to work" are two
        // different claims and only one of them was earned.
        status: releaseContext.release.label,
        // Provenance at the package level. Both fields existed on the input
        // type and neither was ever populated, so every package shipped
        // frontmatter that could not answer "where did this come from" or
        // "what was measured". Null stays null: an absent built_from is the
        // honest reading of a package with no compiled standard behind it, and
        // an absent baseline is the honest reading of one nothing has scored.
        builtFrom: targets?.sortRunId
          ? `sort ${targets.sortRunId}, criteria v${releaseContext.criteriaVersion}`
          : null,
        baseline: threeNumbers(releaseContext.release),
      };
      pkg = packageFromZipInput(zipInput);

      // CH-16. The gate reads the rule-bearing files only, with every verbatim
      // span blanked first: the evidence quotes it was handed, plus the fenced
      // exemplar blocks the package itself carries. exemplars/ and evals/ are
      // not in the gated set at all. No gate mutates a quoted span; a slop check
      // may only report.
      const quotes = [
        ...(targets?.options.evidenceQuotes ?? []),
        ...verbatimSpans(pkg),
      ];
      gateQuotes = quotes;
      const files = gatedFiles(pkg);

      // Prepare the transcript spans this package cites before the gate reads
      // the id sets. The rows are committed with the package, never ahead of it.
      if (targets && targets.pendingSpans.size > 0) {
        const cited = citedEvidenceShortIds(collectClaims(files, quotes));
        const prepared = prepareCitedSpans(
          // The SAME string the spans were sliced from. Passing the full
          // transcript here when the spans came from citableText would store a
          // source the offsets no longer index, which is a silent provenance
          // corruption of exactly the kind CH-13 exists to prevent.
          citableText,
          skill.name,
          targets,
          cited,
          () => crypto.randomUUID(),
          citedSource?.id,
        );
        citedSource = prepared.source ?? citedSource;
        citedEvidence.push(...prepared.evidence);
      }

      // Built after preparation, against the same ids the final transaction
      // will own.
      gateOptions = { ...(targets?.options ?? {}), evidenceQuotes: quotes };
      // Collected once, against the final id sets, so the ledger rows and the
      // gate findings describe the same package. Two collections that disagree
      // is how a record stops being a record.
      claims = collectClaims(files, quotes);
      notEstablished = collectNotEstablished(files, quotes);

      const skillData: SkillData = {
        name: skill.name,
        description: skill.description,
        body: skill.body,
        references: skill.references || [],
        test_prompts: skill.test_prompts || [],
        archetype: skill.archetype,
        voice_profile_present: voiceProfileContext.length > 0,
        provenance: gateOptions,
        packageFiles: files,
      };
      qualityGate = runQualityGate(skillData);
      passLedger.push({ pass, claims, notEstablished });

      // Hard-fail only on the name format check - everything else is either
      // advisory or handled by the regeneration path below.
      const nameCheck = qualityGate.checks.find((c) => c.id === "package.nameFormat");
      if (nameCheck && !nameCheck.passed) {
        throw new Error("skill_name_invalid");
      }

      violations = provenanceViolations(qualityGate.checks);
      offenders = provenanceOffenders(claims, gateOptions, pkg);
      if (!blocking || violations.length === 0) break;
      if (pass >= MAX_GENERATION_PASSES) break;

      log.info("provenance gate blocked, regenerating once", {
        userId: user.id,
        pass,
        violations: violations.length,
        offenders: offenders.length,
      });
    }

    const skill = parsed?.skill;
    if (!parsed || !skill || !pkg || !qualityGate) {
      throw new Error("skill_generation_incomplete");
    }

    // The number this phase exists to move: rules stated without pointing at
    // what they came from, counted across the whole gated package. Read BEFORE
    // the demotion pass and never recomputed, because it measures the GENERATOR
    // and a repair is not allowed to flatter the thing it repaired.
    const everyRuleCitedBefore = qualityGate.checks.find((c) => c.id === "prov.everyRuleCited");
    const baselineUnresolvedClaims = parseUnpointedImperatives(everyRuleCitedBefore?.detail) ?? 0;
    // The denominator, so the acceptance run can check that demoted plus pointed
    // accounts for every imperative rather than trusting the repair.
    const totalImperatives = parseImperativeTotal(everyRuleCitedBefore?.detail) ?? 0;

    // -----------------------------------------------------------------------
    // Stage 7a: demote what still points at nothing (spec 4.7a rule 3)
    // -----------------------------------------------------------------------
    //
    // Demotion is the deterministic enforcement arm of a BLOCKING check, so it
    // fires on exactly the condition that makes prov.* blocking. With nothing
    // citable the checks are advisory by design (no criteria, no evidence, so
    // no rule COULD carry a pointer), and demoting there would rewrite an
    // honest package into a wall of NOT ESTABLISHED for a leader who did
    // nothing wrong. That is not the visible-failure trade it looks like: the
    // finding is still reported, and reporting is what an advisory check is.
    //
    // A genuinely failed load is a different thing from an empty one and must
    // not read as "nothing to cite"; loadPointerTargets logs that as an error
    // of ours rather than a finding about them.
    const demotion = blocking
      ? demoteUnpointedClaims(pkg.files, claims, gateQuotes)
      : { files: pkg.files, demoted: [] };
    const demotedClaims = demotion.demoted.length;
    let unpointedAfterDemotion = baselineUnresolvedClaims;

    if (demotedClaims > 0) {
      pkg = { ...pkg, files: demotion.files };

      // Every demoted rule gets its own ledger row, against the FINAL pass, at
      // resolution marked_awaiting. The pass's existing 'unresolved' row for the
      // same claim_hash stays, so the record reads "the generator left this
      // unsourced, the system demoted it" rather than showing a silent edit.
      const finalEntry = passLedger[passLedger.length - 1];
      if (finalEntry) finalEntry.notEstablished = [...finalEntry.notEstablished, ...demotion.demoted];
    }

    // Asserted, not assumed, and run whenever there was anything to fix - a pass
    // that demoted NOTHING while the baseline was non-zero is the same bug as
    // one that demoted some and missed the rest. Only meaningful where demotion
    // was supposed to run; where it was not, the surviving count IS the
    // advisory finding and reporting it is the correct outcome.
    if (blocking && baselineUnresolvedClaims > 0) {
      const demotedClaimList = collectClaims(gatedFiles(pkg), gateQuotes);
      const recheck = runProvenanceChecksOverClaims(demotedClaimList, gateOptions);
      const everyRuleCited = recheck.find((c) => c.id === "prov.everyRuleCited");
      unpointedAfterDemotion = parseUnpointedImperatives(everyRuleCited?.detail) ?? 0;

      if (!everyRuleCited?.passed) {
        // Not a finding about the leader. The demoter was handed a claim it
        // could not locate, which is our bug, so it is logged as one and the
        // block below stands rather than being reported as a pass.
        log.error("demotion left unpointed rules standing", {
          userId: user.id,
          baseline: baselineUnresolvedClaims,
          demoted: demotedClaims,
          surviving: unpointedAfterDemotion,
          detail: everyRuleCited?.detail,
          claims: unpointedClaims(demotedClaimList)
            .slice(0, 5)
            .map((c) => ({ path: c.path, line: c.line, text: c.text.slice(0, 120) })),
        });
      }

      // The reported gate must describe the package that shipped, not the one
      // that was thrown away. Only the prov.* checks can have moved.
      const byId = new Map(recheck.map((check) => [check.id, check]));
      const checks = qualityGate.checks.map((check) => byId.get(check.id) ?? check);
      qualityGate = {
        checks,
        summary: { passed: checks.filter((c) => c.passed).length, total: checks.length },
      };
      violations = provenanceViolations(checks);
      claims = demotedClaimList;
    }

    // The body the leader is handed back, demoted the same way. It is the same
    // prose the surface leaf carries, so leaving it un-demoted would ship the
    // unsourced wording through the response while the ZIP said otherwise.
    const bodyFile = [{ path: "", content: skill.body }];
    skill.body = demoteUnpointedClaims(
      bodyFile,
      collectClaims(bodyFile, gateQuotes),
      gateQuotes,
    ).files[0]?.content ?? skill.body;

    const provenanceBlocked = Boolean(targets?.hasTargets) && violations.length > 0;

    log.info("provenance result", {
      userId: user.id,
      unpointed_imperatives: baselineUnresolvedClaims,
      demoted_claims: demotedClaims,
      unpointed_after_demotion: unpointedAfterDemotion,
      passes: pass,
      blocked: provenanceBlocked,
      router_lines: routerLineCount(pkg),
      skill_name: skill.name,
    });

    await advanceRun(supabase, generateRunId, "checking", {
      passes: pass,
      baseline_unresolved_claims: baselineUnresolvedClaims,
      demoted_claims: demotedClaims,
      unpointed_after_demotion: unpointedAfterDemotion,
    }, rpcCapability);

    const zipResult = await buildSkillZipFromPackage(pkg, skill.test_prompts || [], skill.name);
    const packageSha256 = await sha256Hex(zipResult.bytes);
    const skillExportId = crypto.randomUUID();
    const artifactId = crypto.randomUUID();
    const zipPath = `${user.id}/${generateRunId}-${skill.name}.zip`;

    await advanceRun(supabase, generateRunId, "packaging", {
      package_sha256: packageSha256,
      package_bytes: zipResult.byteLength,
    }, rpcCapability);

    // The object must exist before the database records may point at it. If
    // the atomic finalization fails, the catch path removes this orphan.
    const { error: uploadError } = await supabase.storage
      .from("skill-packages")
      .upload(zipPath, zipResult.bytes, {
        contentType: "application/zip",
        upsert: false,
      });
    if (uploadError) throw new Error(`skill_package_upload_failed:${uploadError.message}`);
    removeUploaded = async () => {
      await supabase.storage.from("skill-packages").remove([zipPath]);
    };

    const provenanceRows = targets
      ? passLedger.flatMap((entry) =>
          buildProvenanceRows({
            userId: user.id,
            artifactId,
            pass: entry.pass,
            claims: entry.claims,
            notEstablished: entry.notEstablished,
            targets,
          }).map(({ user_id: _userId, ...row }) => row)
        )
      : [];
    const memoryLinkRows = targets
      ? buildMemoryLinkRows(user.id, artifactId, citedMemoryFactIds(claims, targets))
          .map(({ user_id: _userId, ...row }) => row)
      : [];

    const artifactMetadata = {
      archetype: skill.archetype || null,
      zip_filename: `${skill.name}.zip`,
      zip_path: zipPath,
      test_prompts: skill.test_prompts || [],
      provider: providerFromModel(lastModel),
      model: lastModel,
      package_files: pkg.files.map((f) => f.path),
      router_lines: routerLineCount(pkg),
      provenance_passes: pass,
      provenance_blocked: provenanceBlocked,
      baseline_unresolved_claims: baselineUnresolvedClaims,
      total_imperatives: totalImperatives,
      demoted_claims: demotedClaims,
      unpointed_after_demotion: unpointedAfterDemotion,
      surface: targets?.surface ?? null,
      criteria_version: releaseContext.criteriaVersion,
      rendered_at: releaseContext.renderedAt,
      release: {
        label: releaseContext.release.label,
        reason: releaseContext.release.reason,
        numbers: releaseContext.release.numbers,
      },
    };
    const { data: finalized, error: finalizeError } = await supabase.rpc(
      "finalize_generate_skill_export_run",
      {
        p_run_id: generateRunId,
        p_skill_export_id: skillExportId,
        p_artifact_id: artifactId,
        p_export: {
          skill_name: skill.name,
          description: skill.description,
          transcript,
          triage_result: "skill",
          body_content: skill.body,
          references_json: skill.references || [],
          test_prompts: skill.test_prompts || [],
          quality_gate: qualityGate,
          archetype: skill.archetype || "",
          version: 1,
          zip_path: zipPath,
          package_sha256: packageSha256,
        },
        p_artifact: {
          name: skill.name,
          body: flattenPackageForPull(pkg),
          metadata: artifactMetadata,
        },
        p_cited_source: citedSource,
        p_cited_evidence: citedEvidence,
        p_provenance: provenanceRows,
        p_memory_links: memoryLinkRows,
        p_stage_detail: {
          passes: pass,
          provenance_blocked: provenanceBlocked,
          quality_passed: qualityGate.summary.passed,
          quality_total: qualityGate.summary.total,
        },
        p_capability: rpcCapability,
      },
    );
    if (finalizeError || !finalized) {
      const message = finalizeError?.message ?? "unknown";
      if (message.includes("generate_skill_export_stale_source")) {
        throw new Error("source_changed_retry");
      }
      throw new Error(`skill_export_finalization_failed:${finalizeError?.code ?? "unknown"}`);
    }
    removeUploaded = null;
    markFailed = null;

    return jsonResponse({
      run_id: generateRunId,
      triage: parsed.triage,
      skill: {
        id: skillExportId,
        name: skill.name,
        description: skill.description,
        body: skill.body,
        references: skill.references || [],
        test_prompts: skill.test_prompts || [],
        gotchas: skill.gotchas || [],
        archetype: skill.archetype || null,
      },
      quality_gate: qualityGate,
      // What the delivery screen is allowed to say about this package: the
      // label, the sentence behind it, and the numbers with their provenance.
      // Sent with the response so the payoff screen needs no second read.
      release: {
        label: releaseContext.release.label,
        reason: releaseContext.release.reason,
        numbers: releaseContext.release.numbers,
        criteria_version: releaseContext.criteriaVersion,
        rendered_at: releaseContext.renderedAt,
      },
      // The generator's reading, before any repair. Never recomputed.
      baseline_unresolved_claims: baselineUnresolvedClaims,
      // The denominator that reading came out of, so demoted + pointed can be
      // checked against it instead of taken on trust.
      total_imperatives: totalImperatives,
      // What stage 7a rewrote, and what survived it. The pair is the honest
      // sentence: "the generator left N unsourced; the system demoted all N;
      // zero unsourced rules shipped."
      demoted_claims: demotedClaims,
      unpointed_after_demotion: unpointedAfterDemotion,
      // Never a bare rejection (spec 4.5). When two passes could not clear the
      // gate the package still ships, and this is what the leader is shown so
      // they can decide whether to keep it, edit it, or say more.
      provenance: {
        blocked: provenanceBlocked,
        passes: pass,
        violations,
        message: provenanceMessage(demotedClaims, provenanceBlocked),
      },
      package_files: pkg.files.map((f) => f.path),
      zip_base64: zipResult.base64,
      zip_filename: `${skill.name}.zip`,
      zip_byte_length: zipResult.byteLength,
      package_sha256: packageSha256,
      artifact_id: artifactId,
      created_at: new Date().toISOString(),
      idempotent: finalized.already_finalized === true,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "skill_export_failed";
    if (removeUploaded) await removeUploaded().catch(() => undefined);
    if (markFailed) await markFailed(message).catch(() => undefined);
    console.error("generate-skill-export error:", message);
    if (message === "source_changed_retry") return jsonResponse({ error: message }, 409);
    if (message === "skill_generation_unreadable" || message === "skill_generation_incomplete" || message === "skill_name_invalid") {
      return jsonResponse({ error: message }, 502);
    }
    return jsonResponse({ error: "skill_export_failed" }, 500);
  }
});

/**
 * What the leader is told, in plain words, about what happened to their rules.
 *
 * Two separate facts, and the demotion one is said first because it describes
 * the package in their hands: some rules had nothing behind them, so the package
 * says so instead of stating them as fact. The second sentence only appears when
 * something is still standing that they may want to act on.
 */
function provenanceMessage(demoted: number, blocked: boolean): string | null {
  const parts: string[] = [];
  if (demoted > 0) {
    parts.push(
      demoted === 1
        ? "1 rule had nothing to point at, so it is marked NOT ESTABLISHED in the package rather " +
          "than stated as fact."
        : `${demoted} rules had nothing to point at, so they are marked NOT ESTABLISHED in the ` +
          "package rather than stated as fact.",
    );
  }
  if (blocked) {
    parts.push(
      "Some rules still do not point at anything you said or graded. They are listed above. Keep " +
        "the skill, edit those lines, or tell me more about where they came from.",
    );
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

/** The prov.* findings, as the sentences the regeneration prompt is handed. */
function provenanceViolations(checks: QualityCheck[]): string[] {
  return checks
    .filter((check) => (PROVENANCE_CHECK_IDS as readonly string[]).includes(check.id))
    .filter((check) => !check.passed)
    .map((check) => `${check.id}: ${check.detail ?? check.label}`);
}

/**
 * The individual lines behind those findings, in terms the generator can act on.
 *
 * Two rules here, and both come from watching a single unpointed imperative
 * survive two passes:
 *
 * 1. A finding is only worth sending if the generator can locate it. It writes
 *    `body` and `references[]`, not package paths, so the package path is
 *    translated into what it actually authored.
 * 2. A finding in a file the PACKAGER wrote (the router, core.md, general.md) is
 *    not the generator's to fix, and asking it to would invite a rewrite of a
 *    file it does not control. Those stay in the violations summary and out of
 *    the edit list.
 */
function provenanceOffenders(
  claims: LocatedClaim[],
  opts: ProvenanceOptions,
  pkg: SkillPackage,
): ProvenanceOffender[] {
  const surfaceLeaf = surfaceLeafPath(pkg);
  const authored = (path: string): string | null => {
    if (path && path === surfaceLeaf) return "the skill body";
    if (path.startsWith("references/")) return `the reference file ${path}`;
    return null;
  };

  const out: ProvenanceOffender[] = [];
  const push = (
    claim: LocatedClaim,
    finding: ProvenanceOffender["finding"],
    note?: string,
  ) => {
    const where = authored(claim.path ?? "");
    if (!where) return;
    out.push({ finding, where, path: claim.path, line: claim.line, text: claim.text, note });
  };

  for (const claim of unpointedClaims(claims)) push(claim, "unpointed");
  for (const { claim, unresolved } of unresolvedPointerClaims(claims, opts)) {
    push(
      claim,
      "unresolved",
      unresolved.map((p) => `[${p.kind === "criterion" ? "C" : "E"}${p.id}]`).join(", "),
    );
  }
  if (Array.isArray(opts.situatedEvidenceIds)) {
    for (const claim of situatedGeneralisationOffenders(claims, opts.situatedEvidenceIds)) {
      push(claim, "situated", claim.scope ? `this leaf covers: ${claim.scope.appliesTo}` : undefined);
    }
  }
  return out;
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
