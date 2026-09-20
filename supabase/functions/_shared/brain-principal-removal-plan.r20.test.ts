import { describe, expect, it } from "vitest";
import {
  buildBrainPrincipalRemovalPlan,
  type BrainWorkspaceRelationship,
} from "./brain-principal-removal-plan.r20";

const MAYA = "user-maya";
const KRISH = "user-krish";
const ALEX = "user-alex";

function workspace(
  workspace_id: string,
  subject_id: string,
  owner_id: string,
  active_operator_user_ids: string[] = [],
): BrainWorkspaceRelationship {
  return { workspace_id, subject_id, owner_id, active_operator_user_ids };
}

function plan(
  intent: Parameters<typeof buildBrainPrincipalRemovalPlan>[0],
  relationships: BrainWorkspaceRelationship[],
  standing: "unverified" | "verified_complete" = "verified_complete",
) {
  return buildBrainPrincipalRemovalPlan(intent, relationships, {
    standing,
    evidence_ref: "schema-discovery-r17",
    relationship_count: relationships.length,
  });
}

describe("Brain principal removal plan R20", () => {
  it("erases a Brain only when the removed person is its subject", () => {
    const result = plan(
      { kind: "subject_erasure", subject_id: MAYA },
      [workspace("brain-maya", MAYA, MAYA)],
    );

    expect(result).toEqual({
      status: "ready",
      removed_user_id: MAYA,
      actions: [{ action: "erase_subject_brain", workspace_id: "brain-maya", subject_id: MAYA }],
      auth_user_deletion_allowed: true,
    });
  });

  it("revokes a role-only operator without deleting or holding the customer Brain", () => {
    const result = plan(
      { kind: "operator_removal", operator_user_id: KRISH },
      [workspace("brain-maya", MAYA, MAYA, [KRISH])],
    );

    expect(result).toEqual({
      status: "ready",
      removed_user_id: KRISH,
      actions: [{ action: "revoke_operator_access", workspace_id: "brain-maya", operator_user_id: KRISH }],
      auth_user_deletion_allowed: true,
    });
  });

  it("holds auth deletion when the removed operator owns a different subject's Brain", () => {
    const result = plan(
      { kind: "operator_removal", operator_user_id: KRISH },
      [workspace("brain-maya", MAYA, KRISH, [KRISH])],
    );

    expect(result).toEqual({
      status: "custody_required",
      removed_user_id: KRISH,
      actions: [
        { action: "require_owner_transfer_or_customer_closure", workspace_id: "brain-maya", protected_subject_id: MAYA, removed_operator_user_id: KRISH },
        { action: "revoke_operator_access", workspace_id: "brain-maya", operator_user_id: KRISH },
      ],
      auth_user_deletion_allowed: false,
    });
  });

  it("separates a person's own Brain from customer Brains they operate", () => {
    const result = plan(
      { kind: "subject_erasure", subject_id: KRISH },
      [
        workspace("brain-krish", KRISH, KRISH),
        workspace("brain-maya", MAYA, KRISH, [KRISH]),
        workspace("brain-alex", ALEX, ALEX, [KRISH]),
      ],
    );

    expect(result.status).toBe("custody_required");
    if (result.status === "held") throw new Error("expected a planned result");
    expect(result.auth_user_deletion_allowed).toBe(false);
    expect(result.actions.filter((action) => action.action === "erase_subject_brain")).toEqual([
      { action: "erase_subject_brain", workspace_id: "brain-krish", subject_id: KRISH },
    ]);
    expect(result.actions.some(
      (action) => action.action === "erase_subject_brain" && action.workspace_id !== "brain-krish",
    )).toBe(false);
  });

  it("never treats ownership alone as subject authority", () => {
    const result = plan(
      { kind: "subject_erasure", subject_id: KRISH },
      [workspace("brain-maya", MAYA, KRISH)],
    );

    expect(result.status).toBe("custody_required");
    if (result.status === "held") throw new Error("expected a planned result");
    expect(result.actions.some((action) => action.action === "erase_subject_brain")).toBe(false);
  });

  it("fails closed on ambiguous duplicate workspace evidence", () => {
    const result = plan(
      { kind: "operator_removal", operator_user_id: KRISH },
      [
        workspace("brain-maya", MAYA, KRISH),
        workspace("brain-maya", ALEX, KRISH),
      ],
    );

    expect(result).toEqual({ status: "held", reasons: ["duplicate_workspace:brain-maya"] });
  });

  it("preserves a subject's Brain when only their operator identity is being removed", () => {
    const result = plan(
      { kind: "operator_removal", operator_user_id: MAYA },
      [workspace("brain-maya", MAYA, MAYA)],
    );

    expect(result).toEqual({
      status: "custody_required",
      removed_user_id: MAYA,
      actions: [
        { action: "preserve_subject_brain_and_require_separate_subject_decision", workspace_id: "brain-maya", protected_subject_id: MAYA },
        { action: "revoke_operator_access", workspace_id: "brain-maya", operator_user_id: MAYA },
      ],
      auth_user_deletion_allowed: false,
    });
  });

  it("fails closed when the relationship inventory is not verified complete", () => {
    const result = plan(
      { kind: "operator_removal", operator_user_id: KRISH },
      [workspace("brain-maya", MAYA, MAYA, [KRISH])],
      "unverified",
    );

    expect(result).toEqual({ status: "held", reasons: ["relationship_inventory_unverified"] });
  });
});
