import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const walk = (directory) => readdirSync(resolve(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const absolute = join(resolve(root, directory), entry.name);
    return entry.isDirectory() ? walk(relative(root, absolute)) : [relative(root, absolute).replaceAll("\\", "/")];
  });
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-egress-classification-r45] ${message}`);
};

const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-egress-classification-r45.json"));
const files = walk("supabase/functions")
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
const sources = new Map(files.map((file) => [file, read(file)]));
const providerSignatures = {
  openai: ["api.openai.com", "OPENAI_API_KEY"],
  anthropic: ["api.anthropic.com", "ANTHROPIC_API_KEY"],
  google_ai: ["generativelanguage.googleapis.com", "GEMINI_API_KEY", "GOOGLE_AI_API_KEY"],
  xai: ["api.x.ai", "XAI_API_KEY"],
  perplexity: ["api.perplexity.ai", "PERPLEXITY_API_KEY"],
  elevenlabs: ["api.elevenlabs.io", "ELEVENLABS_API_KEY"],
  resend: ["api.resend.com", "RESEND_API_KEY", "new Resend("],
  stripe: ["stripe@", "STRIPE_SECRET_KEY"],
  exa: ["api.exa.ai", "EXA_API_KEY"],
  brave: ["api.search.brave.com", "BRAVE_SEARCH_API"],
  tavily: ["api.tavily.com", "TAVILY_API_KEY"],
  newsapi: ["newsapi.org", "NEWSAPI_API_KEY", "NEWSAPI_KEY"],
  builtwith: ["api.builtwith.com", "BUILTWITH_API_KEY"],
  people_data_labs: ["api.peopledatalabs.com", "PDL_API_KEY"],
  configured_downstream: ["CAPTURE_WEBHOOK_URL", "WAREHOUSE_INGEST_URL", "CONTROL_CENTER_URL"],
};

const rules = [
  { family: "email_delivery", match: /(email|compute-drift)/ },
  { family: "billing", match: /(billing|stripe|subscription|prices|delete-account)/ },
  { family: "memory_and_intake", match: /(memory|extract-user-context|detect-patterns)/ },
  { family: "decision_support", match: /(decision|suggest-bets)/ },
  { family: "briefing_and_coaching", match: /(briefing|card-for-you|weekly|prompt-coach|reflection|openai-utils|llm-fallback|evidence-keypoint|tts)/ },
  { family: "research_and_enrichment", match: /(retrievers|news-sources|news-synthesis|company-signals|live-headlines)/ },
  { family: "configured_downstream", match: /(attribution-emit|capture-lead)/ },
];

const classify = (file, provider) => {
  if (provider === "configured_downstream") return "configured_downstream";
  const matched = rules.find((rule) => rule.match.test(file));
  return matched?.family ?? null;
};

const inventory = {};
const unclassified = [];
for (const [provider, signatures] of Object.entries(providerSignatures)) {
  const callsites = [...sources.entries()]
    .filter(([, source]) => signatures.some((signature) => source.includes(signature)))
    .map(([file]) => file)
    .sort();
  const classified = callsites.map((file) => {
    const purposeFamily = classify(file, provider);
    if (!purposeFamily) unclassified.push({ provider, file });
    return {
      file,
      purpose_family: purposeFamily,
      potential_data_classes: purposeFamily ? contract.purpose_families[purposeFamily] : [],
    };
  });
  inventory[provider] = classified;
}

assert(Object.keys(inventory).length === 15, "provider coverage changed");
assert(unclassified.length === 0, `unclassified provider surfaces: ${JSON.stringify(unclassified)}`);
for (const entries of Object.values(inventory)) {
  for (const entry of entries) {
    assert(entry.potential_data_classes.length > 0, `empty data class at ${entry.file}`);
    for (const dataClass of entry.potential_data_classes) {
      assert(contract.data_classes.includes(dataClass), `unknown data class ${dataClass}`);
    }
  }
}
assert(contract.routing_standing.private_brain_context.includes("blocked"), "private context standing weakened");
assert(contract.required_per_request_receipt.includes("data classes sent"), "receipt lost data-class evidence");

const totalCallsites = Object.values(inventory).reduce((sum, entries) => sum + entries.length, 0);
const familyCounts = Object.values(inventory).flat().reduce((counts, entry) => {
  counts[entry.purpose_family] = (counts[entry.purpose_family] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  status: contract.status,
  providers: Object.keys(inventory).length,
  provider_file_associations: totalCallsites,
  purpose_family_counts: familyCounts,
  unclassified,
  standing: contract.routing_standing.private_brain_context,
}, null, 2));
