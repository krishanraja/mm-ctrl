import { describe, expect, it } from "vitest";
import {
  DecisionCandidateProjectionInputError,
  parseDecisionCandidateProjectionRequest,
} from "./decision-candidate-projection-core";

const candidateId = "14700000-0000-4000-8000-000000000001";

describe("decision candidate projection request", () => {
  it("defaults to the minimum projection", () => {
    expect(parseDecisionCandidateProjectionRequest({ candidateId })).toEqual({
      candidateId,
      includeBasis: false,
    });
  });

  it("admits the deeper basis only when explicitly requested", () => {
    expect(parseDecisionCandidateProjectionRequest({ candidateId, includeBasis: true })).toEqual({
      candidateId,
      includeBasis: true,
    });
  });

  it.each([
    null,
    {},
    { candidateId: "not-a-uuid" },
    { candidateId, includeBasis: "yes" },
    { candidateId, includeBasis: false, extra: true },
  ])("fails closed for malformed input %#", (value) => {
    expect(() => parseDecisionCandidateProjectionRequest(value)).toThrow(DecisionCandidateProjectionInputError);
  });
});
