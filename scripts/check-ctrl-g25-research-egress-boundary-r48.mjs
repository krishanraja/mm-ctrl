import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-research-egress-boundary-r48] ${message}`);
};

const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-research-egress-boundary-r48.json"));
const retrievers = read("supabase/functions/decision-engine/retrievers.ts");
const companySignals = read("supabase/functions/_shared/company-signals.ts");
const newsSources = read("supabase/functions/_shared/news-sources.ts");
const artificialAnalysis = read("supabase/functions/_shared/artificial-analysis.ts");
const briefing = read("supabase/functions/generate-briefing/index.ts");
const combined = [retrievers, companySignals, newsSources, artificialAnalysis, briefing].join("\n");

const endpointMarkers = {
  perplexity: "api.perplexity.ai",
  exa: "api.exa.ai",
  brave: "api.search.brave.com",
  tavily: "api.tavily.com",
  newsapi: "newsapi.org",
  builtwith: "api.builtwith.com",
  people_data_labs: "api.peopledatalabs.com",
  artificial_analysis: "artificialanalysis.ai/api/v2",
  tranco: "tranco-list.eu/api",
  gdelt: "api.gdeltproject.org",
  hacker_news_algolia: "hn.algolia.com/api",
};

assert(contract.retrieved_at === "2026-09-17", "evidence retrieval date changed");
assert(Object.keys(contract.routes).length === 12, "research route count changed");
for (const [provider, marker] of Object.entries(endpointMarkers)) {
  assert(combined.includes(marker), `${provider} endpoint disappeared`);
  assert(contract.routes[provider], `${provider} has no routing standing`);
}
assert(newsSources.includes("RSS_FEEDS"), "fixed RSS feed set disappeared");
assert(contract.routes.fixed_rss_publishers.standing === "fixed_public_fetch", "fixed RSS standing weakened");
assert(retrievers.includes("new URLSearchParams({ name: company })"), "PDL company-only request changed");
assert(retrievers.includes("encodeURIComponent(domain)"), "domain-only structured lookup changed");
assert(retrievers.includes("KEY=${key}&LOOKUP="), "BuiltWith key-in-URL finding changed");
assert(!retrievers.includes("NOPII=yes"), "BuiltWith NOPII control unexpectedly appeared");
assert(artificialAnalysis.includes("const AA_BASE_URL = \"https://artificialanalysis.ai/api/v2\""),
  "Artificial Analysis fixed base route changed");
assert(contract.minimisation_gate.includes("never send a leader name, email, verbatim interview answer or raw Brain memory to a research provider"),
  "private-source minimisation rule disappeared");

const standings = Object.values(contract.routes).reduce((counts, route) => {
  counts[route.standing] = (counts[route.standing] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  status: contract.status,
  route_count: Object.keys(contract.routes).length,
  correction: contract.correction,
  standings,
  concrete_repository_gaps: {
    builtwith_key_in_url: true,
    builtwith_nopii_requested: false,
    research_query_receipt: false,
  },
}, null, 2));
