/**
 * capture-week: governed runtime learning.
 *
 * This route may publish owner proposals against an exact source snapshot. It
 * cannot edit criteria, standards, skills or releases. A later owner decision
 * authorises a versioned change request; it still does not apply the change.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { hasExactServiceCredential } from "../_shared/service-auth.ts";
import { isCronRequest } from "../_shared/service-request.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";
import {
  buildProposal,
  captureCadenceDue,
  isoWeekOf,
  weeklyPass,
  type Candidate,
  type CriterionRow,
  type LedgerRow,
  type ProposalRow,
} from "../_shared/capture-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ctrl-cron-secret",
};
const MAX_REQUEST_BYTES = 4_096;
const MAX_POLICY_OWNERS = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WEEK = /^\d{4}-W\d{2}$/;
const REQUEST_KEYS = new Set(["capture_week", "dry_run", "user_id"]);

interface CapturePolicy {
  user_id: string;
  enabled: boolean;
  cadence_days: number;
  window_weeks: number;
  min_unique_evidence: number;
  max_proposals: number;
  severity_override: boolean;
  privacy_boundary: string;
  retention_days: number | null;
}

interface CaptureSource {
  schema: string;
  owner_id: string;
  capture_week: string;
  window: { from: string; through: string };
  policy: CapturePolicy;
  standard: { id?: string; body_sha256?: string; metadata?: Record<string, unknown>; created_at?: string };
  criteria: Array<CriterionRow & { version?: number; observable?: string | null }>;
  ledger: LedgerRow[];
  opportunities: Array<{ run_id: string; surface: string | null; created_at: string; source_snapshot: string | null }>;
  proposal_history: Array<{ id: string; key: string; version: number; hash: string; status: string; source_ids: string[] }>;
  latest_measurement: {
    id?: string;
    label?: string;
    created_at?: string;
    standard_artifact_id?: string;
    metrics?: Record<string, unknown>;
    confusion?: Record<string, unknown>;
    held_out_graded?: number;
  };
}

interface SourcePacket { source: CaptureSource; snapshot: string }
type PublishedProposal = Omit<ProposalRow, "user_id" | "status"> & {
  proposal_key: string;
  governance: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const log = createLogger("capture-week");
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
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
      if (error instanceof Error && error.message === "request_too_large") return json({ error: "request_too_large" }, 413);
      return json({ error: "invalid_json" }, 400);
    }
    if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) return json({ error: "unexpected_field" }, 400);

    const captureSecret = Deno.env.get("CAPTURE_WEEK_SECRET") ?? "";
    const cronSecret = Deno.env.get("CTRL_CRON_SECRET") ?? "";
    const authorised = hasExactServiceCredential(req.headers.get("Authorization"), [captureSecret]) ||
      isCronRequest(req.headers.get("X-CTRL-Cron-Secret"), cronSecret);
    if (!authorised || (captureSecret.length < 32 && cronSecret.length < 32)) return json({ error: "Forbidden" }, 403);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const expectedRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedRef)) return json({ error: "database_configuration_error" }, 503);
    if (!serviceKey) return json({ error: "capture_configuration_error" }, 503);

    const captureWeek = typeof payload.capture_week === "string" ? payload.capture_week.trim() : isoWeekOf(new Date());
    if (!WEEK.test(captureWeek)) return json({ error: "invalid_capture_week" }, 400);
    const dryRun = payload.dry_run === true;
    const onlyUser = typeof payload.user_id === "string" ? payload.user_id.trim() : "";
    if (onlyUser && !UUID.test(onlyUser)) return json({ error: "invalid_user_id" }, 400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) as SupabaseClient;
    let policyQuery = admin
      .from("capture_policies")
      .select("user_id, enabled, cadence_days, window_weeks, min_unique_evidence, max_proposals, severity_override, privacy_boundary, retention_days")
      .eq("enabled", true)
      .order("user_id")
      .limit(MAX_POLICY_OWNERS);
    if (onlyUser) policyQuery = policyQuery.eq("user_id", onlyUser);
    const { data: policyRows, error: policyError } = await policyQuery;
    if (policyError) throw new Error(`capture_policy_read_failed:${policyError.code ?? "unknown"}`);

    const outcomes: Array<Record<string, unknown>> = [];
    let published = 0;
    let errors = 0;
    for (const policy of (policyRows ?? []) as CapturePolicy[]) {
      try {
        const outcome = await captureOwner(admin, policy, captureWeek, dryRun);
        outcomes.push(outcome);
        published += Number(outcome.published ?? 0);
      } catch (error) {
        errors += 1;
        const reason = safeError(error);
        outcomes.push({ owner_id: policy.user_id, status: "failed", error: reason });
        log.warn("owner capture failed", { owner_id: policy.user_id, error: reason });
      }
    }

    return json({
      capture_week: captureWeek,
      dry_run: dryRun,
      owners_configured: (policyRows ?? []).length,
      owners_capped: (policyRows ?? []).length >= MAX_POLICY_OWNERS,
      published,
      errors,
      outcomes,
      criteria_changed: 0,
      standards_changed: 0,
      releases_changed: 0,
    });
  } catch (error) {
    log.error("capture failed", { error: safeError(error) });
    return json({ error: "capture_week_failed" }, 500);
  }
});

async function captureOwner(
  admin: SupabaseClient,
  policy: CapturePolicy,
  captureWeek: string,
  dryRun: boolean,
): Promise<Record<string, unknown>> {
  const { data: recentRuns, error: recentRunError } = await admin
    .from("capture_runs")
    .select("capture_week, created_at")
    .eq("user_id", policy.user_id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (recentRunError) throw new Error(`capture_cadence_read_failed:${recentRunError.code ?? "unknown"}`);
  const latest = recentRuns?.[0] as { capture_week?: string; created_at?: string } | undefined;
  const cadence = captureCadenceDue(
    latest?.capture_week && latest.created_at
      ? { captureWeek: latest.capture_week, createdAt: latest.created_at }
      : null,
    captureWeek,
    policy.cadence_days,
    new Date(),
  );
  if (!cadence.due) {
    return {
      owner_id: policy.user_id,
      status: "not_due",
      reason: cadence.reason,
      next_due_at: cadence.nextDueAt,
      published: 0,
    };
  }

  const { data, error } = await admin.rpc("current_capture_source_packet", {
    p_user_id: policy.user_id,
    p_capture_week: captureWeek,
    p_window_weeks: policy.window_weeks,
  });
  if (error || !data) throw new Error(`capture_source_failed:${error?.code ?? "unknown"}`);
  const packet = data as SourcePacket;
  if (!packet.source || !/^[0-9a-f]{64}$/.test(packet.snapshot)) throw new Error("capture_source_packet_invalid");
  const source = packet.source;
  if (!source.standard?.id || !source.standard.body_sha256 || source.criteria.length === 0) {
    return {
      owner_id: policy.user_id,
      status: "governance_gap",
      reason: "An active compiled standard is required before runtime evidence can propose changing it.",
      published: 0,
    };
  }

  const opportunityBySurface = new Map<string, number>();
  const seenOpportunities = new Set<string>();
  for (const opportunity of source.opportunities ?? []) {
    if (!opportunity.surface || seenOpportunities.has(opportunity.run_id)) continue;
    seenOpportunities.add(opportunity.run_id);
    opportunityBySurface.set(opportunity.surface, (opportunityBySurface.get(opportunity.surface) ?? 0) + 1);
  }
  const awaiting = new Set(
    (source.proposal_history ?? []).filter((proposal) => proposal.status === "awaiting").map((proposal) => proposal.key),
  );
  const pass = weeklyPass({
    rows: source.ledger ?? [],
    criteria: source.criteria ?? [],
    nowWeek: captureWeek,
    policy: { windowWeeks: policy.window_weeks, minUniqueEvidence: policy.min_unique_evidence },
    opportunityBySurface,
    alreadyProposed: awaiting,
  });

  const countBySurface = new Map<string, number>();
  for (const criterion of source.criteria) {
    if (criterion.disposition === "retired") continue;
    countBySurface.set(criterion.surface, (countBySurface.get(criterion.surface) ?? 0) + 1);
  }
  const chosen = pass.candidates.slice(0, policy.max_proposals);
  const proposals = chosen.map((candidate) => governedProposal(
    candidate,
    buildProposal(candidate, countBySurface.get(candidate.surface) ?? 0),
    source,
    policy,
    packet.snapshot,
  ));

  const measurement = source.latest_measurement ?? {};
  const measurementCurrent = measurement.standard_artifact_id === source.standard.id;
  const summary = {
    schema: "ctrl.capture.result.v1",
    snapshot: packet.snapshot,
    owner_id: policy.user_id,
    policy: {
      cadence_days: policy.cadence_days,
      window_weeks: policy.window_weeks,
      min_unique_evidence: policy.min_unique_evidence,
      max_proposals: policy.max_proposals,
      cadence_reason: cadence.reason,
      severity_override_used: false,
    },
    counts: {
      ledger_rows: pass.rowsRead,
      stable_unique_evidence: pass.uniqueEvidenceRead,
      applicable_review_opportunities: seenOpportunities.size,
      candidates: pass.candidates.length,
      selected: proposals.length,
      held_for_later: Math.max(0, pass.candidates.length - proposals.length),
      method_candidates: pass.methodStrikes.length,
      routing_candidates: pass.triggerStrikes.length,
    },
    non_candidates: {
      freshness_unknown_surfaces: pass.freshnessUnknown,
      reason: pass.freshnessUnknown.length > 0
        ? "No freshness inference was made where applicable review exposure was below policy."
        : null,
    },
    measurement: {
      current: measurementCurrent,
      label: measurementCurrent ? measurement.label ?? null : null,
      measured_at: measurementCurrent ? measurement.created_at ?? null : null,
      next: measurementCurrent ? "monitor_comparable_exposure" : "new_untouched_holdout_required",
      reused_holdout_claimed_fresh: false,
    },
    writes: dryRun ? "none_dry_run" : "proposal_packets_only",
  };

  if (dryRun) {
    return { owner_id: policy.user_id, status: "dry_run", candidates: proposals.length, published: 0, summary };
  }
  const { data: published, error: publishError } = await admin.rpc("publish_capture_run", {
    p_user_id: policy.user_id,
    p_capture_week: captureWeek,
    p_source_snapshot: packet.snapshot,
    p_summary: summary,
    p_proposals: proposals,
  });
  if (publishError || !published) {
    if (publishError?.message?.includes("source_changed_retry")) throw new Error("source_changed_retry");
    throw new Error(`capture_publish_failed:${publishError?.code ?? "unknown"}`);
  }
  return {
    owner_id: policy.user_id,
    status: "ready",
    run_id: published.run_id,
    idempotent: published.idempotent === true,
    published: Number(published.inserted ?? 0),
    deduplicated: Number(published.skipped ?? 0),
    summary,
  };
}

function governedProposal(
  candidate: Candidate,
  proposal: ProposalRow,
  source: CaptureSource,
  policy: CapturePolicy,
  snapshot: string,
): PublishedProposal {
  const evidence = proposal.evidence as Record<string, unknown>;
  const explanations = candidate.type === "false_positive"
    ? ["criterion_scope", "criterion_wording", "reviewer_implementation", "stale_release", "unusual_artifact"]
    : candidate.type === "uncovered"
    ? ["genuinely_missing_standard", "one_surface_exception", "reviewer_omission", "insufficient_grading"]
    : ["preventative_rule_working", "work_mix_changed", "rule_not_applied", "problem_resolved", "insufficient_exposure"];
  return {
    type: proposal.type,
    surface: proposal.surface,
    headline: proposal.headline,
    delta_text: proposal.delta_text,
    if_wrong: proposal.if_wrong,
    size_delta: proposal.size_delta,
    evidence,
    proposal_key: candidate.key,
    governance: {
      snapshot: { schema: source.schema, sha256: snapshot, evidence_ids: evidence.source_ids ?? [] },
      owner: { id: source.owner_id, decision_rights: "named_standard_owner" },
      policy: {
        cadence_days: policy.cadence_days,
        window_weeks: policy.window_weeks,
        minimum_unique_evidence: policy.min_unique_evidence,
        severity_override: policy.severity_override,
      },
      standard: {
        artifact_id: source.standard.id,
        sha256: source.standard.body_sha256,
        criteria_version: source.standard.metadata?.criteria_version ?? null,
      },
      current_source: candidate.type === "uncovered"
        ? { exact_clause: null, status: "not_present" }
        : { criterion_id: candidate.criterionId, criterion_name: candidate.criterionName },
      alternative_explanations: explanations,
      expected_effect: candidate.type === "false_positive"
        ? "Comparable owner-rejected flags decline without new false negatives."
        : candidate.type === "uncovered"
        ? "The repeated need becomes testable without broadening beyond the evidenced surface."
        : "The owner distinguishes preventative value, implementation failure and genuine retirement.",
      validation: {
        focused_cases: evidence.source_ids ?? [],
        full_regression_required: true,
        fresh_independent_check_required: true,
        release_parity_required: true,
      },
      size_context: evidence.size ?? {},
      privacy: {
        boundary: policy.privacy_boundary,
        retention_days: policy.retention_days,
        durable_quotes_copied: false,
      },
      dependencies: ["ctrl-compile", "ctrl-build", "fresh-ctrl-check", "harness-maintainer"],
      rollback: {
        prior_known_good: source.standard.id,
        prior_sha256: source.standard.body_sha256,
        automatic: false,
      },
      measurement_plan: {
        compare_under_equivalent_exposure: true,
        track: ["false_positives", "false_negatives", "recurrence", "routing_misses"],
        fresh_holdout_for_new_unbiased_claim: true,
        reused_holdout_is_regression_only: true,
      },
    },
  };
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "capture_failed");
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 180);
}
