import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const r49 = read("supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql");
const r51 = read("supabase/candidates/g25_provider_exchange_retry_identity_r51.sql");
const workspace = "51000000-0000-4000-8000-000000000001";
const owner = "51000000-0000-4000-8000-000000000002";
const occurredAt = new Date(Date.now() - 10_000).toISOString();
const eventOccurredAt = new Date(Date.now() - 5_000).toISOString();

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-exchange-retry-identity-r51] ${message}`);
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
function exchange(id, idempotency, overrides = {}) {
  return {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: id,
    workspace_id: workspace,
    provider: "brave",
    processor_kind: "research",
    callsite: "supabase/functions/decision-engine/retrievers.ts",
    purpose_family: "research_and_enrichment",
    data_classes: ["public_web_content", "search_query"],
    request_sha256: "a".repeat(64),
    idempotency_key_sha256: idempotency,
    query_minimization_sha256: "b".repeat(64),
    control_mode: "public_policy_default",
    control_evidence_sha256: "c".repeat(64),
    occurred_at: occurredAt,
    ...overrides,
  };
}
function event(id, receiptId, idempotency, overrides = {}) {
  return {
    schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
    event_id: id,
    receipt_id: receiptId,
    event_kind: "accepted",
    idempotency_key_sha256: idempotency,
    provider_request_identity_hmac: "d".repeat(64),
    evidence_sha256: "e".repeat(64),
    occurred_at: eventOccurredAt,
    ...overrides,
  };
}

const db = await createG25PostgresHarness();
const checks = [];
try {
  await db.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r51@example.test"]);
  await db.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r51-provider-retries"],
  );
  await db.exec(r49);
  await db.exec(r51);

  const record = (payload) => asService(db, () => scalar(db,
    "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(payload)],
  ));
  const append = (payload) => asService(db, () => scalar(db,
    "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(payload)],
  ));

  const firstId = "51000000-0000-4000-8000-000000000010";
  const secondId = "51000000-0000-4000-8000-000000000011";
  const firstOperation = "1".repeat(64);
  const secondOperation = "2".repeat(64);
  assert((await record(exchange(firstId, firstOperation))).status === "recorded", "first event not recorded");
  assert((await record(exchange(secondId, secondOperation))).status === "recorded",
    "same payload under a later operation was collapsed");
  assert(await scalar(db, "select count(*)::int from private.brain_provider_exchanges") === 2,
    "same request payload did not produce two real operations");
  checks.push("same_payload_distinct_operations_preserved");

  const retry = await record(exchange(
    "51000000-0000-4000-8000-000000000099", firstOperation,
  ));
  assert(retry.status === "idempotent" && retry.receipt_id === firstId,
    "operation retry did not converge on the first receipt");
  checks.push("stable_operation_retry_converged");

  checks.push(await expectFailure(
    () => record(exchange("51000000-0000-4000-8000-000000000098", firstOperation, {
      control_evidence_sha256: "9".repeat(64),
    })),
    "provider_exchange_operation_identity_conflict",
    "changed_exchange_evidence_on_retry",
  ));

  const firstEventId = "51000000-0000-4000-8000-000000000101";
  const eventOperation = "3".repeat(64);
  assert((await append(event(firstEventId, firstId, eventOperation))).status === "recorded",
    "first lifecycle event not recorded");
  const eventRetry = await append(event(
    "51000000-0000-4000-8000-000000000199", firstId, eventOperation,
  ));
  assert(eventRetry.status === "idempotent" && eventRetry.event_id === firstEventId,
    "event retry did not converge on first event");
  checks.push("stable_event_retry_converged");

  checks.push(await expectFailure(
    () => append(event("51000000-0000-4000-8000-000000000198", firstId, eventOperation, {
      evidence_sha256: "8".repeat(64),
    })),
    "provider_event_operation_identity_conflict",
    "changed_event_evidence_on_retry",
  ));

  const oldUnique = await scalar(db, `
    select count(*)::int
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'private.brain_provider_exchanges'::regclass
      and c.contype = 'u' and a.attname = 'request_sha256'
  `);
  assert(oldUnique === 0, "payload hash remains a uniqueness identity");
  checks.push("payload_hash_not_operation_identity");

  console.log(JSON.stringify({ status: "retry_identity_corrected", checks }, null, 2));
} finally {
  await db.close();
}
