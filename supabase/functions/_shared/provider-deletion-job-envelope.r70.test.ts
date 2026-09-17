import { describe, expect, it } from "vitest";
import {
  issueDatabaseVerifiableProviderHandleAuthority,
} from "./provider-deletion-handle-db-authority.r68";
import type {
  ExpectedProviderHandleAuthority,
  ProviderHandleAuthorityKeyring,
  ProviderHandleAuthorityRequest,
} from "./provider-deletion-handle-authority.r66";
import {
  compileProviderDeletionJobEnvelope,
  PROVIDER_DELETION_JOB_SCHEMA,
  type ProviderDeletionJobEnvelopeInput,
} from "./provider-deletion-job-envelope.r70";

const keyring: ProviderHandleAuthorityKeyring = {
  "dispatch-authority-v1": Buffer.alloc(32, 38).toString("base64"),
};
const topologySha256 = "a".repeat(64);
const authorityRequest: ProviderHandleAuthorityRequest = {
  authority_id: "70000000-0000-4000-8000-000000000001",
  workspace_id: "70000000-0000-4000-8000-000000000002",
  receipt_id: "70000000-0000-4000-8000-000000000003",
  handle_id: "70000000-0000-4000-8000-000000000004",
  provider: "elevenlabs",
  actor_id: "70000000-0000-4000-8000-000000000005",
  job_id: "70000000-0000-4000-8000-000000000006",
  issued_at: "2026-09-17T20:00:00Z",
  expires_at: "2026-09-17T20:05:00Z",
  operation: "lease",
  lease_seconds: 300,
};
const expected: ExpectedProviderHandleAuthority = {
  operation: "lease",
  workspace_id: authorityRequest.workspace_id,
  receipt_id: authorityRequest.receipt_id,
  handle_id: authorityRequest.handle_id,
  provider: authorityRequest.provider,
  job_id: authorityRequest.job_id,
};

async function fixture(): Promise<ProviderDeletionJobEnvelopeInput> {
  const token = await issueDatabaseVerifiableProviderHandleAuthority({
    request: authorityRequest,
    keyring,
    activeKeyId: "dispatch-authority-v1",
  });
  return {
    schema_version: PROVIDER_DELETION_JOB_SCHEMA,
    dispatch_id: "70000000-0000-4000-8000-000000000007",
    topology_sha256: topologySha256,
    target_cell: "deletion_worker",
    attempt: 1,
    predecessor_dispatch_id: null,
    authority_token: token,
    issued_at: "2026-09-17T20:00:01Z",
    expires_at: "2026-09-17T20:04:59Z",
  };
}

async function compile(input: ProviderDeletionJobEnvelopeInput, overrides: Partial<Parameters<typeof compileProviderDeletionJobEnvelope>[0]> = {}) {
  return compileProviderDeletionJobEnvelope({
    input,
    expectedTopologySha256: topologySha256,
    expectedAuthority: expected,
    authorityKeyring: keyring,
    now: "2026-09-17T20:02:00Z",
    ...overrides,
  });
}

describe("provider deletion job envelope R70", () => {
  it("compiles one content-free deletion-worker dispatch", async () => {
    const result = await compile(await fixture());
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.envelope).toMatchObject({
        target_cell: "deletion_worker",
        operation: "lease",
        job_id: authorityRequest.job_id,
        workspace_id: authorityRequest.workspace_id,
      });
      expect(result.envelope.envelope_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(result.envelope)).not.toContain("ciphertext");
      expect(JSON.stringify(result.envelope)).not.toContain("generation_secret");
    }
  });

  it("derives crypto-writer routing from a register authority", async () => {
    const input = await fixture();
    const registerRequest: ProviderHandleAuthorityRequest = {
      ...authorityRequest,
      operation: "register",
      cipher_envelope_sha256: "b".repeat(64),
    };
    delete (registerRequest as Partial<typeof authorityRequest>).lease_seconds;
    input.authority_token = await issueDatabaseVerifiableProviderHandleAuthority({
      request: registerRequest,
      keyring,
      activeKeyId: "dispatch-authority-v1",
    });
    input.target_cell = "crypto_writer";
    const result = await compile(input, {
      expectedAuthority: { ...expected, operation: "register" },
    });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.envelope.operation).toBe("register");
  });

  it("rejects a caller-selected destination that disagrees with the authority", async () => {
    const input = await fixture();
    input.target_cell = "crypto_writer";
    await expect(compile(input)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_target_mismatch"]),
    });
  });

  it("rejects a stale topology fingerprint", async () => {
    const input = await fixture();
    input.topology_sha256 = "c".repeat(64);
    await expect(compile(input)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["topology_fingerprint_mismatch"]),
    });
  });

  it("rejects a dispatch that starts before its authority", async () => {
    const input = await fixture();
    input.issued_at = "2026-09-17T19:59:59Z";
    await expect(compile(input, { now: "2026-09-17T20:00:30Z" })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_before_authority"]),
    });
  });

  it("rejects a dispatch that outlives its authority", async () => {
    const input = await fixture();
    input.expires_at = "2026-09-17T20:05:01Z";
    await expect(compile(input)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_exceeds_authority"]),
    });
  });

  it.each([0, 6, 1.5])("rejects invalid attempt %s", async (attempt) => {
    const input = await fixture();
    input.attempt = attempt;
    await expect(compile(input)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_attempt_invalid"]),
    });
  });

  it("requires a predecessor only after the first attempt", async () => {
    const first = await fixture();
    first.predecessor_dispatch_id = "70000000-0000-4000-8000-000000000008";
    await expect(compile(first)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_predecessor_invalid"]),
    });
    const retry = await fixture();
    retry.attempt = 2;
    await expect(compile(retry)).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_predecessor_invalid"]),
    });
  });

  it("accepts a bounded retry linked to a different predecessor", async () => {
    const retry = await fixture();
    retry.dispatch_id = "70000000-0000-4000-8000-000000000009";
    retry.attempt = 2;
    retry.predecessor_dispatch_id = "70000000-0000-4000-8000-000000000007";
    await expect(compile(retry)).resolves.toMatchObject({ status: "accepted" });
  });

  it("rejects a tampered authority token before routing", async () => {
    const input = await fixture();
    input.authority_token = `${input.authority_token.slice(0, -1)}${input.authority_token.endsWith("A") ? "B" : "A"}`;
    const result = await compile(input);
    expect(result.status).toBe("held");
    if (result.status === "held") expect(result.reasons.some((reason) => reason.includes("signature_invalid"))).toBe(true);
  });

  it("rejects cross-job authority reuse", async () => {
    const input = await fixture();
    const result = await compile(input, {
      expectedAuthority: { ...expected, job_id: "70000000-0000-4000-8000-000000000099" },
    });
    expect(result.status).toBe("held");
    if (result.status === "held") expect(result.reasons).toContain("authority_job_mismatch");
  });

  it("rejects unexpected envelope fields", async () => {
    const input = { ...(await fixture()), provider_handle: "generation_secret" } as ProviderDeletionJobEnvelopeInput;
    await expect(compile(input)).resolves.toEqual({ status: "held", reasons: ["job_envelope_shape_invalid"] });
  });
});
