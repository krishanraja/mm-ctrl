import { describe, expect, it } from "vitest";
import {
  BrainIngestContractError,
  assertBrainIngestKey,
  canonicalBrainJson,
  fingerprintBrainIngestPayload,
  resolveBrainIngestReplay,
} from "./brain-ingest-core";

describe("Brain ingest idempotency", () => {
  it("canonicalises object keys without reordering arrays", () => {
    const left = { z: 1, nested: { b: true, a: "x" }, sequence: ["first", "second"] } as const;
    const right = { sequence: ["first", "second"], nested: { a: "x", b: true }, z: 1 } as const;
    expect(canonicalBrainJson(left)).toBe(canonicalBrainJson(right));
    expect(canonicalBrainJson({ sequence: ["second", "first"] })).not.toBe(canonicalBrainJson(left));
  });

  it("produces the same SHA-256 for semantically identical JSON objects", async () => {
    await expect(fingerprintBrainIngestPayload({ b: 2, a: 1 })).resolves.toBe(
      await fingerprintBrainIngestPayload({ a: 1, b: 2 }),
    );
  });

  it("allows a first write and an exact replay", () => {
    const hash = "a".repeat(64);
    expect(resolveBrainIngestReplay({ ingestKey: "meeting:2026-09-08:001", incomingPayloadSha256: hash, existingPayloadSha256: null })).toBe("create");
    expect(resolveBrainIngestReplay({ ingestKey: "meeting:2026-09-08:001", incomingPayloadSha256: hash, existingPayloadSha256: hash })).toBe("replay");
  });

  it("rejects reuse of a key for a different payload", () => {
    expect(() => resolveBrainIngestReplay({
      ingestKey: "meeting:2026-09-08:001",
      incomingPayloadSha256: "a".repeat(64),
      existingPayloadSha256: "b".repeat(64),
    })).toThrow(/different payload/);
  });

  it("rejects weak keys and non-finite JSON numbers", () => {
    expect(() => assertBrainIngestKey("short")).toThrow(BrainIngestContractError);
    expect(() => canonicalBrainJson(Number.NaN)).toThrow(BrainIngestContractError);
    expect(() => resolveBrainIngestReplay({
      ingestKey: "meeting:2026-09-08:001",
      incomingPayloadSha256: "a".repeat(64),
      existingPayloadSha256: "corrupt",
    })).toThrow(/Stored Brain ingest payload fingerprint is invalid/);
  });
});
