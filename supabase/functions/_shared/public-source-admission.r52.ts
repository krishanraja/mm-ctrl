import {
  preparePublicResearchQuery,
  type PreparedPublicResearchQuery,
  type PublicResearchQueryDependencies,
  type PublicResearchQueryInput,
} from "./public-research-query.r50";

const SHA256 = /^[0-9a-f]{64}$/;
const MAX_SOURCE_COUNT = 4;
const MAX_SOURCE_BYTES = 131_072;
const MAX_SOURCE_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5_000;

type WithoutPublicProof<T> = T extends PublicResearchQueryInput
  ? Omit<T, "public_source_sha256">
  : never;
type UnprovedQuery = WithoutPublicProof<PublicResearchQueryInput>;
type UnprovedFixedQuery = Extract<UnprovedQuery, { query_kind: "fixed_public_fetch" }>;
type UnprovedWebQuery = Exclude<UnprovedQuery, { query_kind: "fixed_public_fetch" }>;

export interface FixedConfigurationAdmission {
  schema_version: "ctrl.public-source-admission.r52";
  admission_kind: "fixed_configuration";
  configuration_sha256: string;
  query: UnprovedFixedQuery;
}

export interface WebEvidenceAdmission {
  schema_version: "ctrl.public-source-admission.r52";
  admission_kind: "web_evidence";
  public_source_urls: string[];
  query: UnprovedWebQuery;
}

export type PublicSourceAdmissionInput = FixedConfigurationAdmission | WebEvidenceAdmission;

export interface PublicSourceFetchResult {
  status: number;
  final_url: string;
  content_type: string;
  body: string;
  fetched_at: string;
  verified_public_route: boolean;
}

export interface PublicSourceAdmissionDependencies extends PublicResearchQueryDependencies {
  now: () => Date;
  fetchPublicSource: (url: string, maxBytes: number) => Promise<PublicSourceFetchResult>;
}

export interface AdmittedPublicResearchQuery {
  schema_version: "ctrl.admitted-public-research-query.r52";
  admission_kind: PublicSourceAdmissionInput["admission_kind"];
  public_source_sha256: string;
  evidence_count: number;
  source_locator_sha256: string[];
  prepared_query: PreparedPublicResearchQuery;
}

function fail(code: string): never {
  throw new Error(code);
}

function exactKeys(value: Record<string, unknown>, expected: string[]): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail("public_source_admission_shape_invalid");
  }
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function publicHttpsUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { return fail("public_source_url_invalid"); }
  const hostname = url.hostname.toLowerCase();
  const privateName = hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal");
  const addressLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
    || (url.port && url.port !== "443") || !hostname.includes(".") || privateName || addressLiteral) {
    fail("public_source_url_invalid");
  }
  return url;
}

function normaliseEvidence(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}.-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceContainsQuery(query: UnprovedWebQuery, sources: Array<{ url: URL; body: string }>): boolean {
  const combined = sources.map((source) => normaliseEvidence(source.body)).join(" ");
  if (query.query_kind === "public_company_name") {
    return combined.includes(normaliseEvidence(query.company_name));
  }
  if (query.query_kind === "public_domain") {
    const domain = query.domain.trim().toLowerCase();
    return sources.some(({ url }) => url.hostname === domain || url.hostname === `www.${domain}`)
      || combined.includes(domain);
  }
  return query.terms.every((term) => combined.includes(normaliseEvidence(term.replace(/-/g, " "))));
}

export async function admitPublicResearchQuery(
  input: unknown,
  dependencies: PublicSourceAdmissionDependencies,
): Promise<AdmittedPublicResearchQuery> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("public_source_admission_object_required");
  }
  const value = input as Record<string, unknown>;
  if (value.schema_version !== "ctrl.public-source-admission.r52") {
    fail("public_source_admission_schema_invalid");
  }
  if (value.query === null || typeof value.query !== "object" || Array.isArray(value.query)) {
    fail("public_source_admission_query_required");
  }
  const query = value.query as UnprovedQuery;

  if (value.admission_kind === "fixed_configuration") {
    exactKeys(value, ["admission_kind", "configuration_sha256", "query", "schema_version"]);
    if (query.query_kind !== "fixed_public_fetch") fail("public_source_admission_kind_mismatch");
    if (typeof value.configuration_sha256 !== "string" || !SHA256.test(value.configuration_sha256)) {
      fail("public_source_configuration_proof_invalid");
    }
    const publicSourceSha256 = await dependencies.sha256(canonical({
      schema_version: "ctrl.fixed-public-source-proof.r52",
      provider: query.provider,
      configuration_sha256: value.configuration_sha256,
    }));
    if (!SHA256.test(publicSourceSha256)) fail("public_source_admission_hash_invalid");
    const preparedQuery = await preparePublicResearchQuery({
      ...query,
      public_source_sha256: publicSourceSha256,
    }, dependencies);
    return {
      schema_version: "ctrl.admitted-public-research-query.r52",
      admission_kind: "fixed_configuration",
      public_source_sha256: publicSourceSha256,
      evidence_count: 1,
      source_locator_sha256: [value.configuration_sha256],
      prepared_query: preparedQuery,
    };
  }

  if (value.admission_kind !== "web_evidence") fail("public_source_admission_kind_invalid");
  exactKeys(value, ["admission_kind", "public_source_urls", "query", "schema_version"]);
  if (query.query_kind === "fixed_public_fetch") fail("public_source_admission_kind_mismatch");
  if (!Array.isArray(value.public_source_urls)
    || value.public_source_urls.length < 1
    || value.public_source_urls.length > MAX_SOURCE_COUNT
    || value.public_source_urls.some((url) => typeof url !== "string")) {
    fail("public_source_url_set_invalid");
  }
  const sourceUrls = (value.public_source_urls as string[]).map(publicHttpsUrl);
  if (new Set(sourceUrls.map((url) => url.href)).size !== sourceUrls.length) {
    fail("public_source_url_set_invalid");
  }

  const now = dependencies.now().getTime();
  if (!Number.isFinite(now)) fail("public_source_clock_invalid");
  const evidence = [];
  for (const sourceUrl of sourceUrls) {
    let fetched: PublicSourceFetchResult;
    try {
      fetched = await dependencies.fetchPublicSource(sourceUrl.href, MAX_SOURCE_BYTES);
    } catch {
      fail("public_source_fetch_failed");
    }
    const finalUrl = publicHttpsUrl(fetched.final_url);
    const fetchedAt = Date.parse(fetched.fetched_at);
    if (!fetched.verified_public_route) fail("public_source_route_unverified");
    if (!Number.isInteger(fetched.status) || fetched.status < 200 || fetched.status >= 300) {
      fail("public_source_response_invalid");
    }
    if (!/^(text\/(html|plain)|application\/(json|xml|rss\+xml|atom\+xml))(?:;|$)/i.test(fetched.content_type)) {
      fail("public_source_content_type_invalid");
    }
    if (typeof fetched.body !== "string" || new TextEncoder().encode(fetched.body).byteLength > MAX_SOURCE_BYTES) {
      fail("public_source_body_invalid");
    }
    if (!Number.isFinite(fetchedAt) || fetchedAt < now - MAX_SOURCE_AGE_MS || fetchedAt > now + MAX_FUTURE_SKEW_MS) {
      fail("public_source_freshness_invalid");
    }
    evidence.push({
      url: finalUrl,
      body: fetched.body,
      source_url_sha256: await dependencies.sha256(sourceUrl.href),
      final_url_sha256: await dependencies.sha256(finalUrl.href),
      content_sha256: await dependencies.sha256(fetched.body),
      fetched_at: new Date(fetchedAt).toISOString(),
    });
  }
  if (evidence.some((item) => !SHA256.test(item.source_url_sha256)
    || !SHA256.test(item.final_url_sha256) || !SHA256.test(item.content_sha256))) {
    fail("public_source_admission_hash_invalid");
  }
  if (!evidenceContainsQuery(query, evidence)) fail("public_source_query_not_evidenced");

  const receiptEvidence = evidence.map(({ source_url_sha256, final_url_sha256, content_sha256, fetched_at }) => ({
    source_url_sha256,
    final_url_sha256,
    content_sha256,
    fetched_at,
  })).sort((left, right) => left.source_url_sha256.localeCompare(right.source_url_sha256));
  const publicSourceSha256 = await dependencies.sha256(canonical({
    schema_version: "ctrl.public-source-proof.r52",
    evidence: receiptEvidence,
  }));
  if (!SHA256.test(publicSourceSha256)) fail("public_source_admission_hash_invalid");
  const preparedQuery = await preparePublicResearchQuery({
    ...query,
    public_source_sha256: publicSourceSha256,
  }, dependencies);

  return {
    schema_version: "ctrl.admitted-public-research-query.r52",
    admission_kind: "web_evidence",
    public_source_sha256: publicSourceSha256,
    evidence_count: evidence.length,
    source_locator_sha256: receiptEvidence.map((item) => item.source_url_sha256),
    prepared_query: preparedQuery,
  };
}
