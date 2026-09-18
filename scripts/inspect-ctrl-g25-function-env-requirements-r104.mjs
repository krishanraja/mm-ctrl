import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, normalize, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const functionsRoot = resolve(root, "supabase/functions");
const bytewise = (left, right) => Buffer.from(left).compare(Buffer.from(right));
const slash = (value) => value.split(sep).join("/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const environmentPolicy = {
  AI_SOFT_CAP_USD_PER_DAY: ["non_secret_runtime_policy", false, "model_spend"],
  ANTHROPIC_API_KEY: ["external_provider_credential", true, "model_spend"],
  APP_URL: ["non_secret_origin_configuration", false, "outbound_delivery"],
  ARTIFICIALANALYSIS_API_KEY: ["external_provider_credential", true, "external_research"],
  ATTRIBUTION_INGEST_SECRET: ["machine_authentication_secret", true, "external_write"],
  BRAVE_SEARCH_API: ["external_provider_credential", true, "external_research"],
  BRIEFING_DEDUPE_THRESHOLD: ["non_secret_runtime_policy", false, "content_policy"],
  BRIEFING_EXCLUDE_THRESHOLD: ["non_secret_runtime_policy", false, "content_policy"],
  BRIEFING_INCLUDE_DECISION_ALERTS: ["non_secret_feature_flag", false, "content_policy"],
  BRIEFING_MIN_RELEVANCE: ["non_secret_runtime_policy", false, "content_policy"],
  BRIEFING_PROFILE_GATE_ENABLED: ["non_secret_feature_flag", false, "content_policy"],
  BRIEFING_SOURCE_SHARED_POOL: ["non_secret_feature_flag", false, "content_policy"],
  BRIEFING_USE_BRAIN_PROFILE: ["non_secret_feature_flag", false, "content_policy"],
  BRIEFING_V2_ENABLED_DEFAULT: ["non_secret_feature_flag", false, "content_policy"],
  BUILTWITH_API_KEY: ["external_provider_credential", true, "external_research"],
  CAPTURE_WEBHOOK_URL: ["external_endpoint_configuration", false, "external_write"],
  CAPTURE_WEEK_SECRET: ["machine_authentication_secret", true, "scheduled_execution"],
  CONTROL_CENTER_PUBLISHABLE_KEY: ["cross_project_public_key", false, "cross_project_access"],
  CONTROL_CENTER_SERVICE_ROLE_KEY: ["cross_project_privileged_credential", true, "cross_project_access"],
  CONTROL_CENTER_URL: ["external_endpoint_configuration", false, "cross_project_access"],
  COMPILE_STANDARD_RPC_SECRET: ["machine_authentication_secret", true, "platform_access"],
  GENERATE_SKILL_EXPORT_RPC_SECRET: ["machine_authentication_secret", true, "platform_access"],
  CRITIQUE_ARTEFACT_RPC_SECRET: ["machine_authentication_secret", true, "platform_access"],
  MEASURE_STANDARD_RPC_SECRET: ["machine_authentication_secret", true, "platform_access"],
  CTRL_CRON_SECRET: ["machine_authentication_secret", true, "scheduled_execution"],
  DECISION_WATCH_SECRET: ["machine_authentication_secret", true, "scheduled_execution"],
  DENO_DEPLOYMENT_ID: ["platform_injected_runtime", false, "platform_identity"],
  DIAGNOSTIC_EMAIL_TOKEN: ["machine_authentication_secret", true, "outbound_delivery"],
  EDITORIAL_LENS_ENABLED: ["non_secret_feature_flag", false, "content_policy"],
  ELEVENLABS_API_KEY: ["external_provider_credential", true, "model_spend"],
  EXA_API_KEY: ["external_provider_credential", true, "external_research"],
  EXPECTED_SUPABASE_PROJECT_REF: ["non_secret_project_binding", false, "project_binding"],
  GEMINI_API_KEY: ["external_provider_credential", true, "model_spend"],
  GOOGLE_AI_API_KEY: ["external_provider_credential", true, "model_spend"],
  HOME_PERSONALIZATION_ENABLED: ["non_secret_feature_flag", false, "content_policy"],
  HOME_PROFILE_GATE_ENABLED: ["non_secret_feature_flag", false, "content_policy"],
  MEMORY_ENCRYPTION_KEY: ["cryptographic_custody_secret", true, "encrypted_data_custody"],
  MEMORY_SWEEP_SECRET: ["machine_authentication_secret", true, "scheduled_execution"],
  MODEL_ROUTING_ENABLED: ["non_secret_feature_flag", false, "model_spend"],
  NEWSAPI_API_KEY: ["external_provider_credential", true, "external_research"],
  NEWSAPI_KEY: ["external_provider_credential", true, "external_research"],
  OPENAI_API_KEY: ["external_provider_credential", true, "model_spend"],
  PDL_API_KEY: ["external_provider_credential", true, "personal_data_enrichment"],
  PERPLEXITY_API_KEY: ["external_provider_credential", true, "external_research"],
  PUBLIC_SITE_URL: ["non_secret_origin_configuration", false, "outbound_delivery"],
  RESEND_API_KEY: ["outbound_delivery_credential", true, "outbound_delivery"],
  SEND_CONFIRMATION_EMAIL_HOOK_SECRET: ["machine_authentication_secret", true, "outbound_delivery"],
  STRIPE_EDGE_PRO_PRICE_ID: ["non_secret_commercial_configuration", false, "billing"],
  STRIPE_SECRET_KEY: ["billing_credential", true, "billing"],
  STRIPE_WEBHOOK_SECRET: ["machine_authentication_secret", true, "billing"],
  SUPABASE_ANON_KEY: ["platform_injected_runtime", false, "platform_access"],
  SUPABASE_SERVICE_ROLE_KEY: ["platform_injected_privileged_runtime", true, "privileged_database_access"],
  SUPABASE_URL: ["platform_injected_runtime", false, "platform_access"],
  TAVILY_API_KEY: ["external_provider_credential", true, "external_research"],
  VIDEO_STUDIO_EXPORT_TOKEN: ["machine_authentication_secret", true, "external_write"],
  WAREHOUSE_INGEST_URL: ["external_endpoint_configuration", false, "external_write"],
  XAI_API_KEY: ["external_provider_credential", true, "model_spend"],
};

function collectClosure(entrypoint) {
  const seen = new Set();
  const missing = new Set();
  const stack = [entrypoint];
  while (stack.length) {
    const path = normalize(stack.pop());
    if (seen.has(path)) continue;
    if (!existsSync(path)) {
      missing.add(path);
      continue;
    }
    seen.add(path);
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["'](\.\.?\/[^"']+)["']/g)) {
      const specifier = match[1];
      const target = normalize(resolve(dirname(path), specifier));
      stack.push(target);
    }
  }
  return {
    files: [...seen].sort(bytewise),
    missing: [...missing].map((path) => slash(relative(root, path))).sort(bytewise),
  };
}

function inspectFiles(files) {
  const symbols = new Set();
  const descriptors = [];
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(/Deno\.env\.get\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g)) symbols.add(match[1]);
    descriptors.push(`${slash(relative(root, path))}\0${Buffer.byteLength(text)}\0${sha256(text)}`);
  }
  return {
    environment_symbols: [...symbols].sort(bytewise),
    closure_sha256: sha256(`${descriptors.join("\n")}\n`),
  };
}

export function buildEnvironmentManifest() {
  const routes = readdirSync(functionsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort(bytewise)
    .map((slug) => {
      const closure = collectClosure(resolve(functionsRoot, slug, "index.ts"));
      return {
        slug,
        closure_file_count: closure.files.length,
        missing_relative_imports: closure.missing,
        ...inspectFiles(closure.files),
      };
    });
  const symbolRoutes = new Map();
  for (const route of routes) {
    for (const symbol of route.environment_symbols) {
      if (!symbolRoutes.has(symbol)) symbolRoutes.set(symbol, []);
      symbolRoutes.get(symbol).push(route.slug);
    }
  }
  const unclassified = [...symbolRoutes.keys()].filter((symbol) => !environmentPolicy[symbol]).sort(bytewise);
  const stalePolicyEntries = Object.keys(environmentPolicy).filter((symbol) => !symbolRoutes.has(symbol)).sort(bytewise);
  const environment_symbols = [...symbolRoutes.entries()]
    .sort(([left], [right]) => bytewise(left, right))
    .map(([symbol, consumers]) => {
      const [classification, secret, deployment_risk] = environmentPolicy[symbol] ?? ["unclassified", null, "unclassified"];
      return { symbol, classification, secret, deployment_risk, consumers: consumers.sort(bytewise) };
    });
  const symbolByName = new Map(environment_symbols.map((entry) => [entry.symbol, entry]));
  const classifiedRoutes = routes.map((route) => ({
    ...route,
    deployment_risks: [...new Set(route.environment_symbols.map((symbol) => symbolByName.get(symbol).deployment_risk))].sort(bytewise),
    secret_environment_symbols: route.environment_symbols.filter((symbol) => symbolByName.get(symbol).secret),
  }));
  const riskRouteCounts = [...new Set(environment_symbols.map((entry) => entry.deployment_risk))]
    .sort(bytewise)
    .map((risk) => ({
      risk,
      route_count: classifiedRoutes.filter((route) => route.deployment_risks.includes(risk)).length,
    }));
  const core = {
    schema_version: "ctrl.g25.function-env-requirements.r104.v1",
    function_count: classifiedRoutes.length,
    functions_with_missing_relative_imports: routes.filter((route) => route.missing_relative_imports.length).map((route) => route.slug),
    unique_environment_symbol_count: environment_symbols.length,
    unclassified_environment_symbols: unclassified,
    stale_environment_policy_entries: stalePolicyEntries,
    risk_route_counts: riskRouteCounts,
    environment_symbols,
    routes: classifiedRoutes,
  };
  return { ...core, manifest_sha256: sha256(`${JSON.stringify(core)}\n`) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const manifest = buildEnvironmentManifest();
  if (process.argv.includes("--summary")) {
    console.log(JSON.stringify({
      function_count: manifest.function_count,
      functions_with_missing_relative_imports: manifest.functions_with_missing_relative_imports,
      unique_environment_symbol_count: manifest.unique_environment_symbol_count,
      unclassified_environment_symbols: manifest.unclassified_environment_symbols,
      stale_environment_policy_entries: manifest.stale_environment_policy_entries,
      risk_route_counts: manifest.risk_route_counts,
      symbols: manifest.environment_symbols.map(({ symbol, classification, secret, deployment_risk }) => ({ symbol, classification, secret, deployment_risk })),
      manifest_sha256: manifest.manifest_sha256,
    }, null, 2));
  } else {
    console.log(JSON.stringify(manifest, null, 2));
  }
}
