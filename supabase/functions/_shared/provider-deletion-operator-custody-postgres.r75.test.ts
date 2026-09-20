// @vitest-environment node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";

const root = process.cwd();
const beforeCustody = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const afterSeed = [
  "supabase/candidates/g25_non_cascading_owner_guard_r22.sql",
  "supabase/candidates/g25_stable_custody_identity_r23.sql",
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_deletion_dispatch_persistence_r73.sql",
  "supabase/candidates/g25_provider_deletion_operator_session_r74.sql",
  "supabase/candidates/g25_provider_deletion_operator_custody_r75.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "75000000-0000-4000-8000-000000000001";
const subject = "75000000-0000-4000-8000-000000000002";
const owner = "75000000-0000-4000-8000-000000000003";
const outsider = "75000000-0000-4000-8000-000000000004";
const replacement = "75000000-0000-4000-8000-000000000005";
const replacementOperator = "75000000-0000-4000-8000-000000000006";
let ownerOperator = "";
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 20;

beforeAll(async () => {
  sharedDatabase = await createG25PostgresHarness({ authorityTables: true });
  for (const candidate of beforeCustody) await sharedDatabase.exec(candidate);
  await sharedDatabase.query(
    "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4), ($5::uuid, $6), ($7::uuid, $8)",
    [
      subject, "r75-subject@example.test",
      owner, "r75-owner@example.test",
      outsider, "r75-outsider@example.test",
      replacement, "r75-replacement@example.test",
    ],
  );
  await sharedDatabase.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $3::uuid, $4)",
    [workspace, subject, owner, "r75-stable-custody"],
  );
  await sharedDatabase.query(
    "insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values ($1::uuid, $2::uuid, 'operator', $2::uuid), ($1::uuid, $3::uuid, 'operator', $2::uuid)",
    [workspace, owner, outsider],
  );
  for (const candidate of afterSeed) await sharedDatabase.exec(candidate);
  ownerOperator = String(await scalar(
    "select operator_principal_id from private.brain_operator_auth_links where user_id = $1::uuid and revoked_at is null",
    [owner],
  ));
  await sharedDatabase.query(
    "insert into private.brain_operator_principals(id) values ($1::uuid)",
    [replacementOperator],
  );
  await sharedDatabase.query(
    "insert into private.brain_operator_auth_links(operator_principal_id, user_id) values ($1::uuid, $2::uuid)",
    [replacementOperator, replacement],
  );
  await sharedDatabase.query(
    "insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values ($1::uuid, $2::uuid, 'operator', $3::uuid)",
    [workspace, replacement, owner],
  );
});
afterAll(async () => { await sharedDatabase?.close(); });

function database() {
  if (!sharedDatabase) throw new Error("R75 PostgreSQL harness is not initialized");
  return sharedDatabase;
}

type RuntimeRole = "authenticated" | "service_role" | "provider_dispatch_issuer" | "provider_deletion_worker";

async function asRole<T>(role: RuntimeRole, action: () => Promise<T>) {
  const db = database();
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function withClaims<T>(userId: string, action: () => Promise<T>) {
  const db = database();
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, is_anonymous: false }),
  ]);
  try { return await action(); } finally {
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.query("select set_config('request.jwt.claims', '{}', false)");
  }
}

async function scalar(sql: string, params: unknown[] = []) {
  const result = await database().query(sql, params);
  return Object.values(result.rows[0])[0];
}

function uuid(group: number) {
  return `75000000-0000-4000-800${group}-${String(sequence++).padStart(12, "0")}`;
}

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function createDeadLetteredDispatch() {
  const now = new Date();
  const receiptId = uuid(0);
  const receipt = {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: receiptId,
    workspace_id: workspace,
    provider: "elevenlabs",
    processor_kind: "audio",
    callsite: "supabase/functions/generate-tts/index.ts",
    purpose_family: "briefing_and_coaching",
    data_classes: ["public_web_content"],
    request_sha256: sha(`${receiptId}:request`),
    idempotency_key_sha256: sha(`${receiptId}:idempotency`),
    query_minimization_sha256: null,
    control_mode: "public_policy_default",
    control_evidence_sha256: "a".repeat(64),
    occurred_at: new Date(now.getTime() - 10_000).toISOString(),
  };
  await asRole("service_role", () => scalar(
    "select private.brain_record_provider_exchange($1::jsonb)",
    [JSON.stringify(receipt)],
  ));
  const dispatchId = uuid(1);
  const command = {
    schema_version: "ctrl.provider-deletion-dispatch-record.r73",
    dispatch_id: dispatchId,
    topology_sha256: "b".repeat(64),
    target_cell: "deletion_worker",
    attempt: 1,
    predecessor_dispatch_id: null,
    authority_token_sha256: sha(`${dispatchId}:authority`),
    envelope_sha256: sha(`${dispatchId}:envelope`),
    workspace_id: workspace,
    receipt_id: receiptId,
    handle_id: uuid(2),
    provider: "elevenlabs",
    job_id: uuid(3),
    operation: "destroy",
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    expires_at: new Date(now.getTime() + 240_000).toISOString(),
  };
  await asRole("provider_dispatch_issuer", () => scalar(
    "select private.brain_record_provider_deletion_dispatch($1::jsonb)",
    [JSON.stringify(command)],
  ));
  const sent = event(command, "dispatched", null, "authority_issuer", now);
  const failed = event(command, "failed_terminal", sent.event_id, "deletion_worker", new Date(now.getTime() + 1_000));
  const dead = event(command, "dead_lettered", failed.event_id, "authority_issuer", new Date(now.getTime() + 2_000));
  await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", sent);
  await append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_worker_event", failed);
  await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", dead);
  return { command, dead, now };
}

function event(
  command: { dispatch_id: string; attempt: number },
  kind: string,
  predecessor: string | null,
  actor: "authority_issuer" | "deletion_worker" | "operator",
  occurredAt: Date,
) {
  return {
    schema_version: "ctrl.provider-deletion-dispatch-event.r71",
    event_id: uuid(4),
    dispatch_id: command.dispatch_id,
    event_kind: kind,
    actor_cell: actor,
    attempt: command.attempt,
    predecessor_event_id: predecessor,
    occurred_at: occurredAt.toISOString(),
    result_receipt_sha256: null,
    failure_code: kind === "failed_terminal" ? "provider_timeout" : null,
    failure_evidence_sha256: kind === "failed_terminal" ? "d".repeat(64) : null,
    next_dispatch_id: null,
    recovery_note_sha256: kind.startsWith("operator_recovery_") ? "e".repeat(64) : null,
  };
}

async function append(role: RuntimeRole, functionName: string, value: ReturnType<typeof event>) {
  return asRole(role, () => scalar(`select private.${functionName}($1::jsonb)`, [JSON.stringify(value)]));
}

function recoveryFor(setup: Awaited<ReturnType<typeof createDeadLetteredDispatch>>) {
  return event(
    setup.command,
    "operator_recovery_requested",
    setup.dead.event_id,
    "operator",
    new Date(setup.now.getTime() + 3_000),
  );
}

async function recoverAs(userId: string, recovery: ReturnType<typeof event>) {
  return withClaims(userId, () => asRole("authenticated", () => scalar(
    "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
    [JSON.stringify(recovery)],
  )));
}

describe("provider deletion stable-custody operator recovery PostgreSQL R75", () => {
  it("allows the signed-in operator holding current customer custody", async () => {
    const setup = await createDeadLetteredDispatch();
    await expect(recoverAs(owner, recoveryFor(setup))).resolves.toMatchObject({
      status: "recorded",
      state: "operator_recovery_requested",
    });
  });

  it("rejects a workspace operator who does not hold current custody", async () => {
    const setup = await createDeadLetteredDispatch();
    await expect(recoverAs(outsider, recoveryFor(setup)))
      .rejects.toThrow("provider_deletion_dispatch_operator_custody_denied");
  });

  it("rejects a revoked stable operator login even while its workspace role remains", async () => {
    const setup = await createDeadLetteredDispatch();
    await database().query(
      "update private.brain_operator_auth_links set revoked_at = now() where operator_principal_id = $1::uuid and user_id = $2::uuid",
      [ownerOperator, owner],
    );
    await expect(recoverAs(owner, recoveryFor(setup)))
      .rejects.toThrow("provider_deletion_dispatch_operator_custody_denied");
    await database().query(
      "update private.brain_operator_auth_links set revoked_at = null where operator_principal_id = $1::uuid and user_id = $2::uuid",
      [ownerOperator, owner],
    );
  });

  it("moves recovery authority with customer-authorised custody transfer", async () => {
    const setup = await createDeadLetteredDispatch();
    await asRole("service_role", () => scalar(
      "select private.brain_transfer_workspace_custody($1::uuid, $2::uuid, $3::uuid, $4, statement_timestamp() + interval '1 second')",
      [workspace, ownerOperator, replacementOperator, "f".repeat(64)],
    ));
    await expect(recoverAs(owner, recoveryFor(setup)))
      .rejects.toThrow("provider_deletion_dispatch_operator_custody_denied");
    await expect(recoverAs(replacement, recoveryFor(setup))).resolves.toMatchObject({
      status: "recorded",
      state: "operator_recovery_requested",
    });
  });
});
