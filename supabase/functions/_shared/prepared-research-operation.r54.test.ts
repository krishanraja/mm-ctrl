import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  prepareResearchOperation,
  type PrepareResearchOperationInput,
} from "./prepared-research-operation.r54";
import type { PublicSourceAdmissionDependencies } from "./public-source-admission.r52";

const now = new Date("2026-09-17T19:00:00.000Z");
const sha256 = async (value: string) => createHash("sha256").update(value).digest("hex");
const ids = {
  receipt: "54000000-0000-4000-8000-000000000001",
  workspace: "54000000-0000-4000-8000-000000000002",
};

function dependencies(): PublicSourceAdmissionDependencies {
  return {
    sha256,
    now: () => now,
    fetchPublicSource: vi.fn(async (url) => ({
      status: 200,
      final_url: url,
      content_type: "text/plain",
      body: "Public evidence about AI adoption in marketing across the UK.",
      fetched_at: "2026-09-17T18:59:00.000Z",
      verified_public_route: true,
    })),
  };
}

function webInput(overrides: Partial<PrepareResearchOperationInput> = {}): PrepareResearchOperationInput {
  return {
    schema_version: "ctrl.prepare-research-operation.r54",
    receipt_id: ids.receipt,
    workspace_id: ids.workspace,
    idempotency_key_sha256: "a".repeat(64),
    callsite: "supabase/functions/decision-engine/retrievers.ts",
    occurred_at: "2026-09-17T18:58:00.000Z",
    control_mode: "public_policy_default",
    control_evidence_sha256: "b".repeat(64),
    admission: {
      schema_version: "ctrl.public-source-admission.r52",
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: {
        schema_version: "ctrl.public-research-query.r50",
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "category_intelligence",
        terms: ["ai-adoption", "marketing", "uk"],
      },
    },
    ...overrides,
  };
}

describe("prepared research operation R54", () => {
  it("composes admitted public evidence into a non-dispatchable command and R51 receipt", async () => {
    const result = await prepareResearchOperation(webInput(), dependencies());
    expect(result.standing).toBe("receipt_required_before_dispatch");
    expect(result.provider_command).toEqual(expect.objectContaining({
      provider: "brave",
      outbound_query: "ai-adoption marketing uk",
      execute_authorized: false,
    }));
    expect(result.receipt_command).toEqual(expect.objectContaining({
      schema_version: "ctrl.provider-exchange-receipt.r51",
      processor_kind: "research",
      purpose_family: "research_and_enrichment",
      control_mode: "public_policy_default",
      query_minimization_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    }));
    expect(result.receipt_command.request_sha256).toBe(result.provider_command.request_sha256);
  });

  it("maps a fixed route to fixed control with no query-minimisation digest", async () => {
    const input = webInput({
      control_mode: "fixed_public_fetch",
      admission: {
        schema_version: "ctrl.public-source-admission.r52",
        admission_kind: "fixed_configuration",
        configuration_sha256: "c".repeat(64),
        query: {
          schema_version: "ctrl.public-research-query.r50",
          query_kind: "fixed_public_fetch",
          provider: "artificial_analysis",
          purpose: "category_intelligence",
        },
      },
    });
    const result = await prepareResearchOperation(input, dependencies());
    expect(result.provider_command.outbound_query).toBeNull();
    expect(result.receipt_command.query_minimization_sha256).toBeNull();
    expect(result.receipt_command.control_mode).toBe("fixed_public_fetch");
  });

  it.each([
    ["fixed route with ordinary policy", webInput({
      admission: {
        schema_version: "ctrl.public-source-admission.r52",
        admission_kind: "fixed_configuration",
        configuration_sha256: "c".repeat(64),
        query: { schema_version: "ctrl.public-research-query.r50", query_kind: "fixed_public_fetch", provider: "fixed_rss_publishers", purpose: "news_monitoring" },
      },
    })],
    ["public query with fixed mode", webInput({ control_mode: "fixed_public_fetch" })],
  ])("rejects %s", async (_label, input) => {
    await expect(prepareResearchOperation(input, dependencies()))
      .rejects.toThrow("research_operation_control_mode_mismatch");
  });

  it("preserves exact operation identity independently of the request digest", async () => {
    const result = await prepareResearchOperation(webInput(), dependencies());
    expect(result.receipt_command.idempotency_key_sha256).toBe("a".repeat(64));
    expect(result.receipt_command.request_sha256).not.toBe("a".repeat(64));
  });

  it("rejects a future occurrence time", async () => {
    await expect(prepareResearchOperation(webInput({
      occurred_at: "2026-09-17T19:00:01.000Z",
    }), dependencies())).rejects.toThrow("research_operation_time_invalid");
  });

  it("rejects malformed custody and operation identities", async () => {
    await expect(prepareResearchOperation(webInput({
      workspace_id: "not-a-workspace",
    }), dependencies())).rejects.toThrow("research_operation_identity_invalid");
    await expect(prepareResearchOperation(webInput({
      idempotency_key_sha256: "short",
    }), dependencies())).rejects.toThrow("research_operation_idempotency_invalid");
  });

  it("rejects unknown outer fields rather than carrying private context", async () => {
    await expect(prepareResearchOperation({
      ...webInput(),
      raw_decision: "Replace the current team.",
    }, dependencies())).rejects.toThrow("research_operation_shape_invalid");
  });

  it("keeps private fields blocked by the nested R52 and R50 contracts", async () => {
    const input = webInput();
    const admission = input.admission as Record<string, unknown>;
    admission.query = { ...(admission.query as object), leader_email: "leader@example.org" };
    await expect(prepareResearchOperation(input, dependencies()))
      .rejects.toThrow("public_research_query_shape_invalid");
  });
});
