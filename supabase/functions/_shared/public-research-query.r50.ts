const SHA256 = /^[0-9a-f]{64}$/;
const DOMAIN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const COMPANY_NAME = /^[\p{L}\p{N}][\p{L}\p{N} &'().,+-]{0,79}$/u;
const PUBLIC_TERM = /^[a-z0-9][a-z0-9-]{1,31}$/;

export type ResearchProvider =
  | "perplexity"
  | "exa"
  | "brave"
  | "tavily"
  | "newsapi"
  | "builtwith"
  | "people_data_labs"
  | "artificial_analysis"
  | "tranco"
  | "gdelt"
  | "hacker_news_algolia"
  | "fixed_rss_publishers";

export type PublicResearchPurpose =
  | "company_enrichment"
  | "decision_evidence"
  | "news_monitoring"
  | "category_intelligence";

interface BaseQuery {
  schema_version: "ctrl.public-research-query.r50";
  purpose: PublicResearchPurpose;
  public_source_sha256: string;
}

export interface FixedPublicFetch extends BaseQuery {
  query_kind: "fixed_public_fetch";
  provider: "artificial_analysis" | "fixed_rss_publishers";
}

export interface PublicCompanyNameQuery extends BaseQuery {
  query_kind: "public_company_name";
  provider: "people_data_labs";
  company_name: string;
}

export interface PublicDomainQuery extends BaseQuery {
  query_kind: "public_domain";
  provider: "builtwith" | "tranco";
  domain: string;
}

export interface PublicTopicQuery extends BaseQuery {
  query_kind: "public_topic_terms";
  provider:
    | "perplexity"
    | "exa"
    | "brave"
    | "tavily"
    | "newsapi"
    | "gdelt"
    | "hacker_news_algolia";
  terms: string[];
}

export type PublicResearchQueryInput =
  | FixedPublicFetch
  | PublicCompanyNameQuery
  | PublicDomainQuery
  | PublicTopicQuery;

export interface PublicResearchQueryDependencies {
  sha256: (value: string) => Promise<string>;
}

export interface PreparedPublicResearchQuery {
  schema_version: "ctrl.prepared-public-research-query.r50";
  provider: ResearchProvider;
  purpose: PublicResearchPurpose;
  query_kind: PublicResearchQueryInput["query_kind"];
  outbound_query: string | null;
  data_classes: Array<"company_identifier" | "public_web_content" | "search_query">;
  public_source_sha256: string;
  query_minimization_sha256: string;
  request_sha256: string;
}

const EXACT_KEYS: Record<PublicResearchQueryInput["query_kind"], string[]> = {
  fixed_public_fetch: ["provider", "public_source_sha256", "purpose", "query_kind", "schema_version"],
  public_company_name: [
    "company_name", "provider", "public_source_sha256", "purpose", "query_kind", "schema_version",
  ],
  public_domain: ["domain", "provider", "public_source_sha256", "purpose", "query_kind", "schema_version"],
  public_topic_terms: [
    "provider", "public_source_sha256", "purpose", "query_kind", "schema_version", "terms",
  ],
};

const PURPOSES: PublicResearchPurpose[] = [
  "company_enrichment",
  "decision_evidence",
  "news_monitoring",
  "category_intelligence",
];

function fail(code: string): never {
  throw new Error(code);
}

function assertExactKeys(value: Record<string, unknown>, expected: string[]): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail("public_research_query_shape_invalid");
  }
}

function validateBase(value: Record<string, unknown>): void {
  if (value.schema_version !== "ctrl.public-research-query.r50") {
    fail("public_research_query_schema_invalid");
  }
  if (!PURPOSES.includes(value.purpose as PublicResearchPurpose)) {
    fail("public_research_query_purpose_invalid");
  }
  if (typeof value.public_source_sha256 !== "string" || !SHA256.test(value.public_source_sha256)) {
    fail("public_research_public_source_proof_required");
  }
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

export async function preparePublicResearchQuery(
  input: unknown,
  dependencies: PublicResearchQueryDependencies,
): Promise<PreparedPublicResearchQuery> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("public_research_query_object_required");
  }
  const value = input as Record<string, unknown>;
  if (typeof value.query_kind !== "string" || !(value.query_kind in EXACT_KEYS)) {
    fail("public_research_query_kind_invalid");
  }
  const queryKind = value.query_kind as PublicResearchQueryInput["query_kind"];
  assertExactKeys(value, EXACT_KEYS[queryKind]);
  validateBase(value);

  let provider: ResearchProvider;
  let outboundQuery: string | null;
  let dataClasses: PreparedPublicResearchQuery["data_classes"];

  if (queryKind === "fixed_public_fetch") {
    if (value.provider !== "artificial_analysis" && value.provider !== "fixed_rss_publishers") {
      fail("public_research_provider_kind_mismatch");
    }
    provider = value.provider;
    outboundQuery = null;
    dataClasses = ["public_web_content"];
  } else if (queryKind === "public_company_name") {
    if (value.provider !== "people_data_labs") fail("public_research_provider_kind_mismatch");
    if (typeof value.company_name !== "string") fail("public_research_company_name_invalid");
    const companyName = value.company_name.trim().replace(/\s+/g, " ");
    if (!COMPANY_NAME.test(companyName) || companyName.split(" ").length > 8 || /@|https?:|\r|\n/i.test(companyName)) {
      fail("public_research_company_name_invalid");
    }
    provider = value.provider;
    outboundQuery = companyName;
    dataClasses = ["company_identifier"];
  } else if (queryKind === "public_domain") {
    if (value.provider !== "builtwith" && value.provider !== "tranco") {
      fail("public_research_provider_kind_mismatch");
    }
    if (typeof value.domain !== "string") fail("public_research_domain_invalid");
    const domain = value.domain.trim().toLowerCase();
    if (!DOMAIN.test(domain) || domain.includes("..") || domain.includes("@") || domain.includes("://")) {
      fail("public_research_domain_invalid");
    }
    provider = value.provider;
    outboundQuery = domain;
    dataClasses = ["company_identifier"];
  } else {
    const topicProviders: ResearchProvider[] = [
      "perplexity", "exa", "brave", "tavily", "newsapi", "gdelt", "hacker_news_algolia",
    ];
    if (!topicProviders.includes(value.provider as ResearchProvider)) {
      fail("public_research_provider_kind_mismatch");
    }
    if (!Array.isArray(value.terms) || value.terms.length < 2 || value.terms.length > 10) {
      fail("public_research_topic_terms_invalid");
    }
    const terms = value.terms.map((term) => typeof term === "string" ? term.trim().toLowerCase() : "");
    if (terms.some((term) => !PUBLIC_TERM.test(term)) || new Set(terms).size !== terms.length) {
      fail("public_research_topic_terms_invalid");
    }
    provider = value.provider as ResearchProvider;
    outboundQuery = terms.join(" ");
    dataClasses = ["public_web_content", "search_query"];
  }

  const minimisationBasis = {
    schema_version: "ctrl.query-minimisation-proof.r50",
    provider,
    purpose: value.purpose,
    query_kind: queryKind,
    outbound_query: outboundQuery,
    public_source_sha256: value.public_source_sha256,
  };
  const queryMinimizationSha256 = await dependencies.sha256(canonical(minimisationBasis));
  if (!SHA256.test(queryMinimizationSha256)) fail("public_research_minimisation_hash_invalid");

  const requestBasis = {
    schema_version: "ctrl.prepared-public-research-query.r50",
    provider,
    purpose: value.purpose,
    query_kind: queryKind,
    outbound_query: outboundQuery,
  };
  const requestSha256 = await dependencies.sha256(canonical(requestBasis));
  if (!SHA256.test(requestSha256)) fail("public_research_request_hash_invalid");

  return {
    ...requestBasis,
    data_classes: dataClasses,
    public_source_sha256: value.public_source_sha256 as string,
    query_minimization_sha256: queryMinimizationSha256,
    request_sha256: requestSha256,
  };
}
