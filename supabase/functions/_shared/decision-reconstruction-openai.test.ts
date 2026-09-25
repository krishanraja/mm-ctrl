import { describe, expect, it, vi } from "vitest";
import {
  buildDecisionReconstructionOpenAIRequest,
  DECISION_RECONSTRUCTION_MODEL,
  reconstructDecisionWithOpenAI,
} from "./decision-reconstruction-openai";

const ids = {
  decision: "11111111-1111-4111-8111-111111111111",
  version: "22222222-2222-4222-8222-222222222222",
  question: "33333333-3333-4333-8333-333333333333",
  atomA: "44444444-4444-4444-8444-444444444444",
  atomB: "55555555-5555-4555-8555-555555555555",
  assertionA: "66666666-6666-4666-8666-666666666666",
  assertionB: "77777777-7777-4777-8777-777777777777",
};

const input = {
  decisionId: ids.decision,
  decisionVersionId: ids.version,
  questionId: ids.question,
  decision: {
    title: "Rebuild the marketing division around AI",
    stakes: "The division costs £2.4m and produces 18 LinkedIn posts a week.",
    humanPrior: "Prove the new operating system before replacing the whole team.",
  },
  question: "What would justify rebuilding the division rather than changing its operating system?",
  evidence: [
    {
      evidenceAtomId: ids.atomA,
      assertionId: ids.assertionA,
      stance: "supports",
      sourceType: "document",
      epistemicBasis: "observed",
      capturedAt: "2026-09-24T09:00:00.000Z",
      text: "The division costs £2.4m and spends 64 staff hours each week producing 18 LinkedIn posts.",
    },
    {
      evidenceAtomId: ids.atomB,
      assertionId: ids.assertionB,
      stance: "refutes",
      sourceType: "meeting",
      epistemicBasis: "user_stated",
      capturedAt: "2026-09-24T10:00:00.000Z",
      text: "Two people cut campaign preparation from five days to one after changing the operating system.",
    },
  ],
};

function providerResponse(output: unknown, overrides: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({
    id: "resp_r150",
    object: "response",
    status: "completed",
    model: "gpt-5.6-sol-2026-09-01",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }],
    usage: { input_tokens: 1000, output_tokens: 200 },
    ...overrides,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

const candidate = {
  status: "candidate",
  claim: "The £2.4m division has an operating-system bottleneck before it has a whole-team replacement case.",
  decisionImpact: "Test the five-day preparation cycle across the division before changing headcount.",
  countercase: "Two people already cut preparation to one day, so capability is not uniformly absent.",
  uncertainty: "Adoption beyond those two people has not been observed.",
  reason: null,
  gap: null,
  nextBestAction: null,
  evidenceRefs: [
    { evidenceAtomId: ids.atomA, stance: "supports" },
    { evidenceAtomId: ids.atomB, stance: "refutes" },
  ],
};

describe("decision reconstruction OpenAI adapter", () => {
  it("builds a non-stored strict-schema request for the fixed reasoning model", () => {
    const request = buildDecisionReconstructionOpenAIRequest(input) as any;
    expect(request.model).toBe(DECISION_RECONSTRUCTION_MODEL);
    expect(request.store).toBe(false);
    expect(request.max_output_tokens).toBe(4000);
    expect(request.reasoning.effort).toBe("high");
    expect(request.text.verbosity).toBe("low");
    expect(request.text.format.strict).toBe(true);
    expect(request.text.format.schema.type).toBe("object");
    expect(request.input[0].role).toBe("developer");
  });

  it("returns a semantically validated candidate and auditable cost receipt", async () => {
    const fetchImpl = vi.fn(async () => providerResponse(candidate)) as unknown as typeof fetch;
    const output = await reconstructDecisionWithOpenAI({ apiKey: "test-key-with-more-than-twenty-characters", input, fetchImpl });
    expect(output.result.status).toBe("candidate");
    expect(output.receipt).toMatchObject({
      provider: "openai",
      inputTokens: 1000,
      outputTokens: 200,
      estimatedCostMicrousd: 8000,
      responseId: "resp_r150",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("supports an honest abstention without manufacturing candidate fields", async () => {
    const abstention = {
      status: "abstain",
      claim: null,
      decisionImpact: null,
      countercase: null,
      uncertainty: null,
      reason: "evidence_too_thin",
      gap: "The evidence does not show whether the one-day result transfers beyond two people.",
      nextBestAction: {
        kind: "ask_leader",
        prompt: "Which recent campaign best shows whether the rest of the team can use the same operating system?",
      },
      evidenceRefs: [{ evidenceAtomId: ids.atomB, stance: "context" }],
    };
    const output = await reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl: vi.fn(async () => providerResponse(abstention)) as unknown as typeof fetch,
    });
    expect(output.result.status).toBe("abstain");
  });

  it("rejects branch leakage, provider refusal and incomplete output", async () => {
    const leaked = { ...candidate, reason: "evidence_too_thin" };
    await expect(reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl: vi.fn(async () => providerResponse(leaked)) as unknown as typeof fetch,
    })).rejects.toThrow("provider_candidate_branch_invalid");

    await expect(reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl: vi.fn(async () => providerResponse(candidate, {
        output: [{ type: "message", content: [{ type: "refusal", refusal: "No" }] }],
      })) as unknown as typeof fetch,
    })).rejects.toThrow("provider_refused");

    await expect(reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl: vi.fn(async () => providerResponse(candidate, { status: "incomplete" })) as unknown as typeof fetch,
    })).rejects.toThrow("provider_response_incomplete");
  });

  it("does not let strict JSON bypass the semantic generic-language gate", async () => {
    const generic = {
      ...candidate,
      claim: "A balanced approach may benefit from focusing on the right business priorities.",
    };
    await expect(reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl: vi.fn(async () => providerResponse(generic)) as unknown as typeof fetch,
    })).rejects.toThrow("candidate_claim_generic");
  });

  it("does not fall back after provider or credential failure", async () => {
    const fetchImpl = vi.fn(async () => new Response("unavailable", { status: 503 })) as unknown as typeof fetch;
    await expect(reconstructDecisionWithOpenAI({
      apiKey: "test-key-with-more-than-twenty-characters",
      input,
      fetchImpl,
    })).rejects.toThrow("provider_http_503");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await expect(reconstructDecisionWithOpenAI({ apiKey: "short", input, fetchImpl })).rejects.toThrow("provider_key_unavailable");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
