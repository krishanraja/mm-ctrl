import { describe, expect, it } from "vitest";
import { BrainCiphertextError, BrainCryptoConfigurationError, type BrainKeyring } from "./brain-crypto";
import {
  decryptProviderDeletionHandle,
  encryptProviderDeletionHandle,
  type ProviderDeletionHandleContext,
} from "./provider-deletion-handle-crypto.r64";

const keyring: BrainKeyring = {
  "handle-key-v1": Buffer.alloc(32, 1).toString("base64"),
  "handle-key-v2": Buffer.alloc(32, 2).toString("base64"),
};
const base: ProviderDeletionHandleContext = {
  workspaceId: "64000000-0000-4000-8000-000000000001",
  receiptId: "64000000-0000-4000-8000-000000000002",
  handleId: "64000000-0000-4000-8000-000000000003",
  provider: "elevenlabs",
  retentionClass: "exchange_window",
  createdAt: "2026-09-17T20:00:00Z",
  expiresAt: "2026-10-17T20:00:00Z",
  purpose: "provider_deletion",
};

describe("provider deletion handle crypto R64", () => {
  it("round-trips an encrypted ElevenLabs handle without exposing it", async () => {
    const raw = "generation_01K5G4KX8J";
    const envelope = await encryptProviderDeletionHandle({ providerHandle: raw, context: base, keyring, activeKeyId: "handle-key-v1" });
    expect(envelope).not.toContain(raw);
    await expect(decryptProviderDeletionHandle({ envelope, context: base, keyring })).resolves.toBe(raw);
  });

  it.each([
    ["workspace", { workspaceId: "64000000-0000-4000-8000-000000000099" }],
    ["receipt", { receiptId: "64000000-0000-4000-8000-000000000099" }],
    ["handle", { handleId: "64000000-0000-4000-8000-000000000099" }],
    ["expiry", { expiresAt: "2026-10-16T20:00:00Z" }],
  ])("rejects moving ciphertext across %s context", async (_label, change) => {
    const envelope = await encryptProviderDeletionHandle({ providerHandle: "generation_context_bound", context: base, keyring, activeKeyId: "handle-key-v1" });
    await expect(decryptProviderDeletionHandle({ envelope, context: { ...base, ...change }, keyring })).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("supports key rotation without relabeling old ciphertext", async () => {
    const oldEnvelope = await encryptProviderDeletionHandle({ providerHandle: "cus_old", context: { ...base, provider: "stripe", retentionClass: "account_lifetime", expiresAt: null }, keyring, activeKeyId: "handle-key-v1" });
    const newEnvelope = await encryptProviderDeletionHandle({ providerHandle: "cus_new", context: { ...base, provider: "stripe", retentionClass: "account_lifetime", expiresAt: null }, keyring, activeKeyId: "handle-key-v2" });
    expect(JSON.parse(oldEnvelope).kid).toBe("handle-key-v1");
    expect(JSON.parse(newEnvelope).kid).toBe("handle-key-v2");
    await expect(decryptProviderDeletionHandle({ envelope: oldEnvelope, context: { ...base, provider: "stripe", retentionClass: "account_lifetime", expiresAt: null }, keyring })).resolves.toBe("cus_old");
  });

  it("enforces a bounded exchange window", async () => {
    await expect(encryptProviderDeletionHandle({
      providerHandle: "generation_too_long",
      context: { ...base, expiresAt: "2026-11-17T20:00:00Z" },
      keyring,
      activeKeyId: "handle-key-v1",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
    await expect(encryptProviderDeletionHandle({
      providerHandle: "generation_past",
      context: { ...base, expiresAt: "2026-09-16T20:00:00Z" },
      keyring,
      activeKeyId: "handle-key-v1",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
  });

  it("ties Stripe custody to account closure instead of a calendar expiry", async () => {
    await expect(encryptProviderDeletionHandle({
      providerHandle: "cus_account_lifetime",
      context: { ...base, provider: "stripe", retentionClass: "account_lifetime", expiresAt: null },
      keyring,
      activeKeyId: "handle-key-v1",
    })).resolves.toBeTypeOf("string");
    await expect(encryptProviderDeletionHandle({
      providerHandle: "cus_wrong_expiry",
      context: { ...base, provider: "stripe", retentionClass: "account_lifetime" },
      keyring,
      activeKeyId: "handle-key-v1",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
  });

  it("rejects provider and retention-class substitution", async () => {
    await expect(encryptProviderDeletionHandle({
      providerHandle: "generation_wrong_class",
      context: { ...base, retentionClass: "account_lifetime", expiresAt: null },
      keyring,
      activeKeyId: "handle-key-v1",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
    await expect(encryptProviderDeletionHandle({
      providerHandle: "cus_wrong_class",
      context: { ...base, provider: "stripe" },
      keyring,
      activeKeyId: "handle-key-v1",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
  });

  it("rejects whitespace, control characters and oversized raw handles", async () => {
    for (const providerHandle of ["has space", "line\nbreak", "x".repeat(513)]) {
      await expect(encryptProviderDeletionHandle({ providerHandle, context: base, keyring, activeKeyId: "handle-key-v1" }))
        .rejects.toBeInstanceOf(BrainCryptoConfigurationError);
    }
  });
});
