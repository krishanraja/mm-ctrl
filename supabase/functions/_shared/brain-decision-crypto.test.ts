import { describe, expect, it } from "vitest";
import {
  BrainDecisionCiphertextError,
  BrainDecisionCryptoConfigurationError,
  brainDecisionCipherAadSha256,
  brainDecisionRequestFingerprint,
  canonicalBrainDecisionCipherContext,
  decryptBrainDecisionField,
  encryptBrainDecisionField,
  parseBrainDecisionKeyring,
  type BrainDecisionCipherContext,
} from "./brain-decision-crypto";

function key(seed: number): string {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => (seed + index) % 256);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const context: BrainDecisionCipherContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  subjectId: "22222222-2222-4222-8222-222222222222",
  recordId: "33333333-3333-4333-8333-333333333333",
  recordKind: "decision_question",
  field: "prompt",
};

describe("consequential decision field encryption", () => {
  it("matches the database canonical context and frozen AAD digest", async () => {
    expect(canonicalBrainDecisionCipherContext(context)).toBe(
      '{"v":1,"schema_version":"ctrl.brain-decision-cipher-context.r142","workspace_id":"11111111-1111-4111-8111-111111111111","subject_id":"22222222-2222-4222-8222-222222222222","record_kind":"decision_question","record_id":"33333333-3333-4333-8333-333333333333","field":"prompt"}',
    );
    await expect(brainDecisionCipherAadSha256(context)).resolves.toBe(
      "64bfa65aa7c8d443576b0da40a27bec2fb4e3fe9807b3a84fa6705495975aef6",
    );
  });

  it("round-trips private Unicode text and emits the exact six-key envelope", async () => {
    const keyring = { "decision-v1": key(3) };
    const envelope = await encryptBrainDecisionField({
      plaintext: "What would make this the wrong call? 世界",
      context,
      keyring,
      activeKeyId: "decision-v1",
    });
    expect(Object.keys(JSON.parse(envelope)).sort()).toEqual(
      ["aad_sha256", "alg", "ciphertext", "iv", "kid", "v"],
    );
    await expect(decryptBrainDecisionField({ envelope, context, keyring })).resolves.toBe(
      "What would make this the wrong call? 世界",
    );
  });

  it("uses a fresh IV and refuses a moved field or record", async () => {
    const keyring = { "decision-v1": key(7) };
    const args = { plaintext: "private", context, keyring, activeKeyId: "decision-v1" };
    const first = await encryptBrainDecisionField(args);
    const second = await encryptBrainDecisionField(args);
    expect(JSON.parse(first).iv).not.toBe(JSON.parse(second).iv);
    await expect(decryptBrainDecisionField({
      envelope: first,
      context: { ...context, field: "guidance" },
      keyring,
    })).rejects.toBeInstanceOf(BrainDecisionCiphertextError);
    await expect(decryptBrainDecisionField({
      envelope: first,
      context: { ...context, recordId: "44444444-4444-4444-8444-444444444444" },
      keyring,
    })).rejects.toBeInstanceOf(BrainDecisionCiphertextError);
  });

  it("rejects invalid record/field pairs, unknown keys and extra envelope properties", async () => {
    expect(() => canonicalBrainDecisionCipherContext({
      ...context,
      recordKind: "decision_call",
      field: "prompt",
    })).toThrow(BrainDecisionCryptoConfigurationError);
    await expect(encryptBrainDecisionField({
      plaintext: "x",
      context,
      keyring: {},
      activeKeyId: "decision-v1",
    })).rejects.toBeInstanceOf(BrainDecisionCryptoConfigurationError);

    const envelope = JSON.parse(await encryptBrainDecisionField({
      plaintext: "x",
      context,
      keyring: { "decision-v1": key(11) },
      activeKeyId: "decision-v1",
    }));
    envelope.extra = true;
    await expect(decryptBrainDecisionField({
      envelope: JSON.stringify(envelope),
      context,
      keyring: { "decision-v1": key(11) },
    })).rejects.toBeInstanceOf(BrainDecisionCiphertextError);
  });

  it("supports isolated source, assertion and candidate contexts", async () => {
    const keyring = parseBrainDecisionKeyring(JSON.stringify({ "decision-v1": key(17) }));
    for (const value of [
      { recordKind: "decision_source" as const, field: "content" as const },
      { recordKind: "decision_assertion" as const, field: "statement" as const },
      { recordKind: "decision_candidate" as const, field: "claim" as const },
    ]) {
      const scopedContext = { ...context, ...value };
      const envelope = await encryptBrainDecisionField({
        plaintext: "The evidence suggests this, but the leader has not confirmed it.",
        context: scopedContext,
        keyring,
        activeKeyId: "decision-v1",
      });
      await expect(decryptBrainDecisionField({ envelope, context: scopedContext, keyring }))
        .resolves.toContain("has not confirmed");
    }
  });

  it("parses bounded keyrings and creates stable keyed request fingerprints", async () => {
    const encoded = key(23);
    expect(parseBrainDecisionKeyring(JSON.stringify({ "decision-v1": encoded })))
      .toEqual({ "decision-v1": encoded });
    expect(() => parseBrainDecisionKeyring("{}"))
      .toThrow(BrainDecisionCryptoConfigurationError);
    const material = '{"v":1,"answer":"yes"}';
    const first = await brainDecisionRequestFingerprint({ integrityKey: encoded, material });
    const second = await brainDecisionRequestFingerprint({ integrityKey: encoded, material });
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
    await expect(brainDecisionRequestFingerprint({ integrityKey: key(24), material }))
      .resolves.not.toBe(first);
  });
});
