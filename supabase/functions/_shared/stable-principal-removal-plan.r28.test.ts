import { describe, expect, it } from "vitest";
import {
  buildStablePrincipalRemovalPlan,
  type StablePrincipalRemovalContext,
} from "./stable-principal-removal-plan.r28";

const IDS = {
  target: "10000000-0000-4000-8000-000000000001",
  alternate: "10000000-0000-4000-8000-000000000002",
  subject: "20000000-0000-4000-8000-000000000001",
  operator: "30000000-0000-4000-8000-000000000001",
  custody: "40000000-0000-4000-8000-000000000001",
  workspace: "50000000-0000-4000-8000-000000000001",
  otherSubject: "20000000-0000-4000-8000-000000000002",
  otherOperator: "30000000-0000-4000-8000-000000000002",
  otherCustody: "40000000-0000-4000-8000-000000000002",
  otherWorkspace: "50000000-0000-4000-8000-000000000002",
} as const;

function context(
  overrides: Partial<StablePrincipalRemovalContext> = {},
): StablePrincipalRemovalContext {
  return {
    schema_version: "ctrl.stable-principal-removal-context.r28",
    standing: "verified_complete",
    evidence_ref: "a".repeat(64),
    observed_at: "2026-09-17T09:30:00.000Z",
    target_auth_user_id: IDS.target,
    target_subject_principal_ids: [],
    target_operator_principal_ids: [IDS.operator],
    workspace_count: 1,
    workspaces: [
      {
        workspace_id: IDS.workspace,
        subject_principal_id: IDS.otherSubject,
        custody_principal_id: IDS.custody,
        custody_status: "active",
        current_operator_principal_id: IDS.operator,
        current_operator_active_auth_user_ids: [IDS.target],
        target_has_current_role: true,
        target_has_current_grant: true,
      },
    ],
    ...overrides,
  };
}

describe("stable principal removal planner r28", () => {
  it("blocks deleting the last login route to active custody", () => {
    const plan = buildStablePrincipalRemovalPlan(context());

    expect(plan).toMatchObject({
      status: "custody_required",
      auth_user_deletion_allowed: false,
      execution_order: ["custody", "access", "identity_links", "auth_user"],
    });
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.actions.map((action) => action.action)).toEqual([
      "require_customer_authorized_custody_transfer",
      "revoke_workspace_role",
      "revoke_audience_grants",
      "revoke_operator_auth_link",
    ]);
  });

  it("allows removal when the same stable operator has another active login", () => {
    const candidate = context();
    candidate.workspaces[0].current_operator_active_auth_user_ids = [IDS.target, IDS.alternate];

    const plan = buildStablePrincipalRemovalPlan(candidate);

    expect(plan.status).toBe("ready");
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.auth_user_deletion_allowed).toBe(true);
    expect(plan.actions).not.toContainEqual(
      expect.objectContaining({ action: "require_customer_authorized_custody_transfer" }),
    );
  });

  it("revokes workspace access without inventing a custody transfer", () => {
    const candidate = context({ target_operator_principal_ids: [] });
    candidate.workspaces[0] = {
      ...candidate.workspaces[0],
      current_operator_principal_id: IDS.otherOperator,
      current_operator_active_auth_user_ids: [IDS.alternate],
    };

    const plan = buildStablePrincipalRemovalPlan(candidate);

    expect(plan.status).toBe("ready");
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.actions.map((action) => action.action)).toEqual([
      "revoke_workspace_role",
      "revoke_audience_grants",
    ]);
  });

  it("preserves a person's Brain when removing only their login", () => {
    const plan = buildStablePrincipalRemovalPlan(context({
      target_subject_principal_ids: [IDS.subject],
      target_operator_principal_ids: [],
      workspace_count: 1,
      workspaces: [{
        workspace_id: IDS.workspace,
        subject_principal_id: IDS.subject,
        custody_principal_id: IDS.custody,
        custody_status: "closed",
        current_operator_principal_id: null,
        current_operator_active_auth_user_ids: [],
        target_has_current_role: false,
        target_has_current_grant: false,
      }],
    }));

    expect(plan.status).toBe("ready");
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.actions).toEqual([
      { action: "revoke_subject_auth_link", subject_principal_id: IDS.subject, auth_user_id: IDS.target },
      { action: "preserve_subject_principal", subject_principal_id: IDS.subject },
    ]);
    expect(JSON.stringify(plan)).not.toMatch(/erase|delete_subject|delete_brain/);
  });

  it("separates the target's own Brain from customer custody", () => {
    const candidate = context({
      target_subject_principal_ids: [IDS.subject],
      workspace_count: 2,
    });
    candidate.workspaces = [
      {
        workspace_id: IDS.workspace,
        subject_principal_id: IDS.subject,
        custody_principal_id: IDS.custody,
        custody_status: "closed",
        current_operator_principal_id: null,
        current_operator_active_auth_user_ids: [],
        target_has_current_role: false,
        target_has_current_grant: false,
      },
      {
        workspace_id: IDS.otherWorkspace,
        subject_principal_id: IDS.otherSubject,
        custody_principal_id: IDS.otherCustody,
        custody_status: "active",
        current_operator_principal_id: IDS.operator,
        current_operator_active_auth_user_ids: [IDS.target],
        target_has_current_role: true,
        target_has_current_grant: false,
      },
    ];

    const plan = buildStablePrincipalRemovalPlan(candidate);

    expect(plan.status).toBe("custody_required");
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.actions).toContainEqual({
      action: "preserve_subject_principal",
      subject_principal_id: IDS.subject,
    });
    expect(plan.actions).toContainEqual({
      action: "require_customer_authorized_custody_transfer",
      workspace_id: IDS.otherWorkspace,
      custody_principal_id: IDS.otherCustody,
      from_operator_principal_id: IDS.operator,
    });
  });

  it("does not transfer closed custody", () => {
    const candidate = context();
    candidate.workspaces[0].custody_status = "closed";

    const plan = buildStablePrincipalRemovalPlan(candidate);

    expect(plan.status).toBe("ready");
    if (plan.status === "held") throw new Error("expected an actionable plan");
    expect(plan.actions).not.toContainEqual(
      expect.objectContaining({ action: "require_customer_authorized_custody_transfer" }),
    );
  });

  it.each([
    ["unverified inventory", () => context({ standing: "unverified" })],
    ["unknown top-level field", () => ({ ...context(), owner_id: IDS.target })],
    ["wrong workspace count", () => context({ workspace_count: 2 })],
    ["duplicate stable subject", () => context({
      target_subject_principal_ids: [IDS.subject, IDS.subject],
    })],
    ["incomplete active custody", () => {
      const candidate = context();
      candidate.workspaces[0].current_operator_active_auth_user_ids = [];
      return candidate;
    }],
    ["unrelated workspace", () => {
      const candidate = context({ target_operator_principal_ids: [] });
      candidate.workspaces[0] = {
        ...candidate.workspaces[0],
        current_operator_principal_id: IDS.otherOperator,
        current_operator_active_auth_user_ids: [IDS.alternate],
        target_has_current_role: false,
        target_has_current_grant: false,
      };
      return candidate;
    }],
  ])("holds on %s", (_label, makeCandidate) => {
    const plan = buildStablePrincipalRemovalPlan(
      makeCandidate() as StablePrincipalRemovalContext,
    );

    expect(plan.status).toBe("held");
  });

  it("is deterministic regardless of source ordering", () => {
    const candidate = context({
      target_subject_principal_ids: [IDS.otherSubject, IDS.subject],
      target_operator_principal_ids: [IDS.otherOperator, IDS.operator],
    });
    const reordered = structuredClone(candidate);
    reordered.target_subject_principal_ids.reverse();
    reordered.target_operator_principal_ids.reverse();

    expect(buildStablePrincipalRemovalPlan(candidate)).toEqual(
      buildStablePrincipalRemovalPlan(reordered),
    );
  });
});
