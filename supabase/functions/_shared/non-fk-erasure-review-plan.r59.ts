export type NonFkErasureAction =
  | "delete_subject_row_by_auth_id"
  | "delete_subject_row_by_verified_email"
  | "delete_participant_row_by_verified_email"
  | "delete_participant_row_by_auth_id"
  | "delete_membership_row_by_auth_id"
  | "delete_legacy_subject_row_by_auth_id_or_verified_email"
  | "erase_with_selected_subject_row"
  | "redact_actor_attribution"
  | "pseudonymize_retained_audit_identity"
  | "redact_shared_record_role_bundle";

export interface NonFkErasureRegistryTarget {
  key: string;
  action: NonFkErasureAction;
  standing: string;
  live_coverage: string;
  companions: string[];
  reason: string;
}

export interface NonFkErasureRegistry {
  schema_version: string;
  registry_id: string;
  status: string;
  targets: NonFkErasureRegistryTarget[];
  execution_gate: { status: string };
}

export interface NonFkErasureDraftStep {
  target_key: string;
  action: NonFkErasureAction;
  selector_authority:
    | "subject.auth_user_id"
    | "subject.verified_email"
    | "subject.auth_user_id_then_verified_email"
    | "authorized_parent_row";
  effect: "delete_subject_row" | "delete_participant_row" | "delete_membership" | "erase_with_parent" | "redact_attribution";
  requires: string[];
}

export type NonFkErasureReviewPlanResult =
  | { status: "invalid"; reasons: string[] }
  | {
      status: "held";
      plan: {
        schema_version: "ctrl.non-fk-erasure-review-plan.r59";
        registry_id: string;
        execution_authority: "none";
        coverage: {
          discovered_targets: number;
          dispositioned_targets: number;
          draft_targets: number;
          blocked_targets: number;
        };
        hold_reasons: string[];
        blocked_targets: Array<{ target_key: string; standing: string; reason: string }>;
        draft_steps: NonFkErasureDraftStep[];
      };
    };

const TARGET_KEY = /^[a-z][a-z0-9_]{0,62}\.[a-z][a-z0-9_]{0,62}$/;
const BLOCKING_STANDINGS = new Set([
  "blocks_alternate_anchor_coverage",
  "blocks_participant_erasure_design",
  "blocks_shared_record_policy",
  "blocks_retention_policy",
  "blocks_schema_reconciliation",
]);
const DRAFT_STANDING = "classified_implementation_unverified";

function draftStep(target: NonFkErasureRegistryTarget): NonFkErasureDraftStep | null {
  const base = { target_key: target.key, action: target.action };
  switch (target.action) {
    case "delete_subject_row_by_auth_id":
      return { ...base, selector_authority: "subject.auth_user_id", effect: "delete_subject_row", requires: ["exact_account_uuid_match", "zero_rows_proof"] };
    case "delete_subject_row_by_verified_email":
      return { ...base, selector_authority: "subject.verified_email", effect: "delete_subject_row", requires: ["independent_email_verification", "approved_normalization", "zero_rows_proof"] };
    case "delete_participant_row_by_verified_email":
      return { ...base, selector_authority: "subject.verified_email", effect: "delete_participant_row", requires: ["participant_identity_verification", "aggregate_invalidation_or_recompute", "zero_rows_proof"] };
    case "delete_participant_row_by_auth_id":
      return { ...base, selector_authority: "subject.auth_user_id", effect: "delete_participant_row", requires: ["exact_account_uuid_match", "aggregate_invalidation_or_recompute", "zero_rows_proof"] };
    case "delete_membership_row_by_auth_id":
      return { ...base, selector_authority: "subject.auth_user_id", effect: "delete_membership", requires: ["exact_account_uuid_match", "access_revocation_proof"] };
    case "delete_legacy_subject_row_by_auth_id_or_verified_email":
      return { ...base, selector_authority: "subject.auth_user_id_then_verified_email", effect: "delete_subject_row", requires: ["authoritative_catalog_match", "role_coherence", "zero_rows_proof"] };
    case "erase_with_selected_subject_row":
      return { ...base, selector_authority: "authorized_parent_row", effect: "erase_with_parent", requires: ["parent_row_authorized", "no_independent_selector"] };
    case "redact_actor_attribution":
      return { ...base, selector_authority: "subject.auth_user_id", effect: "redact_attribution", requires: ["shared_record_preserved", "irreversible_unlink_proof"] };
    case "pseudonymize_retained_audit_identity":
    case "redact_shared_record_role_bundle":
      return null;
  }
}

export function compileNonFkErasureReviewPlan(
  registry: NonFkErasureRegistry,
  discoveredTargetKeys: readonly string[],
): NonFkErasureReviewPlanResult {
  const reasons: string[] = [];
  if (registry.schema_version !== "ctrl.g25.non-fk-erasure-registry.r58.v1") reasons.push("unsupported_registry_schema");
  if (registry.status !== "current_high_risk_surface_classified_execution_blocked") reasons.push("registry_status_not_closed");
  if (registry.execution_gate?.status !== "blocked") reasons.push("registry_execution_gate_not_blocked");

  const discovered = [...discoveredTargetKeys].sort();
  const discoveredSet = new Set(discovered);
  if (discoveredSet.size !== discovered.length) reasons.push("duplicate_discovered_target");
  if (discovered.some((key) => !TARGET_KEY.test(key))) reasons.push("invalid_discovered_target_key");

  const targetKeys = registry.targets.map((target) => target.key);
  const targetSet = new Set(targetKeys);
  if (targetSet.size !== targetKeys.length) reasons.push("duplicate_registry_target");
  if (targetKeys.some((key) => !TARGET_KEY.test(key))) reasons.push("invalid_registry_target_key");
  if (JSON.stringify([...targetKeys].sort()) !== JSON.stringify(discovered)) reasons.push("registry_discovery_coverage_mismatch");

  const blockedTargets: Array<{ target_key: string; standing: string; reason: string }> = [];
  const draftSteps: NonFkErasureDraftStep[] = [];
  for (const target of registry.targets) {
    if (!discoveredSet.has(target.key)) continue;
    if (!BLOCKING_STANDINGS.has(target.standing) && target.standing !== DRAFT_STANDING) {
      reasons.push(`unknown_standing:${target.key}`);
      continue;
    }
    if (target.reason.trim().length < 40) reasons.push(`insufficient_reason:${target.key}`);
    if (!Array.isArray(target.companions)) reasons.push(`companions_missing:${target.key}`);
    if (BLOCKING_STANDINGS.has(target.standing)) {
      blockedTargets.push({ target_key: target.key, standing: target.standing, reason: target.reason });
      continue;
    }
    const step = draftStep(target);
    if (!step) {
      reasons.push(`blocked_action_marked_draft:${target.key}`);
      continue;
    }
    draftSteps.push(step);
  }

  if (reasons.length > 0) return { status: "invalid", reasons: [...new Set(reasons)].sort() };

  blockedTargets.sort((left, right) => left.target_key.localeCompare(right.target_key));
  draftSteps.sort((left, right) => left.target_key.localeCompare(right.target_key));
  const holdReasons = ["non_fk_execution_not_authorized"];
  if (blockedTargets.length > 0) holdReasons.push("registry_contains_blocking_targets");

  return {
    status: "held",
    plan: {
      schema_version: "ctrl.non-fk-erasure-review-plan.r59",
      registry_id: registry.registry_id,
      execution_authority: "none",
      coverage: {
        discovered_targets: discovered.length,
        dispositioned_targets: blockedTargets.length + draftSteps.length,
        draft_targets: draftSteps.length,
        blocked_targets: blockedTargets.length,
      },
      hold_reasons: holdReasons,
      blocked_targets: blockedTargets,
      draft_steps: draftSteps,
    },
  };
}
