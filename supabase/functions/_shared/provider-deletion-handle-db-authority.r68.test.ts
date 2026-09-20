import { describe, expect, it } from "vitest";
import type { ProviderDeletionHandleEnvelopeV1 } from "./provider-deletion-handle-crypto.r64";
import {
  fingerprintProviderDeletionHandleEnvelope,
  issueDatabaseVerifiableProviderHandleAuthority,
  verifyDatabaseVerifiableProviderHandleAuthority,
} from "./provider-deletion-handle-db-authority.r68";
import type {
  ExpectedProviderHandleAuthority,
  ProviderHandleAuthorityKeyring,
  ProviderHandleAuthorityRequest,
} from "./provider-deletion-handle-authority.r66";

const keyring: ProviderHandleAuthorityKeyring = {
  "vault-authority-v1": Buffer.alloc(32, 28).toString("base64"),
  "vault-authority-v2": Buffer.alloc(32, 29).toString("base64"),
};
const envelope: ProviderDeletionHandleEnvelopeV1 = {
  v: 1,
  alg: "A256GCM",
  kid: "handle-key-v1",
  iv: "abcdefghijklmnop",
  ciphertext: "abcdefghijklmnopqrstuvwxyzABCDE",
  aad_sha256: "a".repeat(64),
};
const identities = {
  authority_id: "68000000-0000-4000-8000-000000000001",
  workspace_id: "68000000-0000-4000-8000-000000000002",
  receipt_id: "68000000-0000-4000-8000-000000000003",
  handle_id: "68000000-0000-4000-8000-000000000004",
  actor_id: "68000000-0000-4000-8000-000000000005",
  job_id: "68000000-0000-4000-8000-000000000006",
  provider: "elevenlabs" as const,
  issued_at: "2026-09-17T20:00:00Z",
  expires_at: "2026-09-17T20:05:00Z",
};

async function fixture() {
  const fingerprint = await fingerprintProviderDeletionHandleEnvelope(envelope);
  const request: ProviderHandleAuthorityRequest = {
    ...identities,
    operation: "register",
    cipher_envelope_sha256: fingerprint,
  };
  const expected: ExpectedProviderHandleAuthority = {
    operation: "register",
    workspace_id: identities.workspace_id,
    receipt_id: identities.receipt_id,
    handle_id: identities.handle_id,
    provider: identities.provider,
    job_id: identities.job_id,
  };
  const token = await issueDatabaseVerifiableProviderHandleAuthority({
    request,
    keyring,
    activeKeyId: "vault-authority-v1",
  });
  return { expected, fingerprint, request, token };
}

describe("database-verifiable provider handle authority R68", () => {
  it("issues and verifies one compact R66 authority", async () => {
    const { expected, token } = await fixture();
    const result = await verifyDatabaseVerifiableProviderHandleAuthority({
      token, keyring, expected, now: "2026-09-17T20:04:59Z",
    });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.authority.role).toBe("provider_handle_crypto_writer");
      expect(result.token_sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("contains neither ciphertext nor a raw provider handle", async () => {
    const { token } = await fixture();
    expect(token).not.toContain(envelope.ciphertext);
    expect(token).not.toContain("generation_secret");
  });

  it("produces a stable field fingerprint without serialisation ambiguity", async () => {
    const first = await fingerprintProviderDeletionHandleEnvelope(envelope);
    const reordered = {
      aad_sha256: envelope.aad_sha256,
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      kid: envelope.kid,
      alg: envelope.alg,
      v: envelope.v,
    } as ProviderDeletionHandleEnvelopeV1;
    expect(await fingerprintProviderDeletionHandleEnvelope(reordered)).toBe(first);
    expect(first).toBe("18f551dfe7aae69e46d0646355dcb201be5f662335665776931e5bbeeb1f15f6");
  });

  it("changes the fingerprint when any ciphertext field changes", async () => {
    const original = await fingerprintProviderDeletionHandleEnvelope(envelope);
    await expect(fingerprintProviderDeletionHandleEnvelope({ ...envelope, ciphertext: `${envelope.ciphertext}x` }))
      .resolves.not.toBe(original);
  });

  it("rejects extra envelope fields", async () => {
    await expect(fingerprintProviderDeletionHandleEnvelope({ ...envelope, provider_handle: "generation_secret" } as ProviderDeletionHandleEnvelopeV1))
      .rejects.toThrow("provider_deletion_handle_cipher_envelope_invalid");
  });

  it.each([0, 1, 2])("rejects tampering with compact token segment %s", async (index) => {
    const { expected, token } = await fixture();
    const segments = token.split(".");
    segments[index] = `${segments[index].slice(0, -1)}${segments[index].endsWith("A") ? "B" : "A"}`;
    const result = await verifyDatabaseVerifiableProviderHandleAuthority({
      token: segments.join("."), keyring, expected, now: "2026-09-17T20:01:00Z",
    });
    expect(result.status).toBe("held");
  });

  it("rejects a non-canonical signature encoding with identical decoded bytes", async () => {
    const { expected, token } = await fixture();
    const segments = token.split(".");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const lastIndex = alphabet.indexOf(segments[2].at(-1) ?? "");
    const alternativeIndex = (lastIndex & 0b110000) | ((lastIndex + 1) & 0b001111);
    segments[2] = `${segments[2].slice(0, -1)}${alphabet[alternativeIndex]}`;
    expect(Buffer.from(segments[2], "base64url")).toEqual(Buffer.from(token.split(".")[2], "base64url"));
    await expect(verifyDatabaseVerifiableProviderHandleAuthority({
      token: segments.join("."), keyring, expected, now: "2026-09-17T20:01:00Z",
    })).resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["authority_signature_invalid"]) });
  });

  it("rejects an unknown verification key", async () => {
    const { expected, token } = await fixture();
    const result = await verifyDatabaseVerifiableProviderHandleAuthority({
      token, keyring: {}, expected, now: "2026-09-17T20:01:00Z",
    });
    expect(result).toEqual({ status: "held", reasons: ["authority_key_unavailable", "authority_payload_invalid"] });
  });

  it("retains R66 context and expiry checks", async () => {
    const { expected, token } = await fixture();
    const moved = await verifyDatabaseVerifiableProviderHandleAuthority({
      token,
      keyring,
      expected: { ...expected, workspace_id: "68000000-0000-4000-8000-000000000099" },
      now: "2026-09-17T20:01:00Z",
    });
    expect(moved.status).toBe("held");
    if (moved.status === "held") expect(moved.reasons).toContain("authority_workspace_mismatch");
    const expired = await verifyDatabaseVerifiableProviderHandleAuthority({
      token, keyring, expected, now: "2026-09-17T20:05:00Z",
    });
    expect(expired.status).toBe("held");
    if (expired.status === "held") expect(expired.reasons).toContain("authority_expired");
  });

  it("supports key rotation while refusing a relabelled token", async () => {
    const { request, expected } = await fixture();
    const rotated = await issueDatabaseVerifiableProviderHandleAuthority({ request, keyring, activeKeyId: "vault-authority-v2" });
    await expect(verifyDatabaseVerifiableProviderHandleAuthority({
      token: rotated, keyring, expected, now: "2026-09-17T20:01:00Z",
    })).resolves.toMatchObject({ status: "accepted" });
    const segments = rotated.split(".");
    const header = JSON.parse(Buffer.from(segments[0], "base64url").toString("utf8"));
    header.kid = "vault-authority-v1";
    segments[0] = Buffer.from(JSON.stringify(header)).toString("base64url");
    await expect(verifyDatabaseVerifiableProviderHandleAuthority({
      token: segments.join("."), keyring, expected, now: "2026-09-17T20:01:00Z",
    })).resolves.toMatchObject({ status: "held" });
  });
});
