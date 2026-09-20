// @vitest-environment node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";

const root = process.cwd();
const candidates = [
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_deletion_dispatch_persistence_r73.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "73000000-0000-4000-8000-000000000001";
const owner = "73000000-0000-4000-8000-000000000002";
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 10;

beforeAll(async () => {
  sharedDatabase = await createG25PostgresHarness();
  await sharedDatabase.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r73@example.test"]);
  await sharedDatabase.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r73-dispatch"],
  );
  for (const candidate of candidates) await sharedDatabase.exec(candidate);
});
afterAll(async () => { await sharedDatabase?.close(); });

function database() {
  if (!sharedDatabase) throw new Error("R73 PostgreSQL harness is not initialized");
  return sharedDatabase;
}

type RuntimeRole = "service_role" | "provider_dispatch_issuer" | "provider_handle_crypto_writer" | "provider_deletion_worker" | "provider_deletion_operator";
async function asRole<T>(role: RuntimeRole, action: () => Promise<T>) {
  const db = database();
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function scalar(sql: string, params: unknown[] = []) {
  const result = await database().query(sql, params);
  return Object.values(result.rows[0])[0];
}

function uuid(group: number) {
  return `73000000-0000-4000-800${group}-${String(sequence++).padStart(12, "0")}`;
}

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function setupExchange(provider: "elevenlabs" | "stripe" = "elevenlabs") {
  const now = new Date();
  const receiptId = uuid(0);
  const receipt = {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: receiptId,
    workspace_id: workspace,
    provider,
    processor_kind: provider === "stripe" ? "billing" : "audio",
    callsite: provider === "stripe" ? "supabase/functions/delete-account/index.ts" : "supabase/functions/generate-tts/index.ts",
    purpose_family: provider === "stripe" ? "billing" : "briefing_and_coaching",
    data_classes: provider === "stripe" ? ["account_identity"] : ["public_web_content"],
    request_sha256: sha(`${receiptId}:request`),
    idempotency_key_sha256: sha(`${receiptId}:idempotency`),
    query_minimization_sha256: null,
    control_mode: provider === "stripe" ? "regulated_retention" : "public_policy_default",
    control_evidence_sha256: "a".repeat(64),
    occurred_at: new Date(now.getTime() - 10_000).toISOString(),
  };
  await asRole("service_role", () => scalar("select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(receipt)]));
  return { now, receipt };
}

function dispatch(
  receipt: Awaited<ReturnType<typeof setupExchange>>["receipt"],
  now: Date,
  options: {
    id?: string;
    jobId?: string;
    handleId?: string;
    attempt?: number;
    predecessorId?: string | null;
    operation?: "register" | "lease" | "destroy";
  } = {},
) {
  const id = options.id ?? uuid(1);
  const operation = options.operation ?? "lease";
  return {
    schema_version: "ctrl.provider-deletion-dispatch-record.r73",
    dispatch_id: id,
    topology_sha256: "b".repeat(64),
    target_cell: operation === "register" ? "crypto_writer" : "deletion_worker",
    attempt: options.attempt ?? 1,
    predecessor_dispatch_id: options.predecessorId ?? null,
    authority_token_sha256: sha(`${id}:authority`),
    envelope_sha256: sha(`${id}:envelope`),
    workspace_id: workspace,
    receipt_id: receipt.receipt_id,
    handle_id: options.handleId ?? uuid(2),
    provider: receipt.provider,
    job_id: options.jobId ?? uuid(3),
    operation,
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    expires_at: new Date(now.getTime() + 240_000).toISOString(),
  };
}

async function record(command: ReturnType<typeof dispatch>) {
  return asRole("provider_dispatch_issuer", () => scalar(
    "select private.brain_record_provider_deletion_dispatch($1::jsonb)", [JSON.stringify(command)],
  ));
}

function event(
  command: ReturnType<typeof dispatch>,
  kind: string,
  predecessor: string | null,
  actor: "authority_issuer" | "crypto_writer" | "deletion_worker" | "operator",
  occurredAt: Date,
  change: Record<string, unknown> = {},
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
    result_receipt_sha256: kind === "completed" ? "c".repeat(64) : null,
    failure_code: kind === "failed_retryable" || kind === "failed_terminal" ? "provider_timeout" : null,
    failure_evidence_sha256: kind === "failed_retryable" || kind === "failed_terminal" ? "d".repeat(64) : null,
    next_dispatch_id: null,
    recovery_note_sha256: kind.startsWith("operator_recovery_") ? "e".repeat(64) : null,
    ...change,
  };
}

async function append(role: RuntimeRole, functionName: string, value: ReturnType<typeof event>) {
  return asRole(role, () => scalar(`select private.${functionName}($1::jsonb)`, [JSON.stringify(value)]));
}

describe("provider deletion dispatch PostgreSQL R73", () => {
  it("records only a content-free projection and converges on exact replay", async () => {
    const { now, receipt } = await setupExchange();
    const command = dispatch(receipt, now);
    expect((await record(command)).status).toBe("recorded");
    expect((await record(command)).status).toBe("idempotent");
    await expect(record({ ...command, topology_sha256: "f".repeat(64) }))
      .rejects.toThrow("provider_deletion_dispatch_identity_conflict");
    const row = (await database().query(
      "select * from private.brain_provider_deletion_dispatches where id = $1::uuid", [command.dispatch_id],
    )).rows[0];
    expect(Object.hasOwn(row, "authority_token")).toBe(false);
    expect(Object.hasOwn(row, "ciphertext")).toBe(false);
    expect(row.authority_token_sha256).toBe(command.authority_token_sha256);
  });

  it("locks worker acceptance and completion into an append-only projection", async () => {
    const { now, receipt } = await setupExchange();
    const command = dispatch(receipt, now);
    await record(command);
    const sent = event(command, "dispatched", null, "authority_issuer", now);
    const accepted = event(command, "accepted", sent.event_id, "deletion_worker", new Date(now.getTime() + 1_000));
    const completed = event(command, "completed", accepted.event_id, "deletion_worker", new Date(now.getTime() + 2_000));
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", sent);
    await append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_worker_event", accepted);
    await append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_worker_event", completed);
    const projection = (await database().query(
      "select current_state, event_count, automatic_terminal, operator_attention_required, closed from private.brain_provider_deletion_dispatches where id = $1::uuid",
      [command.dispatch_id],
    )).rows[0];
    expect(projection).toEqual({
      current_state: "completed", event_count: 3, automatic_terminal: true,
      operator_attention_required: false, closed: true,
    });
    expect((await database().query(
      "select count(*)::int as count from private.brain_provider_deletion_dispatch_events where dispatch_id = $1::uuid",
      [command.dispatch_id],
    )).rows[0].count).toBe(3);
  });

  it("denies wrong roles, direct reads and old broad service access", async () => {
    const { now, receipt } = await setupExchange();
    const command = dispatch(receipt, now);
    await record(command);
    const sent = event(command, "dispatched", null, "authority_issuer", now);
    await expect(append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_issuer_event", sent)).rejects.toThrow();
    await expect(asRole("service_role", () => scalar(
      "select private.brain_record_provider_deletion_dispatch($1::jsonb)", [JSON.stringify(command)],
    ))).rejects.toThrow();
    await expect(asRole("provider_dispatch_issuer", () => database().query(
      "select * from private.brain_provider_deletion_dispatches",
    ))).rejects.toThrow();
  });

  it("requires a closed linked predecessor before recording a retry", async () => {
    const { now, receipt } = await setupExchange();
    const jobId = uuid(3);
    const first = dispatch(receipt, now, { jobId });
    const secondId = uuid(1);
    const second = dispatch(receipt, now, {
      id: secondId,
      jobId,
      handleId: first.handle_id,
      attempt: 2,
      predecessorId: first.dispatch_id,
    });
    await record(first);
    await expect(record(second)).rejects.toThrow("provider_deletion_dispatch_predecessor_invalid");
    const sent = event(first, "dispatched", null, "authority_issuer", now);
    const failed = event(first, "failed_retryable", sent.event_id, "authority_issuer", new Date(now.getTime() + 1_000));
    const retry = event(first, "retry_requested", failed.event_id, "authority_issuer", new Date(now.getTime() + 2_000), {
      next_dispatch_id: secondId,
    });
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", sent);
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", failed);
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", retry);
    expect((await record(second)).status).toBe("recorded");
    await expect(record({ ...second, dispatch_id: uuid(1), handle_id: uuid(2) }))
      .rejects.toThrow("provider_deletion_dispatch_operation_identity_conflict");
  });

  it("rolls back an invalid event without changing the projection", async () => {
    const { now, receipt } = await setupExchange();
    const command = dispatch(receipt, now);
    await record(command);
    const sent = event(command, "dispatched", null, "authority_issuer", now);
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", sent);
    const invalid = event(command, "completed", sent.event_id, "deletion_worker", new Date(now.getTime() + 1_000), {
      result_receipt_sha256: null,
    });
    await expect(append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_worker_event", invalid)).rejects.toThrow();
    const projection = (await database().query(
      "select current_state, event_count from private.brain_provider_deletion_dispatches where id = $1::uuid", [command.dispatch_id],
    )).rows[0];
    expect(projection).toEqual({ current_state: "dispatched", event_count: 1 });
  });

  it("preserves dead-lettered work for explicit human recovery", async () => {
    const { now, receipt } = await setupExchange();
    const command = dispatch(receipt, now);
    await record(command);
    const sent = event(command, "dispatched", null, "authority_issuer", now);
    const failed = event(command, "failed_terminal", sent.event_id, "deletion_worker", new Date(now.getTime() + 1_000));
    const dead = event(command, "dead_lettered", failed.event_id, "authority_issuer", new Date(now.getTime() + 2_000));
    const recovery = event(command, "operator_recovery_requested", dead.event_id, "operator", new Date(now.getTime() + 3_000));
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", sent);
    await append("provider_deletion_worker", "brain_append_provider_deletion_dispatch_worker_event", failed);
    await append("provider_dispatch_issuer", "brain_append_provider_deletion_dispatch_issuer_event", dead);
    await append("provider_deletion_operator", "brain_append_provider_deletion_dispatch_operator_event", recovery);
    const projection = (await database().query(
      "select current_state, automatic_terminal, operator_attention_required, closed from private.brain_provider_deletion_dispatches where id = $1::uuid",
      [command.dispatch_id],
    )).rows[0];
    expect(projection).toEqual({
      current_state: "operator_recovery_requested", automatic_terminal: true,
      operator_attention_required: true, closed: false,
    });
  });
});
