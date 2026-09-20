import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const candidate = read("supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql");
const workspace = "49000000-0000-4000-8000-000000000001";
const owner = "49000000-0000-4000-8000-000000000002";
const receipts = {
  model: "49000000-0000-4000-8000-000000000010",
  research: "49000000-0000-4000-8000-000000000020",
  delivery: "49000000-0000-4000-8000-000000000030",
};

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-exchange-receipt-registry-r49] ${message}`);
};

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

async function asRole(db, role, action) {
  await db.exec(`set role ${role}`);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
  }
}

async function expectFailure(action, fragment, label) {
  try {
    await action();
  } catch (error) {
    if (String(error?.message).includes(fragment)) return `${label}:closed`;
    throw new Error(`${label} failed unexpectedly: ${error?.message}`);
  }
  throw new Error(`${label} unexpectedly passed`);
}

function exchange(id, overrides = {}) {
  return {
    schema_version: "ctrl.provider-exchange-receipt.r49",
    receipt_id: id,
    workspace_id: workspace,
    provider: "openai",
    processor_kind: "model",
    callsite: "supabase/functions/memory-synthesize/index.ts",
    purpose_family: "memory_and_intake",
    data_classes: ["brain_memory", "inferred_traits"],
    request_sha256: "a".repeat(64),
    query_minimization_sha256: null,
    control_mode: "contractual_zdr",
    control_evidence_sha256: "b".repeat(64),
    occurred_at: new Date(Date.now() - 5000).toISOString(),
    ...overrides,
  };
}

function event(id, receiptId, eventKind, offsetMs, overrides = {}) {
  return {
    schema_version: "ctrl.provider-exchange-lifecycle-event.r49",
    event_id: id,
    receipt_id: receiptId,
    event_kind: eventKind,
    provider_request_identity_hmac: "c".repeat(64),
    evidence_sha256: "d".repeat(64),
    occurred_at: new Date(Date.now() + offsetMs).toISOString(),
    ...overrides,
  };
}

const db = await createG25PostgresHarness();
const checks = [];
try {
  await db.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r49@example.test"]);
  await db.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r49-provider-receipts"],
  );
  await db.exec(candidate);

  const record = (payload) => asRole(db, "service_role", () => scalar(db,
    "select private.brain_record_provider_exchange($1::jsonb)",
    [JSON.stringify(payload)],
  ));
  const append = (payload) => asRole(db, "service_role", () => scalar(db,
    "select private.brain_append_provider_exchange_event($1::jsonb)",
    [JSON.stringify(payload)],
  ));

  const model = await record(exchange(receipts.model));
  assert(model.status === "recorded", "private model receipt was not recorded with ZDR evidence");
  const replay = await record(exchange(receipts.model));
  assert(replay.status === "idempotent", "exact exchange replay did not converge");
  checks.push("private_model_with_control_recorded", "exact_exchange_replay_idempotent");

  checks.push(await expectFailure(
    () => record(exchange("49000000-0000-4000-8000-000000000011", {
      request_sha256: "1".repeat(64),
      control_mode: "public_policy_default",
    })),
    "provider_exchange_private_model_control_unverified",
    "private_model_without_verified_control",
  ));
  checks.push(await expectFailure(
    () => record(exchange("49000000-0000-4000-8000-000000000012", {
      provider: "perplexity",
      processor_kind: "research",
      purpose_family: "research_and_enrichment",
      data_classes: ["decision_content", "search_query"],
      query_minimization_sha256: "2".repeat(64),
      control_mode: "public_policy_default",
      request_sha256: "2".repeat(64),
    })),
    "provider_exchange_private_research_payload_forbidden",
    "private_research_payload",
  ));

  const research = await record(exchange(receipts.research, {
    provider: "brave",
    processor_kind: "research",
    purpose_family: "research_and_enrichment",
    data_classes: ["search_query", "public_web_content"],
    query_minimization_sha256: "3".repeat(64),
    control_mode: "public_policy_default",
    request_sha256: "3".repeat(64),
  }));
  assert(research.status === "recorded", "minimised research receipt was not recorded");
  checks.push("minimised_research_recorded");

  const delivery = await record(exchange(receipts.delivery, {
    provider: "resend",
    processor_kind: "delivery",
    purpose_family: "email_delivery",
    data_classes: ["email_address", "email_body"],
    control_mode: "provider_policy_retention",
    request_sha256: "4".repeat(64),
  }));
  assert(delivery.status === "recorded", "delivery receipt was not recorded");
  checks.push("explicit_delivery_retention_recorded");

  const accepted = await append(event(
    "49000000-0000-4000-8000-000000000101", receipts.delivery, "accepted", -4000,
  ));
  const delivered = await append(event(
    "49000000-0000-4000-8000-000000000102", receipts.delivery, "delivered", -3000,
  ));
  const pending = await append(event(
    "49000000-0000-4000-8000-000000000103", receipts.delivery, "expiry_pending", -2000,
  ));
  const expired = await append(event(
    "49000000-0000-4000-8000-000000000104", receipts.delivery, "expired", -1000,
  ));
  assert([accepted, delivered, pending, expired].every((result) => result.status === "recorded"),
    "valid delivery lifecycle failed");
  checks.push("delivery_lifecycle_reached_expired");
  checks.push(await expectFailure(
    () => append(event(
      "49000000-0000-4000-8000-000000000105", receipts.delivery, "delivered", 0,
    )),
    "provider_event_terminal_state",
    "terminal_event_reopen",
  ));

  checks.push(await expectFailure(
    () => asRole(db, "authenticated", () => scalar(db,
      "select private.brain_record_provider_exchange($1::jsonb)",
      [JSON.stringify(exchange(receipts.model))],
    )),
    "permission denied",
    "authenticated_exchange_write",
  ));
  checks.push(await expectFailure(
    () => asRole(db, "service_role", () => db.query(
      "insert into private.brain_provider_exchanges(id) values (gen_random_uuid())",
    )),
    "permission denied",
    "raw_service_insert",
  ));

  const security = await scalar(db, `
    select jsonb_build_object(
      'exchange_forced_rls', (
        select relrowsecurity and relforcerowsecurity from pg_class
        where oid = 'private.brain_provider_exchanges'::regclass
      ),
      'event_forced_rls', (
        select relrowsecurity and relforcerowsecurity from pg_class
        where oid = 'private.brain_provider_exchange_events'::regclass
      ),
      'service_exchange_execute', has_function_privilege(
        'service_role', 'private.brain_record_provider_exchange(jsonb)', 'EXECUTE'
      ),
      'authenticated_exchange_closed', not has_function_privilege(
        'authenticated', 'private.brain_record_provider_exchange(jsonb)', 'EXECUTE'
      ),
      'service_raw_insert_closed', not has_table_privilege(
        'service_role', 'private.brain_provider_exchanges', 'INSERT'
      )
    )
  `);
  assert(Object.values(security).every((value) => value === true),
    `security boundary failed: ${JSON.stringify(security)}`);
  checks.push("forced_rls_and_service_function_boundary");

  const rawTerms = await scalar(db, `
    select count(*)::int from information_schema.columns
    where table_schema = 'private'
      and table_name in ('brain_provider_exchanges', 'brain_provider_exchange_events')
      and column_name in ('prompt', 'query', 'content', 'email', 'recipient', 'provider_request_id')
  `);
  assert(rawTerms === 0, "raw provider payload column appeared");
  checks.push("no_raw_payload_columns");

  console.log(JSON.stringify({ status: "local_registry_verified", checks }, null, 2));
} finally {
  await db.close();
}
