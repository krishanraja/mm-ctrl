import { describe, expect, it } from "vitest";
import { BrainCiphertextError, BrainCryptoConfigurationError } from "./brain-crypto";
import {
  canonicalPreparedCustodyCipherContext,
  decryptPreparedCustodyPayload,
  encryptPreparedCustodyPayload,
  type PreparedCustodyCipherContext,
} from "./prepared-custody-crypto.r26";

function key(seed: number): string {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => (seed + index) % 256);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const context: PreparedCustodyCipherContext = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  custodyPrincipalId: "22222222-2222-4222-8222-222222222222",
  subjectId: "33333333-3333-4333-8333-333333333333",
  recordId: "44444444-4444-4444-8444-444444444444",
  audience: "person_private",
  purpose: "prepared_intelligence",
  authorityFingerprint: "a".repeat(64),
};

describe("prepared custody payload encryption R26", () => {
  it("round-trips a custody-native prepared payload", async () => {
    const keyring = { "custody-v2": key(3) };
    const envelope = await encryptPreparedCustodyPayload({
      plaintext: "The customer Brain survives a change of operator. 世界",
      context,
      keyring,
      activeKeyId: "custody-v2",
    });
    await expect(decryptPreparedCustodyPayload({ envelope, context, keyring })).resolves.toBe(
      "The customer Brain survives a change of operator. 世界",
    );
  });

  it("has exact stable associated-data bytes with no operator, login or legacy owner", () => {
    const canonical = canonicalPreparedCustodyCipherContext(context);
    expect(canonical).toBe(
      '{"v":2,"schema_version":"ctrl.brain-prepared-custody-cipher-context.r26","workspace_id":"11111111-1111-4111-8111-111111111111","custody_principal_id":"22222222-2222-4222-8222-222222222222","subject_id":"33333333-3333-4333-8333-333333333333","record_kind":"prepared_custody_receipt","record_id":"44444444-4444-4444-8444-444444444444","field":"payload","audience":"person_private","purpose":"prepared_intelligence","authority_fingerprint":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
    );
    expect(canonical).not.toMatch(/owner_id|operator_principal_id|user_id/);
  });

  it("rejects an operator or login identity smuggled into the authenticated context", () => {
    expect(() => canonicalPreparedCustodyCipherContext({
      ...context,
      operatorPrincipalId: "55555555-5555-4555-8555-555555555555",
    } as never)).toThrow(/context shape is invalid/);
  });

  it.each([
    ["workspace", { workspaceId: "55555555-5555-4555-8555-555555555555" }],
    ["custody", { custodyPrincipalId: "55555555-5555-4555-8555-555555555555" }],
    ["subject", { subjectId: "55555555-5555-4555-8555-555555555555" }],
    ["receipt", { recordId: "55555555-5555-4555-8555-555555555555" }],
    ["audience", { audience: "delivery_team_private" as const }],
    ["authority", { authorityFingerprint: "b".repeat(64) }],
  ])("fails decryption when %s identity changes", async (_label, changed) => {
    const keyring = { "custody-v2": key(7) };
    const envelope = await encryptPreparedCustodyPayload({
      plaintext: "private",
      context,
      keyring,
      activeKeyId: "custody-v2",
    });
    await expect(decryptPreparedCustodyPayload({
      envelope,
      context: { ...context, ...changed },
      keyring,
    })).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("uses a fresh 96-bit IV and authenticates ciphertext", async () => {
    const args = { plaintext: "same", context, keyring: { "custody-v2": key(11) }, activeKeyId: "custody-v2" };
    const first = JSON.parse(await encryptPreparedCustodyPayload(args));
    const second = JSON.parse(await encryptPreparedCustodyPayload(args));
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    first.ciphertext = `${first.ciphertext[0] === "A" ? "B" : "A"}${first.ciphertext.slice(1)}`;
    await expect(decryptPreparedCustodyPayload({
      envelope: JSON.stringify(first),
      context,
      keyring: args.keyring,
    })).rejects.toBeInstanceOf(BrainCiphertextError);
  });

  it("decrypts through an explicit rotation keyring", async () => {
    const envelope = await encryptPreparedCustodyPayload({
      plaintext: "preserved",
      context,
      keyring: { "custody-v2": key(13) },
      activeKeyId: "custody-v2",
    });
    await expect(decryptPreparedCustodyPayload({
      envelope,
      context,
      keyring: { "custody-v2": key(13), "custody-v3": key(17) },
    })).resolves.toBe("preserved");
  });

  it("rejects malformed envelopes, bad keys and invalid context", async () => {
    await expect(decryptPreparedCustodyPayload({
      envelope: "not-json",
      context,
      keyring: { "custody-v2": key(19) },
    })).rejects.toBeInstanceOf(BrainCiphertextError);
    await expect(encryptPreparedCustodyPayload({
      plaintext: "x",
      context,
      keyring: {},
      activeKeyId: "custody-v2",
    })).rejects.toBeInstanceOf(BrainCryptoConfigurationError);
    expect(() => canonicalPreparedCustodyCipherContext({
      ...context,
      custodyPrincipalId: "not-a-uuid",
    })).toThrow(BrainCryptoConfigurationError);
  });

  it("does not accept a legacy v1 envelope as custody-native ciphertext", async () => {
    const legacyShape = JSON.stringify({
      v: 1,
      alg: "A256GCM",
      kid: "custody-v2",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "AAAAAAAAAAAAAAAAAAAAAA",
      aad_sha256: "a".repeat(64),
    });
    await expect(decryptPreparedCustodyPayload({
      envelope: legacyShape,
      context,
      keyring: { "custody-v2": key(23) },
    })).rejects.toBeInstanceOf(BrainCiphertextError);
  });
});
