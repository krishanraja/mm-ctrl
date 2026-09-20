import { describe, expect, it } from "vitest";
import {
  prepareIntelligence,
  type PreparedDecisionReturn,
  type PreparedIntelligenceInput,
  type PreparedNewsSignal,
} from "./prepared-intelligence.r1";

const baseEvidence = (overrides = {}) => ({
  evidence_id: "ev-1",
  source_name: "Reuters",
  url: "https://example.com/reuters/ai-market",
  observed_at: "2026-09-17T07:00:00+01:00",
  standing: "primary" as const,
  subject_id: "leader-1",
  audience: "customer_private" as const,
  ...overrides,
});

const news = (overrides: Partial<PreparedNewsSignal> = {}): PreparedNewsSignal => ({
  kind: "news_signal",
  signal_id: "news-1",
  subject_id: "leader-1",
  audience: "customer_private",
  purpose: "prepared_intelligence",
  title: "A competitor moved its research workflow to agents",
  body: "The change reduced the time between fan-signal detection and campaign testing.",
  why_it_matters: "This could change the evidence needed before the current marketing operating-model decision.",
  selection_reason: "Selected because it bears directly on the active marketing operating-model decision.",
  relevance_score: 0.78,
  context_refs: ["brain:decision-14", "brain:objective-2"],
  evidence: [baseEvidence()],
  feedback_fingerprint: "feedback-news-1-v1",
  topic_keys: ["marketing", "category-intelligence"],
  category: "product",
  source_count: 1,
  ...overrides,
});

const decisionReturn = (overrides: Partial<PreparedDecisionReturn> = {}): PreparedDecisionReturn => ({
  kind: "decision_return",
  signal_id: "decision-return-1",
  subject_id: "leader-1",
  audience: "customer_private",
  purpose: "prepared_intelligence",
  title: "An assumption behind the team redesign has moved",
  body: "The pilot now shows that quality transfer, not tool access, is the current constraint.",
  why_it_matters: "This changes which route should be tested before replacing the division.",
  selection_reason: "Selected because a load-bearing assumption in the active decision has changed.",
  relevance_score: 0.91,
  context_refs: ["brain:decision-14", "brain:criterion-7"],
  evidence: [baseEvidence({ evidence_id: "ev-decision-1", standing: "decision_observation" })],
  feedback_fingerprint: "feedback-decision-return-1-v1",
  topic_keys: ["team-design", "quality-transfer"],
  decision_case_id: "decision-14",
  decision_statement: "Whether to rebuild marketing around AI and replace the current division",
  trigger_kind: "evidence_shifted",
  ...overrides,
});

const input = (candidates = [news()]): PreparedIntelligenceInput => ({
  subject_id: "leader-1",
  audience: "customer_private",
  purpose: "prepared_intelligence",
  context_version: "brain-v14",
  selector_version: "selector-v1",
  generated_at: "2026-09-17T08:00:00+01:00",
  candidates,
});

describe("prepared intelligence R1", () => {
  it("projects one governed object into read and audio without semantic drift", () => {
    const result = prepareIntelligence(input([news(), decisionReturn()]));
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;

    expect(result.object.signals.map((signal) => signal.kind)).toEqual(["decision_return", "news_signal"]);
    expect(result.object.read_projection.source_object_id).toBe(result.object.prepared_object_id);
    expect(result.object.audio_projection.source_object_id).toBe(result.object.prepared_object_id);
    expect(result.object.audio_projection.block_ids).toEqual(result.object.read_projection.block_ids);
    expect(result.object.audio_projection.block_ids).toEqual(result.object.content_blocks.map((block) => block.block_id));
    expect(result.object.audio_projection.spoken_text).toContain(result.object.content_blocks[0].title);
    expect(result.object.audio_projection.spoken_text).toContain(result.object.content_blocks[1].why_it_matters);
    expect(result.object.selection_receipts).toEqual([
      {
        signal_id: "decision-return-1",
        context_refs: ["brain:criterion-7", "brain:decision-14"],
        selection_reason: "Selected because a load-bearing assumption in the active decision has changed.",
      },
      {
        signal_id: "news-1",
        context_refs: ["brain:decision-14", "brain:objective-2"],
        selection_reason: "Selected because it bears directly on the active marketing operating-model decision.",
      },
    ]);
  });

  it("is deterministic under candidate and evidence reordering", () => {
    const second = baseEvidence({
      evidence_id: "ev-2",
      source_name: "Financial Times",
      url: "https://example.com/ft/ai-market",
      standing: "corroborated",
    });
    const a = prepareIntelligence(input([news({ evidence: [baseEvidence(), second], source_count: 2 }), decisionReturn()]));
    const b = prepareIntelligence(input([decisionReturn(), news({ evidence: [second, baseEvidence()], source_count: 2 })]));
    expect(a).toEqual(b);
  });

  it("holds quietly when no intervention is earned", () => {
    expect(prepareIntelligence(input([]))).toEqual({
      status: "held",
      reasons: ["quiet_no_earned_intervention"],
      rejected: [],
    });
  });

  it("rejects thin unqualified single-source news", () => {
    const weak = news({ evidence: [baseEvidence({ standing: "corroborated" })] });
    const result = prepareIntelligence(input([weak]));
    expect(result).toEqual({
      status: "held",
      reasons: ["no_candidate_cleared_governance"],
      rejected: [{ signal_id: "news-1", reason: "news_standing_too_thin" }],
    });
  });

  it("accepts a qualified reputable single-source item without inventing corroboration", () => {
    const result = prepareIntelligence(input([news({ evidence: [baseEvidence({ standing: "reputable_single" })] })]));
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;
    expect(result.object.signals[0]).toMatchObject({ source_count: 1 });
    expect(result.object.provenance).toHaveLength(1);
  });

  it("fails a cross-audience evidence reference closed", () => {
    const result = prepareIntelligence(input([news({ evidence: [baseEvidence({ audience: "operator_private" })] })]));
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("evidence_audience_mismatch");
  });

  it("does not prepare a decision return without real decision linkage", () => {
    const result = prepareIntelligence(input([decisionReturn({ decision_case_id: "" })]));
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("decision_linkage_invalid");
  });

  it("does not prepare a decision return from ordinary news standing alone", () => {
    const result = prepareIntelligence(input([decisionReturn({ evidence: [baseEvidence()] })]));
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("decision_trigger_evidence_missing");
  });

  it("respects durable negative feedback before presentation", () => {
    const request = input([news()]);
    request.suppressed_fingerprints = ["feedback-news-1-v1"];
    const result = prepareIntelligence(request);
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("suppressed_by_feedback");
  });

  it("respects an explicit topic exclusion before presentation", () => {
    const request = input([news()]);
    request.excluded_topic_keys = ["marketing"];
    const result = prepareIntelligence(request);
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("excluded_by_user_control");
  });

  it("holds the whole object on duplicate signal identity", () => {
    const result = prepareIntelligence(input([news(), news()]));
    expect(result).toEqual({ status: "held", reasons: ["duplicate_signal_identity"], rejected: [] });
  });

  it("retains feedback and correction controls without exposing implementation metadata to projections", () => {
    const result = prepareIntelligence(input([decisionReturn()]));
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;
    expect(result.object.controls.feedback_targets).toEqual([
      { signal_id: "decision-return-1", feedback_fingerprint: "feedback-decision-return-1-v1" },
    ]);
    expect(result.object.controls.correction_dependency_ids).toEqual(["brain:criterion-7", "brain:decision-14"]);
    expect(result.object.read_projection).not.toHaveProperty("feedback_fingerprint");
    expect(result.object.audio_projection).not.toHaveProperty("feedback_fingerprint");
  });

  it("rejects unknown runtime enum values rather than routing them by accident", () => {
    const candidate = news() as PreparedNewsSignal & { kind: string };
    candidate.kind = "generic_signal";
    const result = prepareIntelligence(input([candidate as PreparedNewsSignal]));
    expect(result.status).toBe("held");
    if (result.status !== "held") return;
    expect(result.rejected[0].reason).toBe("signal_kind_invalid");
  });

  it("holds invalid feedback controls at the envelope boundary", () => {
    const request = input([news()]);
    request.suppressed_fingerprints = ["not allowed whitespace"];
    expect(prepareIntelligence(request)).toEqual({
      status: "held",
      reasons: ["suppression_control_invalid"],
      rejected: [],
    });
  });

  it("canonicalises accepted copy before both projections are built", () => {
    const result = prepareIntelligence(input([news({ title: "  A precise move  ", body: "  Evidence moved.  " })]));
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;
    expect(result.object.signals[0].title).toBe("A precise move");
    expect(result.object.content_blocks[0].title).toBe("A precise move");
    expect(result.object.audio_projection.spoken_text).toContain("A precise move. Evidence moved.");
  });

  it("holds the whole object when one evidence identity names conflicting facts", () => {
    const conflicting = decisionReturn({
      evidence: [
        baseEvidence({
          evidence_id: "ev-1",
          source_name: "Board observation",
          url: "https://example.com/decision/observation",
          standing: "decision_observation",
        }),
      ],
    });
    const result = prepareIntelligence(input([news(), conflicting]));
    expect(result).toEqual({ status: "held", reasons: ["evidence_identity_collision"], rejected: [] });
  });
});
