import { describe, expect, it } from "vitest";
import {
  buildPreparedCustodyEnvelope,
  type CustodyAuthorityReference,
  type CustodyEnvelopeInput,
} from "./prepared-intelligence-custody-envelope.r24";

const ids = {
  receipt: "10000000-0000-4000-8000-000000000001",
  workspace: "20000000-0000-4000-8000-000000000001",
  custody: "30000000-0000-4000-8000-000000000001",
  otherCustody: "30000000-0000-4000-8000-000000000002",
  subject: "40000000-0000-4000-8000-000000000001",
  brain: "50000000-0000-4000-8000-000000000001",
  decision: "60000000-0000-4000-8000-000000000001",
};

const reference = (overrides: Partial<CustodyAuthorityReference> = {}): CustodyAuthorityReference => ({
  workspace_id: ids.workspace,
  custody_principal_id: ids.custody,
  subject_id: ids.subject,
  audience: "person_private",
  purpose: "prepared_intelligence",
  authority_kind: "brain_item_version",
  authority_record_id: ids.brain,
  authority_version: "v3",
  authority_sha256: "a".repeat(64),
  observed_at: "2026-09-17T09:00:00+01:00",
  ...overrides,
});

const input = (overrides: Partial<CustodyEnvelopeInput> = {}): CustodyEnvelopeInput => {
  const first = reference();
  return {
    receipt_id: ids.receipt,
    scope: {
      workspace_id: ids.workspace,
      custody_principal_id: ids.custody,
      subject_id: ids.subject,
      audience: "customer_private",
      purpose: "prepared_intelligence",
    },
    custody_readback: {
      workspace_id: ids.workspace,
      custody_principal_id: ids.custody,
      status: "active",
      observed_at: "2026-09-17T09:30:00+01:00",
    },
    dependencies: [first],
    current_authority: [first],
    ...overrides,
  };
};

describe("prepared intelligence stable custody envelope R24", () => {
  it("binds new intelligence to stable workspace custody without an operator or auth identity", async () => {
    const result = await buildPreparedCustodyEnvelope(input());
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.envelope).toMatchObject({
      schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
      workspace_id: ids.workspace,
      custody_principal_id: ids.custody,
      subject_id: ids.subject,
      audience: "person_private",
      purpose: "prepared_intelligence",
    });
    expect(Object.keys(result.envelope)).not.toEqual(expect.arrayContaining(["owner_id", "operator_principal_id", "user_id"]));
  });

  it("remains byte-deterministic when current operator assignment changes outside the scope", async () => {
    const writeUnderOperator = async (_operatorPrincipalId: string) => buildPreparedCustodyEnvelope(input());
    const before = await writeUnderOperator("70000000-0000-4000-8000-000000000001");
    const after = await writeUnderOperator("70000000-0000-4000-8000-000000000002");
    expect(before).toEqual(after);
  });

  it.each(["transfer_required", "closed"] as const)("holds when custody is %s", async (status) => {
    const result = await buildPreparedCustodyEnvelope(input({
      custody_readback: { ...input().custody_readback, status },
    }));
    expect(result).toEqual({ status: "held", reasons: [`custody_${status}`] });
  });

  it("rejects a custody readback from another workspace principal", async () => {
    const result = await buildPreparedCustodyEnvelope(input({
      custody_readback: { ...input().custody_readback, custody_principal_id: ids.otherCustody },
    }));
    expect(result).toEqual({ status: "held", reasons: ["custody_principal_mismatch"] });
  });

  it("fails cross-custody dependencies closed", async () => {
    const moved = reference({ custody_principal_id: ids.otherCustody });
    const result = await buildPreparedCustodyEnvelope(input({ dependencies: [moved], current_authority: [moved] }));
    expect(result).toEqual({ status: "held", reasons: ["dependency_custody_mismatch"] });
  });

  it("rejects operator or login identity smuggled into the stable scope", async () => {
    const result = await buildPreparedCustodyEnvelope(input({
      scope: { ...input().scope, operator_principal_id: ids.otherCustody } as never,
    }));
    expect(result).toEqual({ status: "held", reasons: ["scope_unknown_field"] });
  });

  it("keeps dependency order out of the fingerprint", async () => {
    const first = reference();
    const second = reference({
      authority_kind: "decision_case_snapshot",
      authority_record_id: ids.decision,
      authority_version: "v8",
      authority_sha256: "b".repeat(64),
    });
    const forward = await buildPreparedCustodyEnvelope(input({
      dependencies: [first, second],
      current_authority: [first, second],
    }));
    const reverse = await buildPreparedCustodyEnvelope(input({
      dependencies: [second, first],
      current_authority: [second, first],
    }));
    expect(forward).toEqual(reverse);
  });

  it("rejects stale authority and malformed custody timestamps", async () => {
    const stale = await buildPreparedCustodyEnvelope(input({
      current_authority: [reference({ authority_version: "v4", authority_sha256: "b".repeat(64) })],
    }));
    expect(stale).toEqual({ status: "held", reasons: ["dependency_authority_stale"] });

    const malformed = await buildPreparedCustodyEnvelope(input({
      custody_readback: { ...input().custody_readback, observed_at: "not-a-time" },
    }));
    expect(malformed).toEqual({ status: "held", reasons: ["custody_observed_at_invalid"] });

    const invalidStatus = await buildPreparedCustodyEnvelope(input({
      custody_readback: { ...input().custody_readback, status: "unknown" as never },
    }));
    expect(invalidStatus).toEqual({ status: "held", reasons: ["custody_status_invalid"] });
  });
});
