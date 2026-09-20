import { describe, expect, it } from "vitest";
import {
  createPortableBrainPackage,
  PORTABLE_BRAIN_SCHEMA,
  stableStringify,
  validatePortableBrainPackage,
} from "./portable-brain-package";

const input = {
  facts: [{
    fact_key: "quality_rule",
    fact_category: "preference",
    fact_label: "Quality rule",
    fact_value: "Make the standard visible before delegating.",
    fact_context: "A direct observation.",
    confidence_score: 0.9,
    is_high_stakes: true,
    verification_status: "verified",
    source_type: "voice",
    temperature: "hot",
    tags: ["judgement", "quality"],
    fact_subtype: "work_style",
    importance: 9,
    created_at: "2026-09-18T09:00:00.000Z",
  }],
  patterns: [{
    pattern_type: "strength",
    pattern_text: "Finds quality failures before the metric reveals them.",
    confidence: 0.8,
    evidence_count: 3,
    status: "confirmed",
    explanation: "Seen in three decisions.",
    created_at: "2026-09-18T10:00:00.000Z",
  }],
  decisions: [{
    decision_text: "Prove the system before replacing the team.",
    rationale: "Separates incentive failure from capability failure.",
    context_snapshot: { route: "prove_first" },
    status: "active",
    source: "voice",
    created_at: "2026-09-18T11:00:00.000Z",
  }],
};

describe("portable Brain package", () => {
  it("produces byte-stable content independent of input ordering", async () => {
    const first = await createPortableBrainPackage(input);
    const second = await createPortableBrainPackage({ ...input, facts: [...input.facts].reverse() });
    expect(stableStringify(first)).toBe(stableStringify(second));
    expect(first.schema_version).toBe(PORTABLE_BRAIN_SCHEMA);
    expect(first.manifest.counts).toEqual({ facts: 1, patterns: 1, decisions: 1, total: 3 });
  });

  it("round-trips an intact package", async () => {
    const built = await createPortableBrainPackage(input);
    await expect(validatePortableBrainPackage(JSON.parse(JSON.stringify(built)))).resolves.toEqual(built);
  });

  it("rejects hidden fields and changed content", async () => {
    const hidden = await createPortableBrainPackage(input);
    (hidden as unknown as Record<string, unknown>).owner_id = "not-allowed";
    await expect(validatePortableBrainPackage(hidden)).rejects.toThrow("package_keys_invalid");

    const changed = await createPortableBrainPackage(input);
    changed.records.facts[0].data.fact_value = "Changed after export";
    await expect(validatePortableBrainPackage(changed)).rejects.toThrow("portable_brain_record_integrity_failed");
  });

  it("rejects duplicate record keys", async () => {
    const built = await createPortableBrainPackage({ ...input, facts: [...input.facts, { ...input.facts[0] }] });
    await expect(validatePortableBrainPackage(built)).rejects.toThrow("portable_brain_duplicate_record_key");
  });
});
