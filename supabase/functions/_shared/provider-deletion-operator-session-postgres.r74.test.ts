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
  "supabase/candidates/g25_provider_deletion_operator_session_r74.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "74000000-0000-4000-8000-000000000001";
const owner = "74000000-0000-4000-8000-000000000002";
const outsider = "74000000-0000-4000-8000-000000000003";
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 10;

beforeAll(async () => {
  sharedDatabase = await createG25PostgresHarness();
  await sharedDatabase.query(
    "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4)",
    [owner, "r74-operator@example.test", outsider, "r74-outsider@example.test"],
  );
  await sharedDatabase.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r74-operator-session"],
  );
  await sharedDatabase.query(
    "insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values ($1::uuid, $2::uuid, 'operator', $2::uuid)",
    [workspace, owner],
  );
  for (const candidate of candidates) await sharedDatabase.exec(candidate);
});
afterAll(async () => { await sharedDatabase?.close(); });

function database() {
  if (!sharedDatabase) throw new Error("R74 PostgreSQL harness is not initialized");
  return sharedDatabase;
}

type RuntimeRole =
  | "authenticated"
  | "service_role"
  | "provider_dispatch_issuer"
  | "provider_deletion_worker"
  | "provider_deletion_operator";

async function asRole<T>(role: RuntimeRole, action: () => Promise<T>) {
  const db = database();
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function withClaims<T>(
  userId: string | null,
  isAnonymous: boolean,
  action: () => Promise<T>,
) {
  const db = database();
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, is_anonymous: isAnonymous }),
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
  return `74000000-0000-4000-800${group}-${String(sequence++).padStart(12, "0")}`;
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

function recoveryFor(
  setup: Awaited<ReturnType<typeof createDeadLetteredDispatch>>,
  offset = 3_000,
) {
  return event(
    setup.command,
    "operator_recovery_requested",
    setup.dead.event_id,
    "operator",
    new Date(setup.now.getTime() + offset),
  );
}

describe("provider deletion human operator session PostgreSQL R74", () => {
  it("allows an active human operator to request recovery for their workspace", async () => {
    const setup = await createDeadLetteredDispatch();
    const recovery = recoveryFor(setup);
    const result = await withClaims(owner, false, () => asRole("authenticated", () => scalar(
      "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
      [JSON.stringify(recovery)],
    )));
    expect(result).toMatchObject({ status: "recorded", state: "operator_recovery_requested" });
  });

  it("rejects missing, anonymous and wrong-workspace human sessions", async () => {
    const missing = await createDeadLetteredDispatch();
    await expect(asRole("authenticated", () => scalar(
      "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
      [JSON.stringify(recoveryFor(missing))],
    ))).rejects.toThrow("provider_deletion_dispatch_operator_session_required");

    const anonymous = await createDeadLetteredDispatch();
    await expect(withClaims(owner, true, () => asRole("authenticated", () => scalar(
      "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
      [JSON.stringify(recoveryFor(anonymous))],
    )))).rejects.toThrow("provider_deletion_dispatch_operator_session_required");

    const wrongWorkspace = await createDeadLetteredDispatch();
    await expect(withClaims(outsider, false, () => asRole("authenticated", () => scalar(
      "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
      [JSON.stringify(recoveryFor(wrongWorkspace))],
    )))).rejects.toThrow("provider_deletion_dispatch_operator_scope_denied");
  });

  it("removes machine-role and service-role operator recovery shortcuts", async () => {
    const setup = await createDeadLetteredDispatch();
    const recovery = recoveryFor(setup);
    await expect(append(
      "provider_deletion_operator",
      "brain_append_provider_deletion_dispatch_operator_event",
      recovery,
    )).rejects.toThrow();
    await expect(append(
      "service_role",
      "brain_append_provider_deletion_dispatch_operator_event",
      recovery,
    )).rejects.toThrow();
  });

  it("revokes recovery authority immediately when the workspace role ends", async () => {
    const setup = await createDeadLetteredDispatch();
    await database().query(
      "update public.brain_workspace_roles set revoked_at = now() where workspace_id = $1::uuid and user_id = $2::uuid",
      [workspace, owner],
    );
    await expect(withClaims(owner, false, () => asRole("authenticated", () => scalar(
      "select private.brain_append_provider_deletion_dispatch_operator_event($1::jsonb)",
      [JSON.stringify(recoveryFor(setup))],
    )))).rejects.toThrow("provider_deletion_dispatch_operator_scope_denied");
    await database().query(
      "update public.brain_workspace_roles set revoked_at = null where workspace_id = $1::uuid and user_id = $2::uuid",
      [workspace, owner],
    );
  });
});
