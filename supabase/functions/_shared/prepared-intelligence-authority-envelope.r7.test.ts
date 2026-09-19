import { describe, expect, it } from "vitest";
import {
  buildPreparedAuthorityEnvelope,
  type AuthorityEnvelopeInput,
  type AuthorityReference,
} from "./prepared-intelligence-authority-envelope.r7";

const ids = {
  receipt: "10000000-0000-4000-8000-000000000001",
  workspace: "20000000-0000-4000-8000-000000000001",
  owner: "30000000-0000-4000-8000-000000000001",
  subject: "40000000-0000-4000-8000-000000000001",
  brain: "50000000-0000-4000-8000-000000000001",
  decision: "60000000-0000-4000-8000-000000000001",
};

const hash = (digit: string) => digit.repeat(64);

const dependency = (overrides: Partial<AuthorityReference> = {}): AuthorityReference => ({
  workspace_id: ids.workspace,
  owner_id: ids.owner,
  subject_id: ids.subject,
  audience: "person_private",
  purpose: "prepared_intelligence",
  authority_kind: "brain_item_version",
  authority_record_id: ids.brain,
  authority_version: "v3",
  authority_sha256: hash("a"),
  observed_at: "2026-09-17T09:00:00+01:00",
  ...overrides,
});

const input = (overrides: Partial<AuthorityEnvelopeInput> = {}): AuthorityEnvelopeInput => {
  const first = dependency();
  return {
    receipt_id: ids.receipt,
    scope: {
      workspace_id: ids.workspace,
      owner_id: ids.owner,
      subject_id: ids.subject,
      audience: "customer_private",
      purpose: "prepared_intelligence",
    },
    dependencies: [first],
    current_authority: [first],
    ...overrides,
  };
};

describe("prepared intelligence authority envelope R7", () => {
  it("maps customer-private presentation scope to the canonical person-private audience", async () => {
    const result = await buildPreparedAuthorityEnvelope(input());
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.envelope).toMatchObject({
      workspace_id: ids.workspace,
      owner_id: ids.owner,
      subject_id: ids.subject,
      audience: "person_private",
      purpose: "prepared_intelligence",
    });
  });

  it("maps operator-private presentation scope to the canonical delivery-team audience", async () => {
    const operatorDependency = dependency({ audience: "delivery_team_private" });
    const result = await buildPreparedAuthorityEnvelope(input({
      scope: { ...input().scope, audience: "operator_private" },
      dependencies: [operatorDependency],
      current_authority: [operatorDependency],
    }));
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.envelope.audience).toBe("delivery_team_private");
  });

  it.each([
    ["workspace", { workspace_id: "20000000-0000-4000-8000-000000000099" }, "dependency_workspace_mismatch"],
    ["owner", { owner_id: "30000000-0000-4000-8000-000000000099" }, "dependency_owner_mismatch"],
    ["subject", { subject_id: "40000000-0000-4000-8000-000000000099" }, "dependency_subject_mismatch"],
    ["audience", { audience: "delivery_team_private" }, "dependency_audience_mismatch"],
  ])("fails a cross-%s dependency closed", async (_name, changed, reason) => {
    const altered = dependency(changed as Partial<AuthorityReference>);
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [altered], current_authority: [altered] }));
    expect(result).toMatchObject({ status: "held", reasons: expect.arrayContaining([reason]) });
  });

  it("fails a cross-purpose dependency closed", async () => {
    const altered = dependency({ purpose: "other" as "prepared_intelligence" });
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [altered], current_authority: [altered] }));
    expect(result).toMatchObject({ status: "held", reasons: expect.arrayContaining(["dependency_purpose_invalid", "dependency_purpose_mismatch"]) });
  });

  it("rejects a dependency whose authoritative version has moved", async () => {
    const result = await buildPreparedAuthorityEnvelope(input({
      dependencies: [dependency()],
      current_authority: [dependency({ authority_version: "v4", authority_sha256: hash("b") })],
    }));
    expect(result).toEqual({ status: "held", reasons: ["dependency_authority_stale"] });
  });

  it("rejects a dependency with no current authoritative target", async () => {
    const other = dependency({ authority_kind: "decision_case_snapshot", authority_record_id: ids.decision });
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [other], current_authority: [dependency()] }));
    expect(result).toEqual({ status: "held", reasons: ["dependency_authority_missing"] });
  });

  it("rejects duplicate dependency identities", async () => {
    const first = dependency();
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [first, { ...first }] }));
    expect(result).toEqual({ status: "held", reasons: ["dependency_duplicate"] });
  });

  it("rejects malformed versions and fingerprints", async () => {
    const malformed = dependency({ authority_version: "bad version", authority_sha256: "nope" });
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [malformed], current_authority: [malformed] }));
    expect(result).toMatchObject({ status: "held", reasons: ["dependency_fingerprint_invalid", "dependency_version_invalid"] });
  });

  it("is deterministic under dependency and authority readback order", async () => {
    const first = dependency();
    const second = dependency({
      authority_kind: "decision_case_snapshot",
      authority_record_id: ids.decision,
      authority_version: "snapshot-7",
      authority_sha256: hash("b"),
    });
    const forward = await buildPreparedAuthorityEnvelope(input({ dependencies: [first, second], current_authority: [first, second] }));
    const reversed = await buildPreparedAuthorityEnvelope(input({ dependencies: [second, first], current_authority: [second, first] }));
    expect(forward).toEqual(reversed);
  });

  it("rejects an unknown presentation audience at runtime", async () => {
    const result = await buildPreparedAuthorityEnvelope(input({
      scope: { ...input().scope, audience: "everyone" as "customer_private" },
    }));
    expect(result).toEqual({ status: "held", reasons: ["scope_audience_invalid"] });
  });

  it("requires a typed authority dependency rather than an opaque context token", async () => {
    const result = await buildPreparedAuthorityEnvelope(input({ dependencies: [] }));
    expect(result).toEqual({ status: "held", reasons: ["dependencies_required"] });
  });
});
