import { describe, expect, it } from "vitest";
import {
  buildStandardChangeCandidate,
  checkStandardChangeCandidate,
  compileStandardChange,
  type ChangeRequestPacket,
} from "./standard-change-core.ts";
import { sha256Identifier } from "./public-request-guard.ts";

const hash = (value: string) => sha256Identifier(value);
const holdoutReceipt = {
  manifest_sha256: "9".repeat(64),
  item_count: 3,
  intersection_count: 0,
};

async function request(type: "false_positive" | "uncovered" | "drift" = "false_positive"): Promise<{
  packet: ChangeRequestPacket;
  sourceBody: string;
}> {
  const sourceBody = "# Standard\n\n## Clear claim\nName the decision and the evidence.\n";
  const sourceSha = await hash(sourceBody);
  return {
    sourceBody,
    packet: {
      id: "10000000-0000-4000-8000-000000000001",
      version: 1,
      request_hash: "a".repeat(64),
      surface: "proposal",
      accepted_scope: type === "drift"
        ? { freshness_decision: "revise" }
        : { accepted_surface: "proposal", accepted_delta: "Treat this check as advisory.", apply_change: false },
      proposal: {
        id: "20000000-0000-4000-8000-000000000001",
        proposal_hash: "b".repeat(64),
        type,
        surface: "proposal",
        headline: "A bounded change",
        delta_text: type === "drift" ? null : "Treat this check as advisory.",
        evidence: type === "drift"
          ? {
            source_ids: [],
            criterion_id: "30000000-0000-4000-8000-000000000001",
            criterion_name: "Clear claim",
            opportunities: 2,
            last_fired_week: null,
          }
          : type === "uncovered"
          ? { source_ids: ["run-1:event-1", "run-2:event-1"], topic: "Name the real customer proof" }
          : {
            source_ids: ["run-1:event-1", "run-2:event-1"],
            criterion_id: "30000000-0000-4000-8000-000000000001",
            criterion_name: "Clear claim",
            surfaces: ["proposal"],
          },
      },
      decision: { id: "40000000-0000-4000-8000-000000000001", decision_hash: "c".repeat(64) },
      source: {
        standard_artifact_id: "50000000-0000-4000-8000-000000000001",
        standard_sha256: sourceSha,
        source_snapshot: "d".repeat(64),
        source_manifest_sha256: "e".repeat(64),
        evidence_ids: ["run-1:event-1", "run-2:event-1"],
        evidence_bindings: type === "drift" ? [] : ["run-1:event-1", "run-2:event-1"].map((source_id) => ({
          source_id,
          surface: "proposal",
          signal: "output",
          criterion_id: "30000000-0000-4000-8000-000000000001",
          criterion_name: "Clear claim",
          verdict: "breaks",
          disposition: "rejected",
        })),
        opportunity_bindings: [
          { run_id: "run-1", surface: "proposal" },
          { run_id: "run-2", surface: "proposal" },
        ],
        criteria: [{
          id: "30000000-0000-4000-8000-000000000001",
          surface: "proposal",
          name: "Clear claim",
          check_text: "Name the decision and the evidence.",
          observable: "has_number",
          weight: "essential",
          disposition: "blocking",
          disc_verdict: "keep",
          version: 3,
        }],
      },
    },
  };
}

describe("standard change candidate pipeline", () => {
  it("compiles an accepted false-positive change without applying it", async () => {
    const { packet } = await request();
    const result = await compileStandardChange(packet);
    expect(result.compiled.candidate_status).toBe("compiled");
    expect(result.compiled.amendment.operation).toBe("narrow_applicability");
    expect(result.compiled.boundaries).toEqual({
      active_standard_mutated: false,
      deploy_authorized: false,
      holdout_ids_loaded: [],
      owner_apply_required: true,
    });
    expect(JSON.stringify(result.compiled)).not.toContain("quote");
  });

  it("keeps an uncovered rule awaiting real observable and discrimination evidence", async () => {
    const { packet } = await request("uncovered");
    const result = await compileStandardChange(packet);
    expect(result.compiled.candidate_status).toBe("needs_evidence");
    expect(result.compiled.amendment.activation).toBe("forbidden_pending_evidence");
    expect(result.compiled.amendment.unresolved).toEqual(expect.arrayContaining([
      "checkable_observable",
      "contrast_evidence",
      "training_discrimination",
    ]));
  });

  it("does not invent a drift revision when the owner has not supplied one", async () => {
    const { packet } = await request("drift");
    const result = await compileStandardChange(packet);
    expect(result.compiled.candidate_status).toBe("needs_evidence");
    expect(result.compiled.amendment.unresolved).toContain("bounded_replacement_instruction");
    expect(result.compiled.amendment.unresolved).not.toContain("source_opportunity_binding");
  });

  it("carries a frozen absence proof through Compile and Check for drift", async () => {
    const { packet, sourceBody } = await request("drift");
    packet.accepted_scope = { freshness_decision: "retain" };
    const compiled = await compileStandardChange(packet);
    expect(compiled.compiled.candidate_status).toBe("no_change");
    expect(compiled.compiled.amendment.opportunity_run_ids).toEqual(["run-1", "run-2"]);
    expect(compiled.compiled.amendment.unresolved).toEqual([]);
    const build = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    const checked = await checkStandardChangeCandidate({
      request: packet,
      compiled: compiled.compiled,
      compile_sha256: compiled.compile_sha256,
      build,
      source_body: sourceBody,
      current_standard_artifact_id: packet.source.standard_artifact_id,
      current_standard_sha256: packet.source.standard_sha256,
      holdout_receipt: holdoutReceipt,
    });
    expect(checked.verdict).toBe("passed");
    expect(checked.findings.find((item) => item.criterion_id === "provenance.evidence")?.status)
      .toBe("holds");
  });

  it("rebuilds identical frozen inputs to identical bytes and hashes", async () => {
    const { packet, sourceBody } = await request();
    const compiled = await compileStandardChange(packet);
    const first = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    const second = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    expect(second).toEqual(first);
    expect(first.runtime_body).toContain("This package is not active");
    expect(first.runtime_body).not.toContain("run-1:event-1\nrun-2:event-1\n## Current standard");
  });

  it("passes a complete bounded candidate while keeping release closed", async () => {
    const { packet, sourceBody } = await request();
    const compiled = await compileStandardChange(packet);
    const build = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    const checked = await checkStandardChangeCandidate({
      request: packet,
      compiled: compiled.compiled,
      compile_sha256: compiled.compile_sha256,
      build,
      source_body: sourceBody,
      current_standard_artifact_id: packet.source.standard_artifact_id,
      current_standard_sha256: packet.source.standard_sha256,
      holdout_receipt: holdoutReceipt,
    });
    expect(checked.verdict).toBe("passed");
    expect(checked.findings.every((item) => item.status === "holds")).toBe(true);
    expect(checked.release.apply_authorized).toBe(false);
  });

  it("blocks a tampered build and a stale source", async () => {
    const { packet, sourceBody } = await request();
    const compiled = await compileStandardChange(packet);
    const build = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    build.runtime_body += "tampered";
    const checked = await checkStandardChangeCandidate({
      request: packet,
      compiled: compiled.compiled,
      compile_sha256: compiled.compile_sha256,
      build,
      source_body: sourceBody,
      current_standard_artifact_id: "90000000-0000-4000-8000-000000000009",
      current_standard_sha256: "f".repeat(64),
      holdout_receipt: holdoutReceipt,
    });
    expect(checked.verdict).toBe("blocked");
    expect(checked.findings.find((item) => item.criterion_id === "source.current")?.status).toBe("breaks");
    expect(checked.findings.find((item) => item.criterion_id === "build.deterministic")?.status).toBe("breaks");
  });

  it("returns needs-evidence instead of averaging unresolved gaps away", async () => {
    const { packet, sourceBody } = await request("uncovered");
    const compiled = await compileStandardChange(packet);
    const build = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    const checked = await checkStandardChangeCandidate({
      request: packet,
      compiled: compiled.compiled,
      compile_sha256: compiled.compile_sha256,
      build,
      source_body: sourceBody,
      current_standard_artifact_id: packet.source.standard_artifact_id,
      current_standard_sha256: packet.source.standard_sha256,
      holdout_receipt: holdoutReceipt,
    });
    expect(checked.verdict).toBe("needs_evidence");
    expect(checked.findings.find((item) => item.criterion_id === "change.new")?.status)
      .toBe("insufficient-evidence");
  });

  it("refuses evidence bound to a criterion on another surface", async () => {
    const { packet } = await request();
    packet.source.criteria[0].surface = "briefing";
    packet.source.evidence_bindings.forEach((binding) => { binding.surface = "briefing"; });
    const compiled = await compileStandardChange(packet);
    expect(compiled.compiled.candidate_status).toBe("needs_evidence");
    expect(compiled.compiled.amendment.target_criterion).toBeNull();
    expect(compiled.compiled.amendment.unresolved).toContain("source_evidence_binding");
  });

  it("blocks a candidate without a clean database-side holdout receipt", async () => {
    const { packet, sourceBody } = await request();
    const compiled = await compileStandardChange(packet);
    const build = await buildStandardChangeCandidate(compiled.compiled, compiled.compile_sha256, sourceBody);
    const checked = await checkStandardChangeCandidate({
      request: packet,
      compiled: compiled.compiled,
      compile_sha256: compiled.compile_sha256,
      build,
      source_body: sourceBody,
      current_standard_artifact_id: packet.source.standard_artifact_id,
      current_standard_sha256: packet.source.standard_sha256,
      holdout_receipt: { ...holdoutReceipt, intersection_count: 1 },
    });
    expect(checked.verdict).toBe("blocked");
    expect(checked.findings.find((item) => item.criterion_id === "holdout.exclusion")?.status).toBe("breaks");
  });
});
