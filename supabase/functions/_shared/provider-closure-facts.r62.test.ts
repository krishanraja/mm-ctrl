import { describe, expect, it } from "vitest";
import { evaluateProviderClosureFacts, type ProviderClosureFact } from "./provider-closure-facts.r62";

const hash = "a".repeat(64);
const fact = (
  fact_id: string,
  fact_kind: ProviderClosureFact["fact_kind"],
  scope: ProviderClosureFact["scope"],
  occurred_at = "2026-09-17T20:00:00Z",
): ProviderClosureFact => ({ fact_id, fact_kind, scope, occurred_at, evidence_sha256: hash });

describe("provider closure facts R62", () => {
  it("completes verified no-retention payload closure", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["payload_disposition"],
      facts: [fact("fact-1", "no_retention_verified", "exchange_payload")],
    })).toMatchObject({ status: "complete", pending_obligations: [] });
  });

  it("holds policy expiry until final evidence arrives", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["payload_disposition"],
      facts: [fact("fact-1", "policy_expiry_pending", "exchange_payload")],
    })).toMatchObject({
      status: "held",
      reasons: ["obligation_pending:payload_disposition", "provider_policy_expiry_pending"],
    });
  });

  it("expresses Stripe operational deletion and residual retention together", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["operational_deletion", "residual_retention_boundary"],
      facts: [
        fact("fact-1", "operational_deletion_succeeded", "provider_object"),
        fact("fact-2", "residual_retention_confirmed", "regulated_record"),
      ],
    })).toMatchObject({
      status: "bounded_complete_with_residual",
      satisfied_obligations: ["operational_deletion", "residual_retention_boundary"],
    });
  });

  it("expresses CTRL delivery closure while an external recipient copy remains", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["payload_disposition", "external_copy_boundary"],
      facts: [
        fact("fact-1", "policy_expired", "exchange_payload"),
        fact("fact-2", "external_copy_confirmed", "external_copy"),
      ],
    })).toMatchObject({ status: "ctrl_complete_external_copy_remains" });
  });

  it("keeps a verification failure visible until a later recovery", () => {
    const failure = fact("fact-1", "verification_failed", "exchange_payload", "2026-09-17T20:00:00Z");
    expect(evaluateProviderClosureFacts({ obligations: ["payload_disposition"], facts: [failure] })).toMatchObject({
      status: "held",
      reasons: expect.arrayContaining(["unrecovered_verification_failure:exchange_payload"]),
    });
    expect(evaluateProviderClosureFacts({
      obligations: ["payload_disposition"],
      facts: [
        failure,
        fact("fact-2", "verification_recovered", "exchange_payload", "2026-09-17T20:01:00Z"),
        fact("fact-3", "no_retention_verified", "exchange_payload", "2026-09-17T20:02:00Z"),
      ],
    })).toMatchObject({ status: "complete" });
  });

  it("rejects recovery without failure and wrong fact scope", () => {
    expect(evaluateProviderClosureFacts({
      obligations: [],
      facts: [fact("fact-1", "verification_recovered", "provider_object")],
    })).toMatchObject({ status: "invalid", reasons: ["recovery_without_prior_failure:fact-1"] });
    expect(evaluateProviderClosureFacts({
      obligations: [],
      facts: [fact("fact-1", "external_copy_confirmed", "exchange_payload")],
    })).toMatchObject({ status: "invalid", reasons: ["fact_scope_mismatch:fact-1"] });
  });

  it("rejects conflicting final payload dispositions", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["payload_disposition"],
      facts: [
        fact("fact-1", "no_retention_verified", "exchange_payload"),
        fact("fact-2", "policy_expired", "exchange_payload", "2026-09-17T20:01:00Z"),
      ],
    })).toMatchObject({ status: "invalid", reasons: ["conflicting_payload_disposition"] });
  });

  it("retains failure history while allowing later operational recovery", () => {
    expect(evaluateProviderClosureFacts({
      obligations: ["operational_deletion"],
      facts: [
        fact("fact-1", "operational_deletion_failed", "provider_object"),
        fact("fact-2", "operational_deletion_succeeded", "provider_object", "2026-09-17T20:01:00Z"),
      ],
    })).toMatchObject({ status: "complete", pending_obligations: [] });
  });
});
