import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { preparePublicResearchQuery } from "./public-research-query.r50";

const proof = "a".repeat(64);
const sha256 = async (value: string) => createHash("sha256").update(value).digest("hex");
const base = {
  schema_version: "ctrl.public-research-query.r50" as const,
  public_source_sha256: proof,
};

describe("public research query boundary R50", () => {
  it("constructs only the fixed context-free request for a fixed provider", async () => {
    const result = await preparePublicResearchQuery({
      ...base,
      query_kind: "fixed_public_fetch",
      provider: "artificial_analysis",
      purpose: "category_intelligence",
    }, { sha256 });
    expect(result).toMatchObject({
      provider: "artificial_analysis",
      outbound_query: null,
      data_classes: ["public_web_content"],
    });
  });

  it("normalises a verified public company name without accepting surrounding prose", async () => {
    const result = await preparePublicResearchQuery({
      ...base,
      query_kind: "public_company_name",
      provider: "people_data_labs",
      purpose: "company_enrichment",
      company_name: "  Aperture   House Ltd  ",
    }, { sha256 });
    expect(result.outbound_query).toBe("Aperture House Ltd");
    expect(result.data_classes).toEqual(["company_identifier"]);
  });

  it("normalises a bare public domain", async () => {
    const result = await preparePublicResearchQuery({
      ...base,
      query_kind: "public_domain",
      provider: "tranco",
      purpose: "company_enrichment",
      domain: "Example.COM",
    }, { sha256 });
    expect(result.outbound_query).toBe("example.com");
  });

  it("constructs a bounded topic query from atomic public terms", async () => {
    const result = await preparePublicResearchQuery({
      ...base,
      query_kind: "public_topic_terms",
      provider: "brave",
      purpose: "category_intelligence",
      terms: ["AI-adoption", "marketing", "uk"],
    }, { sha256 });
    expect(result.outbound_query).toBe("ai-adoption marketing uk");
    expect(result.data_classes).toEqual(["public_web_content", "search_query"]);
    expect(result.query_minimization_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for an exact admitted request", async () => {
    const input = {
      ...base,
      query_kind: "public_topic_terms",
      provider: "newsapi",
      purpose: "news_monitoring",
      terms: ["semiconductors", "capacity", "europe"],
    };
    const first = await preparePublicResearchQuery(input, { sha256 });
    const second = await preparePublicResearchQuery(input, { sha256 });
    expect(second).toEqual(first);
  });

  it.each([
    ["email", { ...base, query_kind: "public_domain", provider: "tranco", purpose: "company_enrichment", domain: "leader@example.com" }],
    ["URL", { ...base, query_kind: "public_domain", provider: "builtwith", purpose: "company_enrichment", domain: "https://example.com/path" }],
    ["sentence", { ...base, query_kind: "public_topic_terms", provider: "perplexity", purpose: "decision_evidence", terms: ["our confidential pricing", "customers"] }],
    ["named private prose", { ...base, query_kind: "public_topic_terms", provider: "exa", purpose: "decision_evidence", terms: ["Krish Raja", "hesitates"] }],
    ["duplicate term", { ...base, query_kind: "public_topic_terms", provider: "gdelt", purpose: "news_monitoring", terms: ["marketing", "marketing"] }],
  ])("rejects %s rather than redacting it", async (_label, input) => {
    await expect(preparePublicResearchQuery(input, { sha256 }))
      .rejects.toThrow(/public_research_(domain|topic_terms)_invalid/);
  });

  it("rejects an unproved public source", async () => {
    await expect(preparePublicResearchQuery({
      ...base,
      public_source_sha256: "unproved",
      query_kind: "public_topic_terms",
      provider: "tavily",
      purpose: "decision_evidence",
      terms: ["category", "economics"],
    }, { sha256 })).rejects.toThrow("public_research_public_source_proof_required");
  });

  it("rejects private-source fields instead of silently dropping them", async () => {
    await expect(preparePublicResearchQuery({
      ...base,
      query_kind: "public_topic_terms",
      provider: "brave",
      purpose: "decision_evidence",
      terms: ["brand", "strategy"],
      interview_answer: "I do not trust the current team.",
    }, { sha256 })).rejects.toThrow("public_research_query_shape_invalid");
  });

  it("rejects provider and query-kind mismatches", async () => {
    await expect(preparePublicResearchQuery({
      ...base,
      query_kind: "public_domain",
      provider: "perplexity",
      purpose: "company_enrichment",
      domain: "example.com",
    }, { sha256 })).rejects.toThrow("public_research_provider_kind_mismatch");
  });
});
