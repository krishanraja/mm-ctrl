import { describe, expect, it } from "vitest";
import {
  issueProviderHandleAuthority,
  verifyProviderHandleAuthority,
  type ExpectedProviderHandleAuthority,
  type ProviderHandleAuthorityKeyring,
  type ProviderHandleAuthorityRequest,
} from "./provider-deletion-handle-authority.r66";

const keyring: ProviderHandleAuthorityKeyring = {
  "provider-authority-v1": Buffer.alloc(32, 11).toString("base64"),
  "provider-authority-v2": Buffer.alloc(32, 12).toString("base64"),
};
const identities = {
  authority_id: "66000000-0000-4000-8000-000000000001",
  workspace_id: "66000000-0000-4000-8000-000000000002",
  receipt_id: "66000000-0000-4000-8000-000000000003",
  handle_id: "66000000-0000-4000-8000-000000000004",
  actor_id: "66000000-0000-4000-8000-000000000005",
  job_id: "66000000-0000-4000-8000-000000000006",
  provider: "elevenlabs" as const,
  issued_at: "2026-09-17T20:00:00Z",
  expires_at: "2026-09-17T20:05:00Z",
};
const register: ProviderHandleAuthorityRequest = {
  ...identities,
  operation: "register",
  cipher_envelope_sha256: "a".repeat(64),
};
const expected: ExpectedProviderHandleAuthority = {
  operation: "register",
  workspace_id: identities.workspace_id,
  receipt_id: identities.receipt_id,
  handle_id: identities.handle_id,
  provider: identities.provider,
  job_id: identities.job_id,
};

async function issue(request: ProviderHandleAuthorityRequest = register): Promise<string> {
  return issueProviderHandleAuthority({ request, keyring, activeKeyId: "provider-authority-v1" });
}

describe("provider deletion handle authority R66", () => {
  it("accepts one exact crypto-writer registration capability", async () => {
    const token = await issue();
    const result = await verifyProviderHandleAuthority({ token, keyring, expected, now: "2026-09-17T20:04:59Z" });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.authority.role).toBe("provider_handle_crypto_writer");
      expect(result.authority.operation).toBe("register");
    }
  });

  it("contains no raw provider handle or ciphertext", async () => {
    const token = await issue();
    expect(token).not.toContain("generation_secret");
    expect(token).not.toContain("ciphertext");
    expect(token).toContain("cipher_envelope_sha256");
  });

  it("refuses an injected raw handle instead of signing it", async () => {
    const poisoned = { ...register, provider_handle: "generation_secret" } as ProviderHandleAuthorityRequest;
    await expect(issue(poisoned)).rejects.toThrow("authority_payload_malformed");
  });

  it("holds a registration when its envelope digest is substituted", async () => {
    const parsed = JSON.parse(await issue());
    parsed.authority.cipher_envelope_sha256 = "b".repeat(64);
    const result = await verifyProviderHandleAuthority({ token: JSON.stringify(parsed), keyring, expected, now: "2026-09-17T20:01:00Z" });
    expect(result).toEqual({ status: "held", reasons: ["authority_signature_invalid"] });
  });

  it("maps lease and destroy only to the deletion-worker role", async () => {
    const lease = await issue({ ...identities, operation: "lease", lease_seconds: 300 });
    const leaseResult = await verifyProviderHandleAuthority({
      token: lease,
      keyring,
      expected: { ...expected, operation: "lease" },
      now: "2026-09-17T20:01:00Z",
    });
    expect(leaseResult.status).toBe("accepted");
    if (leaseResult.status === "accepted") expect(leaseResult.authority.role).toBe("provider_deletion_worker");

    const destroy = await issue({
      ...identities,
      operation: "destroy",
      destruction_reason: "operational_deletion_succeeded",
      success_fact_id: "66000000-0000-4000-8000-000000000007",
    });
    const destroyResult = await verifyProviderHandleAuthority({
      token: destroy,
      keyring,
      expected: { ...expected, operation: "destroy" },
      now: "2026-09-17T20:01:00Z",
    });
    expect(destroyResult.status).toBe("accepted");
    if (destroyResult.status === "accepted") expect(destroyResult.authority.role).toBe("provider_deletion_worker");
  });

  it("rejects authority and lease lifetimes beyond five minutes", async () => {
    await expect(issue({ ...register, expires_at: "2026-09-17T20:05:01Z" })).rejects.toThrow("authority_lifetime_invalid");
    await expect(issue({ ...identities, operation: "lease", lease_seconds: 301 })).rejects.toThrow("authority_lease_invalid");
  });

  it("holds capabilities before issue time and at expiry", async () => {
    const token = await issue();
    await expect(verifyProviderHandleAuthority({ token, keyring, expected, now: "2026-09-17T19:59:59Z" }))
      .resolves.toMatchObject({ status: "held", reasons: ["authority_not_yet_valid"] });
    await expect(verifyProviderHandleAuthority({ token, keyring, expected, now: "2026-09-17T20:05:00Z" }))
      .resolves.toMatchObject({ status: "held", reasons: ["authority_expired"] });
  });

  it.each([
    ["workspace", { workspace_id: "66000000-0000-4000-8000-000000000099" }, "authority_workspace_mismatch"],
    ["receipt", { receipt_id: "66000000-0000-4000-8000-000000000099" }, "authority_receipt_mismatch"],
    ["handle", { handle_id: "66000000-0000-4000-8000-000000000099" }, "authority_handle_mismatch"],
    ["job", { job_id: "66000000-0000-4000-8000-000000000099" }, "authority_job_mismatch"],
    ["operation", { operation: "lease" as const }, "authority_operation_mismatch"],
  ])("holds a capability moved across %s context", async (_label, change, reason) => {
    const token = await issue();
    const result = await verifyProviderHandleAuthority({ token, keyring, expected: { ...expected, ...change }, now: "2026-09-17T20:01:00Z" });
    expect(result).toMatchObject({ status: "held" });
    if (result.status === "held") expect(result.reasons).toContain(reason);
  });

  it("requires provider-specific destruction evidence", async () => {
    await expect(issue({ ...identities, operation: "destroy", destruction_reason: "exchange_expired", success_fact_id: identities.receipt_id }))
      .rejects.toThrow("authority_destruction_evidence_invalid");
    await expect(issue({ ...identities, operation: "destroy", destruction_reason: "account_closure_succeeded", success_fact_id: identities.receipt_id }))
      .rejects.toThrow("authority_destruction_evidence_invalid");
    await expect(issue({ ...identities, provider: "stripe", operation: "destroy", destruction_reason: "account_closure_succeeded", success_fact_id: null }))
      .rejects.toThrow("authority_destruction_evidence_invalid");
  });

  it("rejects tampering with the derived role", async () => {
    const parsed = JSON.parse(await issue());
    parsed.authority.role = "provider_deletion_worker";
    const result = await verifyProviderHandleAuthority({ token: JSON.stringify(parsed), keyring, expected, now: "2026-09-17T20:01:00Z" });
    expect(result.status).toBe("held");
    if (result.status === "held") {
      expect(result.reasons).toContain("authority_role_operation_mismatch");
      expect(result.reasons).toContain("authority_signature_invalid");
    }
  });

  it("fails closed when the signing key is unavailable", async () => {
    const token = await issue();
    const result = await verifyProviderHandleAuthority({ token, keyring: {}, expected, now: "2026-09-17T20:01:00Z" });
    expect(result).toEqual({ status: "held", reasons: ["authority_key_unavailable"] });
  });
});
