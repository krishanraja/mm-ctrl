import { describe, expect, it, vi } from "vitest";
import {
  DecisionIngressInputError,
  canonicalDecisionIngressFingerprintMaterial,
  decisionIngressErrorStatus,
  parseDecisionIngressRequest,
} from "./decision-ingress-core";

const questionId = "11111111-1111-4111-8111-111111111111";
const candidateId = "22222222-2222-4222-8222-222222222222";

describe("decision ingress request contract", () => {
  it("accepts the three bounded actions and canonicalises timestamps", () => {
    vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
    const staged = parseDecisionIngressRequest({
      action: "stage_candidate",
      questionId,
      sourceType: "document",
      sourceText: "  Board paper evidence  ",
      candidateText: "  The current plan assumes demand holds.  ",
      capturedAt: "2026-09-25T10:00:00Z",
      idempotencyKey: "candidate:one",
    });
    expect(staged).toMatchObject({ sourceText: "Board paper evidence", candidateText: "The current plan assumes demand holds." });
    expect(canonicalDecisionIngressFingerprintMaterial(staged)).toContain('"source_type":"document"');

    expect(parseDecisionIngressRequest({
      action: "answer_question",
      questionId,
      answer: "Start with one region and preserve a stop rule.",
      recordedAt: "2026-09-25T11:00:00Z",
      idempotencyKey: "answer:direct:one",
    }).action).toBe("answer_question");

    expect(parseDecisionIngressRequest({
      action: "review_candidate",
      candidateId,
      disposition: "rejected",
      reviewedAt: "2026-09-25T11:30:00Z",
      idempotencyKey: "candidate:reject:one",
    }).action).toBe("review_candidate");
    vi.useRealTimers();
  });

  it("keeps correction explicit and rejects ambiguous or extra input", () => {
    vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
    expect(() => parseDecisionIngressRequest({
      action: "review_candidate",
      candidateId,
      disposition: "corrected",
      reviewedAt: "2026-09-25T11:30:00Z",
      idempotencyKey: "candidate:correct:one",
    })).toThrow(DecisionIngressInputError);
    expect(() => parseDecisionIngressRequest({
      action: "review_candidate",
      candidateId,
      disposition: "rejected",
      answer: "No",
      reviewedAt: "2026-09-25T11:30:00Z",
      idempotencyKey: "candidate:reject:two",
    })).toThrow("answer_not_allowed");
    expect(() => parseDecisionIngressRequest({
      action: "answer_question",
      questionId,
      answer: "Yes",
      recordedAt: "2026-09-25T11:00:00Z",
      idempotencyKey: "answer:direct:two",
      hidden: true,
    })).toThrow("body_shape_invalid");
    vi.useRealTimers();
  });

  it("maps database failures without exposing private details", () => {
    expect(decisionIngressErrorStatus("brain_decision_question_not_found")).toBe(404);
    expect(decisionIngressErrorStatus("brain_decision_ingress_forbidden")).toBe(403);
    expect(decisionIngressErrorStatus("brain_decision_candidate_already_reviewed")).toBe(409);
    expect(decisionIngressErrorStatus("brain_decision_governing_lock_busy_retry")).toBe(503);
    expect(decisionIngressErrorStatus("unexpected internal detail")).toBe(500);
  });
});
