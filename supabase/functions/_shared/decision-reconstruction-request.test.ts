import { describe, expect, it } from "vitest";
import { decisionReconstructionStatus, parseDecisionReconstructionRequest } from "./decision-reconstruction-request";

describe("decision reconstruction request", () => {
  it("accepts exactly one question and retry identity", () => {
    expect(parseDecisionReconstructionRequest({
      questionId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "reconstruct:one",
    })).toEqual({
      questionId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "reconstruct:one",
    });
  });

  it("rejects client-supplied evidence or model choices", () => {
    expect(() => parseDecisionReconstructionRequest({
      questionId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "reconstruct:one",
      evidence: [],
    })).toThrow("request_shape_invalid");
    expect(() => parseDecisionReconstructionRequest({
      questionId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "reconstruct:one",
      model: "cheaper-model",
    })).toThrow("request_shape_invalid");
  });

  it("maps controlled database failures without leaking their details", () => {
    expect(decisionReconstructionStatus("brain_decision_ingress_forbidden")).toBe(403);
    expect(decisionReconstructionStatus("brain_decision_reconstruction_busy_retry")).toBe(409);
    expect(decisionReconstructionStatus("brain_decision_reconstruction_question_ineligible")).toBe(422);
    expect(decisionReconstructionStatus("unexpected provider text")).toBe(500);
  });
});
