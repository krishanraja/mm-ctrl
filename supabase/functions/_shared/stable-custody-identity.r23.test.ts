import { describe, expect, it } from "vitest";
import {
  BrainCiphertextError,
  decryptBrainField,
  encryptBrainField,
  type BrainCipherContext,
} from "./brain-crypto";
import {
  buildPreparedAuthorityEnvelope,
  type AuthorityEnvelopeInput,
  type AuthorityReference,
} from "./prepared-intelligence-authority-envelope.r7";

const ids = {
  receipt: "10000000-0000-4000-8000-000000000001",
  workspace: "20000000-0000-4000-8000-000000000001",
  historicalOwner: "30000000-0000-4000-8000-000000000001",
  replacementOperator: "30000000-0000-4000-8000-000000000002",
  subject: "40000000-0000-4000-8000-000000000001",
  brain: "50000000-0000-4000-8000-000000000001",
};

function key(seed: number): string {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => (seed + index) % 256);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const dependency = (ownerId: string): AuthorityReference => ({
  workspace_id: ids.workspace,
  owner_id: ownerId,
  subject_id: ids.subject,
  audience: "person_private",
  purpose: "prepared_intelligence",
  authority_kind: "brain_item_version",
  authority_record_id: ids.brain,
  authority_version: "v3",
  authority_sha256: "a".repeat(64),
  observed_at: "2026-09-17T09:00:00+01:00",
});

const input = (ownerId: string): AuthorityEnvelopeInput => ({
  receipt_id: ids.receipt,
  scope: {
    workspace_id: ids.workspace,
    owner_id: ownerId,
    subject_id: ids.subject,
    audience: "customer_private",
    purpose: "prepared_intelligence",
  },
  dependencies: [dependency(ownerId)],
  current_authority: [dependency(ownerId)],
});

describe("stable custody identity R23", () => {
  it("keeps an old prepared receipt decryptable after current custody transfers", async () => {
    const original = await buildPreparedAuthorityEnvelope(input(ids.historicalOwner));
    expect(original.status).toBe("accepted");
    if (original.status !== "accepted") return;

    const context: BrainCipherContext = {
      workspaceId: ids.workspace,
      subjectId: ids.subject,
      recordKind: "prepared_receipt",
      recordId: ids.receipt,
      field: "payload",
      audience: "person_private",
      purpose: "prepared_intelligence",
      authorityFingerprint: original.envelope.authority_fingerprint,
    };
    const keyring = { "brain-v1": key(31) };
    const ciphertext = await encryptBrainField({
      plaintext: "historical evidence remains readable",
      context,
      keyring,
      activeKeyId: "brain-v1",
    });

    const currentCustody = { operator_principal_id: ids.replacementOperator };
    expect(currentCustody.operator_principal_id).not.toBe(original.envelope.owner_id);
    await expect(decryptBrainField({ envelope: ciphertext, context, keyring })).resolves.toBe(
      "historical evidence remains readable",
    );
  });

  it("proves that rewriting historical owner identity during transfer breaks authenticated context", async () => {
    const original = await buildPreparedAuthorityEnvelope(input(ids.historicalOwner));
    const rewritten = await buildPreparedAuthorityEnvelope(input(ids.replacementOperator));
    expect(original.status).toBe("accepted");
    expect(rewritten.status).toBe("accepted");
    if (original.status !== "accepted" || rewritten.status !== "accepted") return;
    expect(rewritten.envelope.authority_fingerprint).not.toBe(original.envelope.authority_fingerprint);

    const keyring = { "brain-v1": key(37) };
    const originalContext: BrainCipherContext = {
      workspaceId: ids.workspace,
      subjectId: ids.subject,
      recordKind: "prepared_receipt",
      recordId: ids.receipt,
      field: "payload",
      audience: "person_private",
      purpose: "prepared_intelligence",
      authorityFingerprint: original.envelope.authority_fingerprint,
    };
    const ciphertext = await encryptBrainField({
      plaintext: "do not rewrite history",
      context: originalContext,
      keyring,
      activeKeyId: "brain-v1",
    });

    await expect(decryptBrainField({
      envelope: ciphertext,
      context: {
        ...originalContext,
        authorityFingerprint: rewritten.envelope.authority_fingerprint,
      },
      keyring,
    })).rejects.toBeInstanceOf(BrainCiphertextError);
  });
});
