// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";
import { evaluateProviderClosureFacts, type ProviderClosureFact } from "./provider-closure-facts.r62";

const root = process.cwd();
const candidates = [
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_route_matrix_r53.sql",
  "supabase/candidates/g25_provider_closure_facts_r63.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "63000000-0000-4000-8000-000000000001";
const owner = "63000000-0000-4000-8000-000000000002";
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 10;

beforeAll(async () => { sharedDatabase = await createDatabase(); });
afterAll(async () => { await sharedDatabase?.close(); });

async function createDatabase() {
  const db = await createG25PostgresHarness();
  await db.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r63@example.test"]);
  await db.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r63-provider-closure"],
  );
  for (const candidate of candidates) await db.exec(candidate);
  return db;
}

function database() {
  if (!sharedDatabase) throw new Error("R63 PostgreSQL harness is not initialized");
  return sharedDatabase;
}

async function asService<T>(db: Awaited<ReturnType<typeof createDatabase>>, action: () => Promise<T>) {
  await db.exec("set role service_role");
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function scalar(db: Awaited<ReturnType<typeof createDatabase>>, sql: string, params: unknown[] = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

function exchange(provider: "stripe" | "resend", now: Date) {
  const suffix = String(sequence++).padStart(12, "0");
  const billing = provider === "stripe";
  return {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: `63000000-0000-4000-8000-${suffix}`,
    workspace_id: workspace,
    provider,
    processor_kind: billing ? "billing" : "delivery",
    callsite: billing ? "supabase/functions/delete-account/index.ts" : "supabase/functions/send-email/index.ts",
    purpose_family: billing ? "billing" : "email_delivery",
    data_classes: billing ? ["account_identity", "billing_metadata"] : ["email_address", "email_body"],
    request_sha256: String(sequence % 10).repeat(64),
    idempotency_key_sha256: String((sequence + 1) % 10).repeat(64),
    query_minimization_sha256: null,
    control_mode: billing ? "regulated_retention" : "provider_policy_retention",
    control_evidence_sha256: "a".repeat(64),
    occurred_at: new Date(now.getTime() - 5_000).toISOString(),
  };
}

function accepted(receiptId: string, now: Date) {
  const suffix = String(sequence++).padStart(12, "0");
  return {
    schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
    event_id: `63000000-0000-4000-8001-${suffix}`,
    receipt_id: receiptId,
    event_kind: "accepted",
    idempotency_key_sha256: String(sequence % 10).repeat(64),
    provider_request_identity_hmac: "b".repeat(64),
    evidence_sha256: "c".repeat(64),
    occurred_at: new Date(now.getTime() - 4_000).toISOString(),
  };
}

function closureFact(
  receiptId: string,
  factKind: ProviderClosureFact["fact_kind"],
  scope: ProviderClosureFact["scope"],
  now: Date,
  offsetMs: number,
) {
  const suffix = String(sequence++).padStart(12, "0");
  return {
    schema_version: "ctrl.provider-closure-fact.r63",
    fact_id: `63000000-0000-4000-8002-${suffix}`,
    receipt_id: receiptId,
    fact_kind: factKind,
    scope,
    idempotency_key_sha256: String(sequence % 10).repeat(64),
    evidence_sha256: String((sequence + 1) % 10).repeat(64),
    occurred_at: new Date(now.getTime() - offsetMs).toISOString(),
  };
}

async function recordExchange(db: Awaited<ReturnType<typeof createDatabase>>, payload: ReturnType<typeof exchange>) {
  return asService(db, () => scalar(db,
    "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(payload)],
  ));
}

async function recordAccepted(db: Awaited<ReturnType<typeof createDatabase>>, payload: ReturnType<typeof accepted>) {
  return asService(db, () => scalar(db,
    "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(payload)],
  ));
}

async function appendFact(db: Awaited<ReturnType<typeof createDatabase>>, payload: ReturnType<typeof closureFact>) {
  return asService(db, () => scalar(db,
    "select private.brain_append_provider_closure_fact($1::jsonb)", [JSON.stringify(payload)],
  ));
}

describe("provider closure PostgreSQL R63", () => {
  it("refuses closure evidence before the provider accepted the exchange", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("stripe", now);
    await recordExchange(db, receipt);
    await expect(appendFact(db, closureFact(
      receipt.receipt_id, "operational_deletion_succeeded", "provider_object", now, 3_000,
    ))).rejects.toThrow("provider_closure_fact_exchange_not_accepted");
  });

  it("persists Stripe operational deletion and regulated residual retention together", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("stripe", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    await appendFact(db, closureFact(receipt.receipt_id, "operational_deletion_succeeded", "provider_object", now, 3_000));
    await appendFact(db, closureFact(receipt.receipt_id, "residual_retention_confirmed", "regulated_record", now, 2_000));

    const rows = await db.query(
      "select id::text as fact_id, fact_kind, scope, evidence_sha256, occurred_at from private.brain_provider_closure_facts where exchange_id = $1::uuid order by occurred_at",
      [receipt.receipt_id],
    );
    const evaluated = evaluateProviderClosureFacts({
      obligations: ["operational_deletion", "residual_retention_boundary"],
      facts: rows.rows.map((row) => ({
        ...row,
        occurred_at: new Date(String(row.occurred_at)).toISOString(),
      })) as ProviderClosureFact[],
    });
    expect(evaluated.status).toBe("bounded_complete_with_residual");
  });

  it("persists Resend expiry separately from the external recipient copy", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("resend", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    await appendFact(db, closureFact(receipt.receipt_id, "policy_expired", "exchange_payload", now, 3_000));
    await appendFact(db, closureFact(receipt.receipt_id, "external_copy_confirmed", "external_copy", now, 2_000));
    const kinds = await db.query(
      "select fact_kind from private.brain_provider_closure_facts where exchange_id = $1::uuid order by fact_kind",
      [receipt.receipt_id],
    );
    expect(kinds.rows.map((row) => row.fact_kind)).toEqual(["external_copy_confirmed", "policy_expired"]);
  });

  it("requires failure evidence before recovery and preserves both facts", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("resend", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    await expect(appendFact(db, closureFact(
      receipt.receipt_id, "verification_recovered", "exchange_payload", now, 3_000,
    ))).rejects.toThrow("provider_closure_fact_recovery_without_failure");
    await appendFact(db, closureFact(receipt.receipt_id, "verification_failed", "exchange_payload", now, 3_000));
    await appendFact(db, closureFact(receipt.receipt_id, "verification_recovered", "exchange_payload", now, 2_000));
    expect(await scalar(db,
      "select count(*)::int from private.brain_provider_closure_facts where exchange_id = $1::uuid", [receipt.receipt_id],
    )).toBe(2);
  });

  it("rejects contradictory payload disposition and failure after deletion success", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("resend", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    await appendFact(db, closureFact(receipt.receipt_id, "no_retention_verified", "exchange_payload", now, 3_000));
    await expect(appendFact(db, closureFact(
      receipt.receipt_id, "policy_expired", "exchange_payload", now, 2_000,
    ))).rejects.toThrow("provider_closure_fact_payload_disposition_conflict");
    await appendFact(db, closureFact(receipt.receipt_id, "operational_deletion_succeeded", "provider_object", now, 2_000));
    await expect(appendFact(db, closureFact(
      receipt.receipt_id, "operational_deletion_failed", "provider_object", now, 1_000,
    ))).rejects.toThrow("provider_closure_fact_failure_after_success");
  });

  it("converges on exact replay and rejects changed operation evidence", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("resend", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    const payload = closureFact(receipt.receipt_id, "external_copy_confirmed", "external_copy", now, 3_000);
    expect((await appendFact(db, payload)).status).toBe("recorded");
    expect((await appendFact(db, payload)).status).toBe("idempotent");
    await expect(appendFact(db, { ...payload, evidence_sha256: "f".repeat(64) })).rejects
      .toThrow("provider_closure_fact_operation_identity_conflict");
  });

  it("denies service-role raw inserts while allowing content-free readback", async () => {
    const db = database();
    const now = new Date();
    const receipt = exchange("resend", now);
    await recordExchange(db, receipt);
    await recordAccepted(db, accepted(receipt.receipt_id, now));
    const payload = closureFact(receipt.receipt_id, "external_copy_confirmed", "external_copy", now, 3_000);
    await appendFact(db, payload);
    await expect(asService(db, () => db.query(
      "insert into private.brain_provider_closure_facts(id, schema_version, exchange_id, fact_kind, scope, idempotency_key_sha256, evidence_sha256, occurred_at) values ($1::uuid, 'ctrl.provider-closure-fact.r63', $2::uuid, 'external_copy_confirmed', 'external_copy', $3, $4, now())",
      ["63000000-0000-4000-8002-999999999999", receipt.receipt_id, "d".repeat(64), "e".repeat(64)],
    ))).rejects.toThrow();
    const stored = await asService(db, () => scalar(db,
      "select to_jsonb(f)::text from private.brain_provider_closure_facts f where f.id = $1::uuid", [payload.fact_id],
    ));
    expect(stored).not.toContain("r63@example.test");
    expect(stored).not.toContain("email_body");
  });
});
