import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contractPath = "project-documentation/ctrl-evolution/g25-jwt-disabled-route-security-r100.json";
const notePath = "project-documentation/ctrl-evolution/g25-jwt-disabled-route-security-r100.md";
const qaPath = "project-documentation/ctrl-evolution/g25-jwt-disabled-route-security-r100-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const containment = JSON.parse(read("supabase/containment/manifest.json"));
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const bytewise = (left, right) => Buffer.from(left).compare(Buffer.from(right));

function gatewayMap(raw) {
  const values = new Map();
  let current = null;
  for (const line of raw.split(/\r?\n/)) {
    const section = line.match(/^\s*\[functions\.([^\]]+)\]\s*$/);
    if (section) {
      current = section[1];
      continue;
    }
    const jwt = line.match(/^\s*verify_jwt\s*=\s*(true|false)\s*$/);
    if (current && jwt) values.set(current, jwt[1] === "true");
  }
  return values;
}

const gateway = gatewayMap(config);
const jwtFalse = [...gateway.entries()].filter(([, value]) => value === false).map(([name]) => name).sort(bytewise);
const containedFalse = containment.functions.filter((entry) => entry.verify_jwt === false).map((entry) => entry.name).sort(bytewise);
const reviewed = contract.reviewed_existing_guards.map((entry) => entry.route).sort(bytewise);
const classified = [...new Set([...containedFalse, ...reviewed])].sort(bytewise);
const originalQueue = [...contract.original_review_queue].sort(bytewise);

check(contractRaw.endsWith("\n"), "contract JSON must end with one newline");
check(contract.status === "static_route_classification_complete_runtime_and_deployment_proof_open", "status drifted");
check(gateway.size === contract.scope.current_repo_routes, "configured route count drifted");
check(jwtFalse.length === contract.scope.current_verify_jwt_false, "JWT-disabled count drifted");
check(containedFalse.length === contract.scope.contained_verify_jwt_false, "contained JWT-disabled count drifted");
check(reviewed.length === contract.scope.remaining_reviewed_verify_jwt_false, "reviewed route count drifted");
check(originalQueue.length === contract.scope.original_uncontained_review_queue, "original queue count drifted");
check(JSON.stringify(classified) === JSON.stringify(jwtFalse), "a JWT-disabled route is missing or multiply classified");
check(contract.scope.current_unclassified_verify_jwt_false === 0, "unclassified route count is not zero");

const additions = new Map(contract.r100_containment_additions.map((entry) => [entry.route, entry]));
for (const route of ["capture-lead", "prompt-coach", "send-diagnostic-email", "share-card"]) {
  check(additions.has(route), `${route}: R100 addition missing`);
  check(containment.functions.some((entry) => entry.name === route), `${route}: containment contract missing`);
}
check(gateway.get("prompt-coach") === true, "prompt-coach gateway JWT hardening disappeared");
for (const route of ["capture-lead", "send-diagnostic-email", "share-card"]) {
  check(gateway.get(route) === false, `${route}: expected handler-owned public or machine boundary drifted`);
}

const sourceRules = {
  "backfill-pseudonymise": ["isServiceRequest("],
  "cleanup-expired-data": ["isServiceRequest(", "isCronRequest("],
  "decision-reactions": ["matchesExpectedSupabaseProject(", "EXPECTED_SUPABASE_PROJECT_REF"],
  "live-headlines": ["auth.getUser(", "isServiceRequest(", "isCronRequest("],
  "nudge-briefing": ["auth.getUser("],
  "send-confirmation-email": ["wh.verify("],
  "send-daily-briefing": ["isServiceRequest(", "isCronRequest("],
  "stripe-webhook": ["constructEventAsync(", "matchesExpectedSupabaseProject(", "idempotency_authority_unavailable"],
  "unsubscribe-briefing": ["token.length < 32", "unsubscribe_token_hash"],
  "video-radar-export": ["isBearerRequest(", "consumeRequestRateLimit("],
};
for (const [route, markers] of Object.entries(sourceRules)) {
  const source = read(`supabase/functions/${route}/index.ts`);
  for (const marker of markers) check(source.includes(marker), `${route}: missing ${marker}`);
}
for (const route of ["decision-reactions", "stripe-webhook"]) {
  const source = read(`supabase/functions/${route}/index.ts`);
  check(!source.includes("bkyuxvschuwngtcdhsyg"), `${route}: production project reference remains hard-coded`);
}

check(contract.portable_project_repairs.stripe_non_conflict_idempotency_error === "503_before_side_effect", "Stripe fail-closed receipt drifted");
check(contract.verification.raw_secret_values_retrieved === false, "secret-value boundary drifted");
check(contract.verification.function_deployments === 0, "function deployment was fabricated");
check(contract.verification.production_writes === 0, "production write was fabricated");
check(contract.open_gates.all_route_specific_runtime_proofs_complete === false, "hosted runtime proof was fabricated");
check(contract.open_gates.isolated_function_deployment_ready === false, "isolated deployment gate opened");
check(contract.open_gates.production_function_deployment_ready === false, "production deployment gate opened");

const prose = `${contractRaw}\n${read(notePath)}\n${read(qaPath)}`;
check(!prose.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(prose), "credential-shaped content detected");
check(read(notePath).includes("This closes the unclassified queue, not the hosted security gate"), "static-versus-hosted boundary disappeared");
check(read(qaPath).includes("Unclassified JWT-disabled routes: zero"), "QA coverage receipt disappeared");

if (failures.length) {
  console.error(`[g25-jwt-disabled-route-security-r100] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-jwt-disabled-route-security-r100] PASS: every JWT-disabled repository route is statically classified; hosted security and deployment remain closed");
