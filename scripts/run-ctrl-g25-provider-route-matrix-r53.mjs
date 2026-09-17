import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const candidates = [
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_route_matrix_r53.sql",
].map(read);
const workspace = "53000000-0000-4000-8000-000000000001";
const owner = "53000000-0000-4000-8000-000000000002";
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-route-matrix-r53] ${message}`);
};
async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}
async function asService(db, action) {
  await db.exec("set role service_role");
  try { return await action(); } finally { await db.exec("reset role"); }
}
async function expectFailure(action, fragment, label) {
  try { await action(); } catch (error) {
    if (String(error?.message).includes(fragment)) return `${label}:closed`;
    throw new Error(`${label} failed unexpectedly: ${error?.message}`);
  }
  throw new Error(`${label} unexpectedly passed`);
}
let sequence = 10;
function exchange(overrides = {}) {
  const suffix = String(sequence++).padStart(12, "0");
  return {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: `53000000-0000-4000-8000-${suffix}`,
    workspace_id: workspace,
    provider: "brave",
    processor_kind: "research",
    callsite: "supabase/functions/decision-engine/retrievers.ts",
    purpose_family: "research_and_enrichment",
    data_classes: ["public_web_content", "search_query"],
    request_sha256: String(sequence % 10).repeat(64),
    idempotency_key_sha256: String((sequence + 1) % 10).repeat(64),
    query_minimization_sha256: "a".repeat(64),
    control_mode: "public_policy_default",
    control_evidence_sha256: "b".repeat(64),
    occurred_at: new Date(Date.now() - 5_000).toISOString(),
    ...overrides,
  };
}

const db = await createG25PostgresHarness();
const checks = [];
try {
  await db.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r53@example.test"]);
  await db.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r53-route-matrix"],
  );
  for (const candidate of candidates) await db.exec(candidate);
  const record = (payload) => asService(db, () => scalar(db,
    "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(payload)],
  ));

  assert((await record(exchange())).status === "recorded", "valid public research route failed");
  assert((await record(exchange({
    provider: "artificial_analysis",
    data_classes: ["public_web_content"],
    query_minimization_sha256: null,
    control_mode: "fixed_public_fetch",
  }))).status === "recorded", "valid fixed route failed");
  assert((await record(exchange({
    provider: "openai",
    processor_kind: "model",
    purpose_family: "decision_support",
    data_classes: ["decision_content"],
    query_minimization_sha256: null,
    control_mode: "contractual_zdr",
  }))).status === "recorded", "valid private model route failed");
  checks.push("valid_public_fixed_and_private_routes_recorded");

  checks.push(await expectFailure(
    () => record(exchange({ provider: "stripe" })),
    "brain_provider_exchanges_route_matrix_r53_check",
    "stripe_as_research",
  ));
  checks.push(await expectFailure(
    () => record(exchange({ provider: "brave", control_mode: "fixed_public_fetch" })),
    "brain_provider_exchanges_research_control_r53_check",
    "ordinary_search_as_fixed_fetch",
  ));
  checks.push(await expectFailure(
    () => record(exchange({
      provider: "artificial_analysis",
      data_classes: ["public_web_content"],
      control_mode: "public_policy_default",
    })),
    "brain_provider_exchanges_research_control_r53_check",
    "fixed_fetch_as_customer_query",
  ));
  checks.push(await expectFailure(
    () => record(exchange({ control_mode: "regulated_retention" })),
    "brain_provider_exchanges_research_control_r53_check",
    "research_as_regulated_billing_retention",
  ));
  checks.push(await expectFailure(
    () => record(exchange({
      provider: "resend",
      processor_kind: "delivery",
      purpose_family: "decision_support",
      data_classes: ["email_address", "email_body"],
      query_minimization_sha256: null,
      control_mode: "provider_policy_retention",
    })),
    "brain_provider_exchanges_route_matrix_r53_check",
    "delivery_with_decision_purpose",
  ));

  console.log(JSON.stringify({ status: "provider_route_matrix_verified", checks }, null, 2));
} finally {
  await db.close();
}
