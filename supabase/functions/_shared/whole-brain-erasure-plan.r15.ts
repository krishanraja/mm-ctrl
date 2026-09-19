export type ErasureCoveragePlane =
  | "canonical_brain"
  | "prepared_intelligence"
  | "legacy_memory_and_decisions"
  | "briefings_news_and_audio"
  | "exports_and_skills"
  | "mcp_and_access"
  | "logs_caches_and_analytics"
  | "external_processors"
  | "backups_observability_and_devices";

export type ErasureController = "ctrl" | "processor" | "customer";

export type ErasureAction =
  | "revoke_access"
  | "delete_rows"
  | "delete_objects"
  | "request_processor_deletion"
  | "expire_under_retention"
  | "customer_action";

export interface ErasureTarget {
  target_id: string;
  coverage_plane: ErasureCoveragePlane;
  controller: ErasureController;
  action: ErasureAction;
  proof_kind: "zero_rows" | "zero_objects" | "revoked" | "provider_receipt" | "retention_receipt" | "customer_acknowledgement";
}

export interface WholeBrainErasurePolicy {
  retained_audit:
    | { mode: "unbound" }
    | { mode: "no_retention" }
    | { mode: "pseudonymised_receipt"; retention_days: number };
  customer_controlled_copies:
    | { mode: "unbound" }
    | { mode: "plain_language_action"; exact_language: string };
  partial_completion: "unbound" | "hard_failure" | "resumable_pending";
}

export interface WholeBrainErasurePlanInput {
  request_id: string;
  workspace_id: string;
  subject_id: string;
  requested_at: string;
  policy: WholeBrainErasurePolicy;
  targets: ErasureTarget[];
}

export type WholeBrainErasurePlanResult =
  | { status: "held"; reasons: string[] }
  | {
      status: "ready";
      plan: {
        schema_version: "ctrl.whole-brain-erasure-plan.r15";
        request_id: string;
        workspace_id: string;
        subject_id: string;
        requested_at: string;
        ordered_targets: Array<ErasureTarget & { stage: 0 | 1 | 2 | 3 | 4 }>;
        retained_audit: { mode: "no_retention" } | { mode: "pseudonymised_receipt"; retention_days: number };
        customer_copy_language: string | null;
        partial_completion: "hard_failure" | "resumable_pending";
      };
    };

export interface ErasureTargetResult {
  target_id: string;
  outcome: "proved" | "pending" | "failed" | "action_required";
  proof_ref: string | null;
}

export type ErasureCompletionResult =
  | { status: "invalid"; reasons: string[] }
  | { status: "failed"; failed_target_ids: string[] }
  | { status: "pending"; pending_target_ids: string[] }
  | { status: "ctrl_erased_customer_action_required"; customer_target_ids: string[] }
  | { status: "complete" };

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export const REQUIRED_ERASURE_PLANES: readonly ErasureCoveragePlane[] = [
  "canonical_brain",
  "prepared_intelligence",
  "legacy_memory_and_decisions",
  "briefings_news_and_audio",
  "exports_and_skills",
  "mcp_and_access",
  "logs_caches_and_analytics",
  "external_processors",
  "backups_observability_and_devices",
] as const;

function validToken(value: string): boolean {
  return TOKEN.test(value);
}

function stageFor(target: ErasureTarget): 0 | 1 | 2 | 3 | 4 {
  if (target.action === "revoke_access") return 0;
  if (target.controller === "ctrl" && target.action !== "expire_under_retention") return 1;
  if (target.controller === "processor" && target.action !== "expire_under_retention") return 2;
  if (target.action === "expire_under_retention") return 3;
  return 4;
}

export function buildWholeBrainErasurePlan(input: WholeBrainErasurePlanInput): WholeBrainErasurePlanResult {
  const reasons: string[] = [];

  if (!validToken(input.request_id)) reasons.push("invalid_request_id");
  if (!validToken(input.workspace_id)) reasons.push("invalid_workspace_id");
  if (!validToken(input.subject_id)) reasons.push("invalid_subject_id");
  if (!ISO_INSTANT.test(input.requested_at) || Number.isNaN(Date.parse(input.requested_at))) {
    reasons.push("invalid_requested_at");
  }

  if (input.policy.retained_audit.mode === "unbound") reasons.push("retained_audit_policy_unbound");
  if (input.policy.retained_audit.mode === "pseudonymised_receipt" &&
      (!Number.isInteger(input.policy.retained_audit.retention_days) || input.policy.retained_audit.retention_days < 1)) {
    reasons.push("invalid_retention_days");
  }
  if (input.policy.customer_controlled_copies.mode === "unbound") reasons.push("customer_copy_language_unbound");
  if (input.policy.customer_controlled_copies.mode === "plain_language_action" &&
      input.policy.customer_controlled_copies.exact_language.trim().length < 20) {
    reasons.push("customer_copy_language_too_vague");
  }
  if (input.policy.partial_completion === "unbound") reasons.push("partial_completion_policy_unbound");

  const targetIds = new Set<string>();
  const presentPlanes = new Set<ErasureCoveragePlane>();
  let hasAccessRevocation = false;

  for (const target of input.targets) {
    if (!validToken(target.target_id)) reasons.push("invalid_target_id");
    if (targetIds.has(target.target_id)) reasons.push(`duplicate_target:${target.target_id}`);
    targetIds.add(target.target_id);
    presentPlanes.add(target.coverage_plane);
    if (target.action === "revoke_access") hasAccessRevocation = true;
    if (target.action === "revoke_access" && target.controller !== "ctrl") {
      reasons.push(`access_revocation_not_ctrl_controlled:${target.target_id}`);
    }
    if (target.controller === "customer" && target.action !== "customer_action") {
      reasons.push(`customer_target_not_action_only:${target.target_id}`);
    }
    if (target.action === "customer_action" && target.controller !== "customer") {
      reasons.push(`customer_action_wrong_controller:${target.target_id}`);
    }
    if (target.action === "customer_action" && target.proof_kind !== "customer_acknowledgement") {
      reasons.push(`customer_action_missing_acknowledgement:${target.target_id}`);
    }
    if (target.action === "request_processor_deletion" && target.controller !== "processor") {
      reasons.push(`processor_deletion_wrong_controller:${target.target_id}`);
    }
    if (target.action === "request_processor_deletion" && target.proof_kind !== "provider_receipt") {
      reasons.push(`processor_deletion_missing_receipt:${target.target_id}`);
    }
    if (target.action === "expire_under_retention" && target.proof_kind !== "retention_receipt") {
      reasons.push(`retention_target_missing_receipt:${target.target_id}`);
    }
  }

  for (const plane of REQUIRED_ERASURE_PLANES) {
    if (!presentPlanes.has(plane)) reasons.push(`coverage_plane_missing:${plane}`);
  }
  if (!hasAccessRevocation) reasons.push("access_revocation_target_missing");

  if (reasons.length > 0) return { status: "held", reasons: [...new Set(reasons)].sort() };

  const retainedAudit = input.policy.retained_audit;
  if (retainedAudit.mode === "unbound") return { status: "held", reasons: ["retained_audit_policy_unbound"] };
  const customerCopyLanguage = input.policy.customer_controlled_copies.mode === "plain_language_action"
    ? input.policy.customer_controlled_copies.exact_language.trim()
    : null;
  const partialCompletion = input.policy.partial_completion;
  if (partialCompletion === "unbound") return { status: "held", reasons: ["partial_completion_policy_unbound"] };

  const orderedTargets = input.targets
    .map((target) => ({ ...target, stage: stageFor(target) }))
    .sort((left, right) => left.stage - right.stage || left.target_id.localeCompare(right.target_id));

  return {
    status: "ready",
    plan: {
      schema_version: "ctrl.whole-brain-erasure-plan.r15",
      request_id: input.request_id,
      workspace_id: input.workspace_id,
      subject_id: input.subject_id,
      requested_at: input.requested_at,
      ordered_targets: orderedTargets,
      retained_audit: retainedAudit,
      customer_copy_language: customerCopyLanguage,
      partial_completion: partialCompletion,
    },
  };
}

export function evaluateWholeBrainErasureCompletion(
  plan: Extract<WholeBrainErasurePlanResult, { status: "ready" }>["plan"],
  results: ErasureTargetResult[],
): ErasureCompletionResult {
  const reasons: string[] = [];
  const expected = new Map(plan.ordered_targets.map((target) => [target.target_id, target]));
  const seen = new Set<string>();

  for (const result of results) {
    if (!expected.has(result.target_id)) reasons.push(`unknown_target:${result.target_id}`);
    if (seen.has(result.target_id)) reasons.push(`duplicate_result:${result.target_id}`);
    seen.add(result.target_id);
    if (result.outcome === "proved" && (!result.proof_ref || !validToken(result.proof_ref))) {
      reasons.push(`proved_without_valid_proof:${result.target_id}`);
    }
  }

  for (const targetId of expected.keys()) {
    if (!seen.has(targetId)) reasons.push(`missing_result:${targetId}`);
  }
  if (reasons.length > 0) return { status: "invalid", reasons: [...new Set(reasons)].sort() };

  const failed = results.filter((result) => result.outcome === "failed").map((result) => result.target_id).sort();
  if (failed.length > 0 && plan.partial_completion === "hard_failure") {
    return { status: "failed", failed_target_ids: failed };
  }

  const pending = results
    .filter((result) => result.outcome === "pending" || result.outcome === "failed")
    .map((result) => result.target_id)
    .sort();
  if (pending.length > 0) return { status: "pending", pending_target_ids: pending };

  const customerActions = results
    .filter((result) => result.outcome === "action_required")
    .map((result) => result.target_id)
    .sort();
  if (customerActions.length > 0) {
    return { status: "ctrl_erased_customer_action_required", customer_target_ids: customerActions };
  }

  return { status: "complete" };
}
