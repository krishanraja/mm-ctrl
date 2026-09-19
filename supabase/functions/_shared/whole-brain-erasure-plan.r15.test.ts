import { describe, expect, it } from "vitest";
import {
  buildWholeBrainErasurePlan,
  evaluateWholeBrainErasureCompletion,
  REQUIRED_ERASURE_PLANES,
  type ErasureTarget,
  type WholeBrainErasurePolicy,
} from "./whole-brain-erasure-plan.r15";

const boundPolicy: WholeBrainErasurePolicy = {
  retained_audit: { mode: "pseudonymised_receipt", retention_days: 30 },
  customer_controlled_copies: {
    mode: "plain_language_action",
    exact_language: "Copies you exported remain under your control and must be deleted by you.",
  },
  partial_completion: "resumable_pending",
};

function targets(): ErasureTarget[] {
  return REQUIRED_ERASURE_PLANES.map((coverage_plane, index) => ({
    target_id: `target-${index + 1}`,
    coverage_plane,
    controller: coverage_plane === "external_processors" ? "processor" :
      coverage_plane === "backups_observability_and_devices" ? "customer" : "ctrl",
    action: coverage_plane === "mcp_and_access" ? "revoke_access" :
      coverage_plane === "external_processors" ? "request_processor_deletion" :
      coverage_plane === "backups_observability_and_devices" ? "customer_action" : "delete_rows",
    proof_kind: coverage_plane === "mcp_and_access" ? "revoked" :
      coverage_plane === "external_processors" ? "provider_receipt" :
      coverage_plane === "backups_observability_and_devices" ? "customer_acknowledgement" : "zero_rows",
  }));
}

function input(policy = boundPolicy, targetSet = targets()) {
  return {
    request_id: "erase-001",
    workspace_id: "workspace-001",
    subject_id: "subject-001",
    requested_at: "2026-09-17T15:45:00+01:00",
    policy,
    targets: targetSet,
  } as const;
}

describe("whole-Brain erasure plan R15", () => {
  it("holds while any consequential policy is unbound", () => {
    const result = buildWholeBrainErasurePlan(input({
      retained_audit: { mode: "unbound" },
      customer_controlled_copies: { mode: "unbound" },
      partial_completion: "unbound",
    }));

    expect(result).toEqual({
      status: "held",
      reasons: [
        "customer_copy_language_unbound",
        "partial_completion_policy_unbound",
        "retained_audit_policy_unbound",
      ],
    });
  });

  it("holds when even one R14 coverage plane is absent", () => {
    const result = buildWholeBrainErasurePlan(input(boundPolicy, targets().slice(0, -1)));
    expect(result).toMatchObject({ status: "held" });
    if (result.status === "held") {
      expect(result.reasons).toContain("coverage_plane_missing:backups_observability_and_devices");
    }
  });

  it("orders access revocation before destructive work and customer action", () => {
    const result = buildWholeBrainErasurePlan(input());
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.plan.ordered_targets[0]).toMatchObject({ action: "revoke_access", stage: 0 });
    expect(result.plan.ordered_targets.at(-1)).toMatchObject({ action: "customer_action", stage: 4 });
    expect(result.plan.retained_audit).toEqual({ mode: "pseudonymised_receipt", retention_days: 30 });
  });

  it("never calls missing or unproved results complete", () => {
    const result = buildWholeBrainErasurePlan(input());
    if (result.status !== "ready") throw new Error("expected ready plan");

    expect(evaluateWholeBrainErasureCompletion(result.plan, [])).toMatchObject({ status: "invalid" });

    const pending = result.plan.ordered_targets.map((target, index) => ({
      target_id: target.target_id,
      outcome: index === 0 ? "pending" as const : "proved" as const,
      proof_ref: index === 0 ? null : `proof-${index}`,
    }));
    expect(evaluateWholeBrainErasureCompletion(result.plan, pending)).toEqual({
      status: "pending",
      pending_target_ids: [result.plan.ordered_targets[0].target_id],
    });
  });

  it("distinguishes CTRL erasure from a copy still controlled by the customer", () => {
    const result = buildWholeBrainErasurePlan(input());
    if (result.status !== "ready") throw new Error("expected ready plan");

    const outcomes = result.plan.ordered_targets.map((target, index) => ({
      target_id: target.target_id,
      outcome: target.controller === "customer" ? "action_required" as const : "proved" as const,
      proof_ref: target.controller === "customer" ? null : `proof-${index}`,
    }));
    expect(evaluateWholeBrainErasureCompletion(result.plan, outcomes)).toEqual({
      status: "ctrl_erased_customer_action_required",
      customer_target_ids: ["target-9"],
    });
  });

  it("requires a proof reference before any target can be called proved", () => {
    const result = buildWholeBrainErasurePlan(input());
    if (result.status !== "ready") throw new Error("expected ready plan");

    const outcomes = result.plan.ordered_targets.map((target) => ({
      target_id: target.target_id,
      outcome: "proved" as const,
      proof_ref: null,
    }));
    const completion = evaluateWholeBrainErasureCompletion(result.plan, outcomes);
    expect(completion.status).toBe("invalid");
  });

  it("keeps hard failure distinct from resumable pending", () => {
    const result = buildWholeBrainErasurePlan(input({ ...boundPolicy, partial_completion: "hard_failure" }));
    if (result.status !== "ready") throw new Error("expected ready plan");

    const outcomes = result.plan.ordered_targets.map((target, index) => ({
      target_id: target.target_id,
      outcome: index === 0 ? "failed" as const : "proved" as const,
      proof_ref: index === 0 ? null : `proof-${index}`,
    }));
    expect(evaluateWholeBrainErasureCompletion(result.plan, outcomes)).toEqual({
      status: "failed",
      failed_target_ids: [result.plan.ordered_targets[0].target_id],
    });
  });
});
