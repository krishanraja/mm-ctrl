import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  admitPublicResearchQuery,
  type PublicSourceAdmissionDependencies,
} from "./public-source-admission.r52";

const now = new Date("2026-09-17T18:00:00.000Z");
const sha256 = async (value: string) => createHash("sha256").update(value).digest("hex");
const base = { schema_version: "ctrl.public-source-admission.r52" as const };
const queryBase = { schema_version: "ctrl.public-research-query.r50" as const };

function dependencies(overrides: Partial<PublicSourceAdmissionDependencies> = {}): PublicSourceAdmissionDependencies {
  return {
    sha256,
    now: () => now,
    fetchPublicSource: vi.fn(async (url) => ({
      status: 200,
      final_url: url,
      content_type: "text/html; charset=utf-8",
      body: "Aperture House develops AI adoption systems for marketing leaders in the UK.",
      fetched_at: "2026-09-17T17:59:00.000Z",
      verified_public_route: true,
    })),
    ...overrides,
  };
}

describe("public source admission R52", () => {
  it("admits a fixed route from its configuration digest without fetching", async () => {
    const deps = dependencies();
    const result = await admitPublicResearchQuery({
      ...base,
      admission_kind: "fixed_configuration",
      configuration_sha256: "a".repeat(64),
      query: {
        ...queryBase,
        query_kind: "fixed_public_fetch",
        provider: "artificial_analysis",
        purpose: "category_intelligence",
      },
    }, deps);
    expect(result.prepared_query.outbound_query).toBeNull();
    expect(result.evidence_count).toBe(1);
    expect(deps.fetchPublicSource).not.toHaveBeenCalled();
  });

  it("admits a company name found in current public evidence", async () => {
    const result = await admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://aperture.example.org/about"],
      query: {
        ...queryBase,
        query_kind: "public_company_name",
        provider: "people_data_labs",
        purpose: "company_enrichment",
        company_name: "Aperture House",
      },
    }, dependencies());
    expect(result.prepared_query.outbound_query).toBe("Aperture House");
    expect(result.public_source_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.source_locator_sha256[0]).not.toContain("aperture");
  });

  it("admits a domain when the public source is that domain", async () => {
    const result = await admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://example.org/"],
      query: {
        ...queryBase,
        query_kind: "public_domain",
        provider: "tranco",
        purpose: "company_enrichment",
        domain: "example.org",
      },
    }, dependencies());
    expect(result.prepared_query.outbound_query).toBe("example.org");
  });

  it("can evidence atomic public terms across bounded sources", async () => {
    const result = await admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://one.example.org/report", "https://two.example.org/news"],
      query: {
        ...queryBase,
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "category_intelligence",
        terms: ["ai-adoption", "marketing", "uk"],
      },
    }, dependencies());
    expect(result.evidence_count).toBe(2);
    expect(result.prepared_query.outbound_query).toBe("ai-adoption marketing uk");
  });

  it("rejects a query atom absent from the public evidence", async () => {
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: {
        ...queryBase,
        query_kind: "public_topic_terms",
        provider: "exa",
        purpose: "decision_evidence",
        terms: ["confidential", "margin"],
      },
    }, dependencies())).rejects.toThrow("public_source_query_not_evidenced");
  });

  it.each([
    "http://public.example.org/report",
    "https://user:secret@public.example.org/report",
    "https://public.example.org/report?leader=krish",
    "https://127.0.0.1/report",
    "https://service.internal/report",
  ])("rejects unsafe source locator %s", async (source) => {
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: [source],
      query: {
        ...queryBase,
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "decision_evidence",
        terms: ["ai-adoption", "marketing"],
      },
    }, dependencies())).rejects.toThrow("public_source_url_invalid");
  });

  it("rejects a fetcher that did not verify a public network route", async () => {
    const deps = dependencies({
      fetchPublicSource: vi.fn(async (url) => ({
        status: 200, final_url: url, content_type: "text/plain", body: "ai adoption marketing",
        fetched_at: "2026-09-17T17:59:00.000Z", verified_public_route: false,
      })),
    });
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: { ...queryBase, query_kind: "public_topic_terms", provider: "brave", purpose: "decision_evidence", terms: ["ai-adoption", "marketing"] },
    }, deps)).rejects.toThrow("public_source_route_unverified");
  });

  it("rejects stale evidence", async () => {
    const deps = dependencies({
      fetchPublicSource: vi.fn(async (url) => ({
        status: 200, final_url: url, content_type: "text/plain", body: "ai adoption marketing",
        fetched_at: "2026-09-17T17:00:00.000Z", verified_public_route: true,
      })),
    });
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: { ...queryBase, query_kind: "public_topic_terms", provider: "brave", purpose: "decision_evidence", terms: ["ai-adoption", "marketing"] },
    }, deps)).rejects.toThrow("public_source_freshness_invalid");
  });

  it("rejects an unsafe redirect target", async () => {
    const deps = dependencies({
      fetchPublicSource: vi.fn(async () => ({
        status: 200, final_url: "https://localhost/private", content_type: "text/plain",
        body: "ai adoption marketing", fetched_at: "2026-09-17T17:59:00.000Z",
        verified_public_route: true,
      })),
    });
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: { ...queryBase, query_kind: "public_topic_terms", provider: "brave", purpose: "decision_evidence", terms: ["ai-adoption", "marketing"] },
    }, deps)).rejects.toThrow("public_source_url_invalid");
  });

  it("maps transport failure to a bounded error", async () => {
    const deps = dependencies({ fetchPublicSource: vi.fn(async () => { throw new Error("private transport detail"); }) });
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: { ...queryBase, query_kind: "public_topic_terms", provider: "brave", purpose: "decision_evidence", terms: ["ai-adoption", "marketing"] },
    }, deps)).rejects.toThrow("public_source_fetch_failed");
  });

  it("rejects private source fields through the nested R50 boundary", async () => {
    await expect(admitPublicResearchQuery({
      ...base,
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: {
        ...queryBase,
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "decision_evidence",
        terms: ["ai-adoption", "marketing"],
        interview_answer: "I might replace the team.",
      },
    }, dependencies())).rejects.toThrow("public_research_query_shape_invalid");
  });
});
