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
  if (!condition) throw new Error(`[g25-external-processor-surface-r44] ${message}`);
};

const files = walk("supabase/functions")
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
const sources = new Map(files.map((file) => [file, read(file)]));
const providers = {
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

const inventory = Object.fromEntries(Object.entries(providers).map(([provider, signatures]) => {
  const callsites = [...sources.entries()]
    .filter(([, source]) => signatures.some((signature) => source.includes(signature)))
    .map(([file]) => file)
    .sort();
  return [provider, { callsite_count: callsites.length, callsites }];
}));

for (const [provider, entry] of Object.entries(inventory)) {
  assert(entry.callsite_count > 0, `provider signature disappeared: ${provider}`);
}
const deletion = read("supabase/functions/delete-account/index.ts");
assert(deletion.includes("stripe.subscriptions.cancel"), "Stripe subscription cancellation disappeared");
assert(!deletion.match(/stripe\.customers\.(del|delete)/), "Stripe customer deletion unexpectedly appeared");
for (const provider of [
  "openai", "anthropic", "google", "xai", "perplexity", "elevenlabs", "resend",
  "exa", "brave", "tavily", "newsapi", "builtwith", "peopledatalabs",
]) {
  assert(!deletion.toLowerCase().includes(`${provider}_deletion`),
    `provider deletion path unexpectedly appeared: ${provider}`);
}

// Later dormant prepared-intelligence modules deliberately introduced a
// receipt vocabulary after R44. This historical gate concerns executable
// provider callsites, not every theory/helper module that now exists in the
// repository. Keep the gap assertion bound to those detected callsites.
const providerCallsiteFiles = new Set(Object.values(inventory).flatMap((entry) => entry.callsites));
const liveProviderSource = [...providerCallsiteFiles].map((file) => sources.get(file) ?? "").join("\n");
const receiptTerms = ["provider_request_id", "external_request_id", "provider_deletion_receipt"];
const presentReceiptTerms = receiptTerms.filter((term) => liveProviderSource.includes(term));
assert(presentReceiptTerms.length === 0,
  `unified provider receipt vocabulary changed: ${presentReceiptTerms.join(",")}`);

console.log(JSON.stringify({
  status: "external_processor_receipt_gap_confirmed",
  provider_count: Object.keys(inventory).length,
  inventory,
  delete_account: {
    stripe_subscription_cancellation: true,
    stripe_customer_deletion: false,
    other_provider_deletion_orchestration: false,
  },
  unified_provider_request_identity: false,
  unified_provider_deletion_receipt: false,
}, null, 2));
