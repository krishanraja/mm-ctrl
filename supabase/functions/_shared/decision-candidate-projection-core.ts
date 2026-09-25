const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DecisionCandidateProjectionRequest = {
  candidateId: string;
  includeBasis: boolean;
};

export class DecisionCandidateProjectionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionCandidateProjectionInputError";
  }
}
export function parseDecisionCandidateProjectionRequest(raw: unknown): DecisionCandidateProjectionRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new DecisionCandidateProjectionInputError("body_invalid");
  }
  const value = raw as Record<string, unknown>;
  const keys = Object.keys(value);
  if (!Object.hasOwn(value, "candidateId") || keys.some((key) => !["candidateId", "includeBasis"].includes(key))) {
    throw new DecisionCandidateProjectionInputError("body_shape_invalid");
  }
  if (typeof value.candidateId !== "string" || !UUID.test(value.candidateId)) {
    throw new DecisionCandidateProjectionInputError("candidate_id_invalid");
  }
  if (value.includeBasis !== undefined && typeof value.includeBasis !== "boolean") {
    throw new DecisionCandidateProjectionInputError("include_basis_invalid");
  }
  return {
    candidateId: value.candidateId.toLowerCase(),
    includeBasis: value.includeBasis === true,
  };
}
