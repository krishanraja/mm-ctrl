import { describe, expect, it } from "vitest";
import { buildProviderErasureReviewPlan, type ProviderErasureReviewInput } from "./provider-erasure-review-plan.r61";

const base: ProviderErasureReviewInput = {
  provider: "openai",
  processor_kind: "model",
  control_mode: "public_policy_default",
  latest_event: "accepted",
  deletion_handle_available: false,
};

describe("provider erasure review plan R61", () => {
  it("treats a rejected exchange as terminal without inventing provider work", () => {
    expect(buildProviderErasureReviewPlan({ ...base, latest_event: "rejected" })).toEqual({
      status: "observed_terminal",
      execution_authority: "none",
      reasons: ["provider_rejected_exchange"],
      actions: [],
    });
  });

  it("holds an unknown outcome until the provider result is resolved", () => {
    expect(buildProviderErasureReviewPlan({ ...base, latest_event: "outcome_unknown" })).toMatchObject({
      status: "held",
      reasons: ["provider_outcome_must_be_resolved"],
    });
  });

  it("requires evidence before translating ZDR into an expired event", () => {
    const result = buildProviderErasureReviewPlan({ ...base, provider: "xai", control_mode: "request_verified_zdr" });
    expect(result).toMatchObject({
      status: "review_plan",
      execution_authority: "none",
      actions: [{ action: "verify_zdr_attestation", candidate_event: "expired" }],
    });
  });

  it("refuses to mistake a receipt HMAC for an ElevenLabs deletion handle", () => {
    expect(buildProviderErasureReviewPlan({
      ...base,
      provider: "elevenlabs",
      processor_kind: "audio",
      control_mode: "provider_policy_retention",
    })).toMatchObject({
      status: "held",
      reasons: ["provider_deletion_handle_unavailable", "receipt_hmac_is_not_a_deletion_handle"],
    });
  });

  it("drafts ElevenLabs deletion only when a separate handle exists", () => {
    expect(buildProviderErasureReviewPlan({
      ...base,
      provider: "elevenlabs",
      processor_kind: "audio",
      control_mode: "provider_policy_retention",
      deletion_handle_available: true,
    })).toMatchObject({
      status: "review_plan",
      execution_authority: "none",
      actions: [{ action: "request_operational_deletion", candidate_event: "operationally_deleted" }],
    });
  });

  it("separates Resend expiry from the recipient copy that cannot be recalled", () => {
    const result = buildProviderErasureReviewPlan({
      ...base,
      provider: "resend",
      processor_kind: "delivery",
      control_mode: "provider_policy_retention",
      latest_event: "delivered",
    });
    expect(result).toMatchObject({
      status: "review_plan",
      reasons: ["delivery_copy_cannot_be_recalled", "provider_expiry_not_immediate_deletion"],
    });
    if (result.status !== "review_plan") return;
    expect(result.actions.map((entry) => entry.action)).toEqual([
      "record_irretrievable_recipient_copy",
      "await_provider_policy_expiry",
    ]);
  });

  it("holds Stripe because deletion and regulated residual retention need a compound outcome", () => {
    expect(buildProviderErasureReviewPlan({
      ...base,
      provider: "stripe",
      processor_kind: "billing",
      control_mode: "regulated_retention",
      deletion_handle_available: true,
    })).toEqual({
      status: "held",
      execution_authority: "none",
      reasons: ["registry_cannot_express_operational_deletion_and_residual_retention"],
      actions: [],
    });
    expect(buildProviderErasureReviewPlan({
      ...base,
      provider: "stripe",
      processor_kind: "billing",
      control_mode: "regulated_retention",
      latest_event: "operationally_deleted",
      deletion_handle_available: true,
    })).toMatchObject({
      status: "held",
      reasons: ["registry_cannot_express_operational_deletion_and_residual_retention"],
    });
  });

  it("keeps research public and adds expiry only when the route is not a fixed fetch", () => {
    const ordinary = buildProviderErasureReviewPlan({
      ...base,
      provider: "brave",
      processor_kind: "research",
      control_mode: "public_policy_default",
    });
    const fixed = buildProviderErasureReviewPlan({
      ...base,
      provider: "fixed_rss_publishers",
      processor_kind: "research",
      control_mode: "fixed_public_fetch",
    });
    if (ordinary.status !== "review_plan" || fixed.status !== "review_plan") throw new Error("expected review plans");
    expect(ordinary.actions).toHaveLength(2);
    expect(fixed.actions).toHaveLength(1);
  });

  it("blocks an unknown configured destination and rejects route incoherence", () => {
    expect(buildProviderErasureReviewPlan({
      ...base,
      provider: "configured_downstream",
      processor_kind: "configured_downstream",
      control_mode: "unverified",
    })).toMatchObject({ status: "held", reasons: ["configured_downstream_contract_unresolved"] });
    expect(buildProviderErasureReviewPlan({ ...base, provider: "stripe" })).toEqual({
      status: "invalid",
      reasons: ["provider_processor_route_incoherent"],
    });
    expect(buildProviderErasureReviewPlan({ ...base, latest_event: "verification_failed" })).toMatchObject({
      status: "held",
      reasons: ["terminal_verification_failure_requires_remediation"],
    });
  });
});
