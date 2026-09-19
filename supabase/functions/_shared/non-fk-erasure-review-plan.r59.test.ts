import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileNonFkErasureReviewPlan,
  type NonFkErasureRegistry,
} from "./non-fk-erasure-review-plan.r59";

const root = process.cwd();
const registry = JSON.parse(readFileSync(resolve(
  root,
  "project-documentation/ctrl-evolution/g25-non-fk-erasure-registry-r58.json",
), "utf8")) as NonFkErasureRegistry;
const discovery = JSON.parse(execFileSync(process.execPath, [
  resolve(root, "scripts/discover-ctrl-g25-non-fk-identifiers-r57.mjs"),
], { cwd: root, encoding: "utf8" })) as { high_risk_anchors: Array<{ table: string; column: string }> };
const keys = discovery.high_risk_anchors.map((target) => `${target.table}.${target.column}`);
const clone = (): NonFkErasureRegistry => structuredClone(registry);

describe("non-FK erasure review plan R59", () => {
  it("dispositions every current high-risk anchor but keeps execution held", () => {
    const result = compileNonFkErasureReviewPlan(registry, keys);
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.plan.execution_authority).toBe("none");
    expect(result.plan.coverage).toEqual({
      discovered_targets: 36,
      dispositioned_targets: 36,
      draft_targets: 18,
      blocked_targets: 18,
    });
    expect(result.plan.hold_reasons).toEqual([
      "non_fk_execution_not_authorized",
      "registry_contains_blocking_targets",
    ]);
  });

  it("rejects missing, stale and duplicate coverage", () => {
    expect(compileNonFkErasureReviewPlan(registry, keys.slice(1))).toMatchObject({ status: "invalid" });
    expect(compileNonFkErasureReviewPlan(registry, [...keys, "stale.email"])).toMatchObject({ status: "invalid" });
    expect(compileNonFkErasureReviewPlan(registry, [...keys, keys[0]])).toMatchObject({ status: "invalid" });
  });

  it("keeps phone subordinate to an already-authorized parent row", () => {
    const result = compileNonFkErasureReviewPlan(registry, keys);
    if (result.status !== "held") throw new Error("expected held plan");
    expect(result.plan.draft_steps.find((step) => step.target_key === "booking_requests.phone")).toEqual({
      target_key: "booking_requests.phone",
      action: "erase_with_selected_subject_row",
      selector_authority: "authorized_parent_row",
      effect: "erase_with_parent",
      requires: ["parent_row_authorized", "no_independent_selector"],
    });
  });

  it("never emits draft work for shared-record or retained-audit blockers", () => {
    const result = compileNonFkErasureReviewPlan(registry, keys);
    if (result.status !== "held") throw new Error("expected held plan");
    const drafted = new Set(result.plan.draft_steps.map((step) => step.target_key));
    expect(drafted.has("workshop_sessions.facilitator_email")).toBe(false);
    expect(drafted.has("security_audit_log.user_id")).toBe(false);
    expect(result.plan.blocked_targets).toEqual(expect.arrayContaining([
      expect.objectContaining({ target_key: "workshop_sessions.facilitator_email" }),
      expect.objectContaining({ target_key: "security_audit_log.user_id" }),
    ]));
  });

  it("rejects a blocking action disguised as draft-eligible", () => {
    const attacked = clone();
    const target = attacked.targets.find((entry) => entry.key === "security_audit_log.user_id");
    if (!target) throw new Error("missing audit target");
    target.standing = "classified_implementation_unverified";
    expect(compileNonFkErasureReviewPlan(attacked, keys)).toMatchObject({
      status: "invalid",
      reasons: ["blocked_action_marked_draft:security_audit_log.user_id"],
    });
  });

  it("contains abstract selectors only and never receives personal values", () => {
    const result = compileNonFkErasureReviewPlan(registry, keys);
    expect(JSON.stringify(result)).not.toContain("@");
    expect(JSON.stringify(result)).not.toContain("auth.users");
  });
});
