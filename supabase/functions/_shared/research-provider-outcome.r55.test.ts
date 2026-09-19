import { createHash, createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { prepareResearchOperation } from "./prepared-research-operation.r54";
import type { PublicSourceAdmissionDependencies } from "./public-source-admission.r52";
import {
  classifyResearchProviderOutcome,
  type ResearchProviderOutcomeDependencies,
  type ResearchProviderOutcomeInput,
} from "./research-provider-outcome.r55";

const now = new Date("2026-09-17T20:00:00.000Z");
const sha256 = async (value: string) => createHash("sha256").update(value).digest("hex");
const admissionDependencies: PublicSourceAdmissionDependencies = {
  sha256,
  now: () => now,
  fetchPublicSource: vi.fn(async (url) => ({
    status: 200,
    final_url: url,
    content_type: "text/plain",
    body: "Public reporting on AI adoption and marketing.",
    fetched_at: "2026-09-17T19:58:00.000Z",
    verified_public_route: true,
  })),
};
const outcomeDependencies: ResearchProviderOutcomeDependencies = {
  sha256,
  now: () => now,
  hmacProviderRequestIdentity: async (provider, raw) => createHmac("sha256", "test-key")
    .update(`${provider}\n${raw}`)
    .digest("hex"),
};

async function prepared(controlMode: "public_policy_default" | "request_verified_zdr" = "public_policy_default") {
  return prepareResearchOperation({
    schema_version: "ctrl.prepare-research-operation.r54",
    receipt_id: "55000000-0000-4000-8000-000000000001",
    workspace_id: "55000000-0000-4000-8000-000000000002",
    idempotency_key_sha256: "a".repeat(64),
    callsite: "supabase/functions/decision-engine/retrievers.ts",
    occurred_at: "2026-09-17T19:57:00.000Z",
    control_mode: controlMode,
    control_evidence_sha256: "b".repeat(64),
    admission: {
      schema_version: "ctrl.public-source-admission.r52",
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: {
        schema_version: "ctrl.public-research-query.r50",
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "decision_evidence",
        terms: ["ai-adoption", "marketing"],
      },
    },
  }, admissionDependencies);
}

function outcome(overrides: Partial<ResearchProviderOutcomeInput> = {}): ResearchProviderOutcomeInput {
  return {
    schema_version: "ctrl.research-provider-outcome.r55",
    event_id: "55000000-0000-4000-8000-000000000010",
    idempotency_key_sha256: "c".repeat(64),
    outcome: "accepted",
    provider_request_id: "req_abc-123",
    provider_response_sha256: "d".repeat(64),
    response_control_sha256: null,
    occurred_at: "2026-09-17T19:59:00.000Z",
    ...overrides,
  };
}

describe("research provider outcome R55", () => {
  it("turns an accepted response into a bound R51 event without the raw request ID", async () => {
    const command = await classifyResearchProviderOutcome(
      await prepared(), outcome(), outcomeDependencies,
    );
    expect(command).toEqual(expect.objectContaining({
      schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
      receipt_id: "55000000-0000-4000-8000-000000000001",
      event_kind: "accepted",
      provider_request_identity_hmac: expect.stringMatching(/^[0-9a-f]{64}$/),
      evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    }));
    expect(JSON.stringify(command)).not.toContain("req_abc-123");
  });

  it.each(["rejected", "outcome_unknown"] as const)("represents %s without invented provider identity", async (kind) => {
    const command = await classifyResearchProviderOutcome(
      await prepared(), outcome({ outcome: kind, provider_request_id: null }), outcomeDependencies,
    );
    expect(command.event_kind).toBe(kind);
    expect(command.provider_request_identity_hmac).toBeNull();
  });

  it("requires response proof when zero retention is verified per request", async () => {
    await expect(classifyResearchProviderOutcome(
      await prepared("request_verified_zdr"), outcome(), outcomeDependencies,
    )).rejects.toThrow("research_outcome_request_control_evidence_required");
    const command = await classifyResearchProviderOutcome(
      await prepared("request_verified_zdr"),
      outcome({ response_control_sha256: "e".repeat(64) }),
      outcomeDependencies,
    );
    expect(command.event_kind).toBe("accepted");
  });

  it("rejects an invalid HMAC result", async () => {
    await expect(classifyResearchProviderOutcome(
      await prepared(),
      outcome(),
      { ...outcomeDependencies, hmacProviderRequestIdentity: async () => "not-a-hmac" },
    )).rejects.toThrow("research_outcome_provider_request_hmac_invalid");
  });

  it.each([
    "2026-09-17T19:56:59.000Z",
    "2026-09-17T20:00:01.000Z",
  ])("rejects event time outside the receipt-to-now interval", async (occurredAt) => {
    await expect(classifyResearchProviderOutcome(
      await prepared(), outcome({ occurred_at: occurredAt }), outcomeDependencies,
    )).rejects.toThrow("research_outcome_time_invalid");
  });

  it("rejects malformed raw provider identity before HMAC", async () => {
    await expect(classifyResearchProviderOutcome(
      await prepared(), outcome({ provider_request_id: "request id with spaces" }), outcomeDependencies,
    )).rejects.toThrow("research_outcome_provider_request_identity_invalid");
  });

  it("rejects a prepared command whose provider and receipt disagree", async () => {
    const operation = await prepared();
    operation.provider_command.provider = "exa";
    await expect(classifyResearchProviderOutcome(operation, outcome(), outcomeDependencies))
      .rejects.toThrow("research_outcome_prepared_operation_invalid");
  });

  it("rejects unknown outcome fields rather than persisting response content", async () => {
    await expect(classifyResearchProviderOutcome(
      await prepared(),
      { ...outcome(), response_body: "raw provider response" },
      outcomeDependencies,
    )).rejects.toThrow("research_outcome_shape_invalid");
  });
});
