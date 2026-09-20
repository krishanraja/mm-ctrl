import { describe, expect, it } from "vitest";
import {
  BrainCiphertextError,
  BrainCryptoConfigurationError,
  canonicalBrainCipherContext,
  decryptBrainField,
  encryptBrainField,
  type BrainCipherContext,
} from "./brain-crypto";

function key(seed: number): string {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => (seed + index) % 256);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

const context: BrainCipherContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  subjectId: "22222222-2222-4222-8222-222222222222",
  recordKind: "item_version",
  recordId: "33333333-3333-4333-8333-333333333333",
  field: "meaning",
};

describe("Brain field encryption", () => {
  it("round-trips UTF-8 with an exact 256-bit key", async () => {
    const keyring = { "brain-v1": key(3) };
    const envelope = await encryptBrainField({
      plaintext: "Judgement is accountable, not automated. 世界",
      context,
      keyring,
      activeKeyId: "brain-v1",
    });
    await expect(decryptBrainField({ envelope, context, keyring })).resolves.toBe(
      "Judgement is accountable, not automated. 世界",
    );
  });

  it("uses a fresh 96-bit IV for every encryption", async () => {
    const args = { plaintext: "same", context, keyring: { "brain-v1": key(7) }, activeKeyId: "brain-v1" };
    const first = JSON.parse(await encryptBrainField(args));
    const second = JSON.parse(await encryptBrainField(args));
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(decodeBase64Url(first.iv)).toHaveLength(12);
  });

  it("authenticates workspace, subject, record and field context", async () => {
    const keyring = { "brain-v1": key(11) };
    const envelope = await encryptBrainField({ plaintext: "private", context, keyring, activeKeyId: "brain-v1" });
    const moved = { ...context, recordId: "44444444-4444-4444-8444-444444444444" };
    await expect(decryptBrainField({ envelope, context: moved, keyring })).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("rejects tampering instead of returning replacement text", async () => {
    const keyring = { "brain-v1": key(13) };
    const envelope = JSON.parse(
      await encryptBrainField({ plaintext: "private", context, keyring, activeKeyId: "brain-v1" }),
    );
    envelope.ciphertext = `${envelope.ciphertext[0] === "A" ? "B" : "A"}${envelope.ciphertext.slice(1)}`;
    await expect(
      decryptBrainField({ envelope: JSON.stringify(envelope), context, keyring }),
    ).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("decrypts old envelopes through an explicit rotation keyring", async () => {
    const oldKeyring = { "brain-v1": key(17) };
    const envelope = await encryptBrainField({
      plaintext: "preserved",
      context,
      keyring: oldKeyring,
      activeKeyId: "brain-v1",
    });
    const rotated = { "brain-v1": key(17), "brain-v2": key(19) };
    await expect(decryptBrainField({ envelope, context, keyring: rotated })).resolves.toBe("preserved");
  });

  it("fails closed when the requested key is missing or not 32 bytes", async () => {
    await expect(
      encryptBrainField({ plaintext: "x", context, keyring: {}, activeKeyId: "brain-v1" }),
    ).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
    await expect(
      encryptBrainField({ plaintext: "x", context, keyring: { "brain-v1": btoa("short") }, activeKeyId: "brain-v1" }),
    ).rejects.toThrow(/exactly 32 bytes/);
  });

  it("rejects malformed envelopes and invalid row context", async () => {
    await expect(
      decryptBrainField({ envelope: "not-json", context, keyring: { "brain-v1": key(23) } }),
    ).rejects.toBeInstanceOf(BrainCiphertextError);
    expect(() => canonicalBrainCipherContext({ ...context, workspaceId: "not-a-uuid" })).toThrow(
      BrainCryptoConfigurationError,
    );
    expect(() => canonicalBrainCipherContext({ ...context, field: "unknown" as "meaning" })).toThrow(
      BrainCryptoConfigurationError,
    );
  });

  it("normalises UUID case into one stable associated-data value", () => {
    const upper = { ...context, workspaceId: context.workspaceId.toUpperCase() };
    expect(canonicalBrainCipherContext(upper)).toBe(canonicalBrainCipherContext(context));
  });

  it("keeps the legacy item-version associated-data bytes unchanged", () => {
    expect(canonicalBrainCipherContext(context)).toBe(
      '{"v":1,"workspace_id":"11111111-1111-4111-8111-111111111111","subject_id":"22222222-2222-4222-8222-222222222222","record_kind":"item_version","record_id":"33333333-3333-4333-8333-333333333333","field":"meaning"}',
    );
  });

  it("binds a prepared receipt payload to audience, purpose and exact authority", async () => {
    const receiptContext: BrainCipherContext = {
      workspaceId: "11111111-1111-4111-8111-111111111111",
      subjectId: "22222222-2222-4222-8222-222222222222",
      recordKind: "prepared_receipt",
      recordId: "55555555-5555-4555-8555-555555555555",
      field: "payload",
      audience: "person_private",
      purpose: "prepared_intelligence",
      authorityFingerprint: "a".repeat(64),
    };
    const keyring = { "brain-v1": key(29) };
    const envelope = await encryptBrainField({
      plaintext: "governed prepared intelligence",
      context: receiptContext,
      keyring,
      activeKeyId: "brain-v1",
    });
    await expect(decryptBrainField({ envelope, context: receiptContext, keyring })).resolves.toBe(
      "governed prepared intelligence",
    );
    await expect(decryptBrainField({
      envelope,
      context: { ...receiptContext, audience: "delivery_team_private" },
      keyring,
    })).rejects.toBeInstanceOf(BrainCiphertextError);
    await expect(decryptBrainField({
      envelope,
      context: { ...receiptContext, authorityFingerprint: "b".repeat(64) },
      keyring,
    })).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("rejects invalid record and field pairings even when each token is known", () => {
    expect(() => canonicalBrainCipherContext({
      ...context,
      recordKind: "source",
      field: "meaning",
    } as unknown as BrainCipherContext)).toThrow(/record kind and encrypted field do not match/);
  });

  it("rejects a prepared receipt without exact purpose or authority", () => {
    const receiptContext = {
      workspaceId: context.workspaceId,
      subjectId: context.subjectId,
      recordKind: "prepared_receipt",
      recordId: context.recordId,
      field: "payload",
      audience: "person_private",
      purpose: "other",
      authorityFingerprint: "not-a-fingerprint",
    } as unknown as BrainCipherContext;
    expect(() => canonicalBrainCipherContext(receiptContext)).toThrow(BrainCryptoConfigurationError);
  });
});
