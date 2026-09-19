// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";
import { type BrainKeyring } from "./brain-crypto";
import {
  decryptProviderDeletionHandle,
  encryptProviderDeletionHandle,
  type ProviderDeletionHandleContext,
} from "./provider-deletion-handle-crypto.r64";

const root = process.cwd();
const candidates = [
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_route_matrix_r53.sql",
  "supabase/candidates/g25_provider_closure_facts_r63.sql",
  "supabase/candidates/g25_provider_deletion_handle_custody_r65.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "65000000-0000-4000-8000-000000000001";
const owner = "65000000-0000-4000-8000-000000000002";
const keyring: BrainKeyring = { "handle-key-v1": Buffer.alloc(32, 7).toString("base64") };
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 10;

beforeAll(async () => {
  sharedDatabase = await createG25PostgresHarness();
  await sharedDatabase.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r65@example.test"]);
  await sharedDatabase.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r65-provider-handle"],
  );
  for (const candidate of candidates) await sharedDatabase.exec(candidate);
});
afterAll(async () => { await sharedDatabase?.close(); });

function database() {
  if (!sharedDatabase) throw new Error("R65 PostgreSQL harness is not initialized");
  return sharedDatabase;
}
async function asService<T>(action: () => Promise<T>) {
  const db = database();
  await db.exec("set role service_role");
  try { return await action(); } finally { await db.exec("reset role"); }
}
async function scalar(sql: string, params: unknown[] = []) {
  const result = await database().query(sql, params);
  return Object.values(result.rows[0])[0];
}

function exchange(provider: "elevenlabs" | "stripe", occurredAt: Date) {
  const suffix = String(sequence++).padStart(12, "0");
  const stripe = provider === "stripe";
  return {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: `65000000-0000-4000-8000-${suffix}`,
    workspace_id: workspace,
    provider,
    processor_kind: stripe ? "billing" : "audio",
    callsite: stripe ? "supabase/functions/delete-account/index.ts" : "supabase/functions/generate-tts/index.ts",
    purpose_family: stripe ? "billing" : "briefing_and_coaching",
    data_classes: stripe ? ["account_identity", "billing_metadata"] : ["public_web_content"],
    request_sha256: String(sequence % 10).repeat(64),
    idempotency_key_sha256: String((sequence + 1) % 10).repeat(64),
    query_minimization_sha256: null,
    control_mode: stripe ? "regulated_retention" : "public_policy_default",
    control_evidence_sha256: "a".repeat(64),
    occurred_at: occurredAt.toISOString(),
  };
}

function accepted(receiptId: string, occurredAt: Date) {
  const suffix = String(sequence++).padStart(12, "0");
  return {
    schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
    event_id: `65000000-0000-4000-8001-${suffix}`,
    receipt_id: receiptId,
    event_kind: "accepted",
    idempotency_key_sha256: String(sequence % 10).repeat(64),
    provider_request_identity_hmac: "b".repeat(64),
    evidence_sha256: "c".repeat(64),
    occurred_at: occurredAt.toISOString(),
  };
}

async function setupExchange(provider: "elevenlabs" | "stripe", now: Date, acceptedState = true) {
  const receipt = exchange(provider, new Date(now.getTime() - 10_000));
  await asService(() => scalar("select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(receipt)]));
  if (acceptedState) {
    await asService(() => scalar("select private.brain_append_provider_exchange_event($1::jsonb)", [
      JSON.stringify(accepted(receipt.receipt_id, new Date(now.getTime() - 9_000))),
    ]));
  }
  return receipt;
}

async function registration(receipt: Awaited<ReturnType<typeof setupExchange>>, providerHandle: string, now: Date, options?: {
  createdAt?: Date;
  expiresAt?: Date | null;
}) {
  const stripe = receipt.provider === "stripe";
  const handleId = `65000000-0000-4000-8002-${String(sequence++).padStart(12, "0")}`;
  const createdAt = options?.createdAt ?? new Date(now.getTime() - 8_000);
  const expiresAt = options?.expiresAt === undefined
    ? stripe ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000)
    : options.expiresAt;
  const context: ProviderDeletionHandleContext = {
    workspaceId: workspace,
    receiptId: receipt.receipt_id,
    handleId,
    provider: receipt.provider,
    retentionClass: stripe ? "account_lifetime" : "exchange_window",
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
    purpose: "provider_deletion",
  };
  const envelope = JSON.parse(await encryptProviderDeletionHandle({
    providerHandle,
    context,
    keyring,
    activeKeyId: "handle-key-v1",
  }));
  return {
    context,
    command: {
      schema_version: "ctrl.provider-deletion-handle.r65",
      handle_id: handleId,
      receipt_id: receipt.receipt_id,
      provider: receipt.provider,
      retention_class: context.retentionClass,
      cipher_envelope: envelope,
      registration_idempotency_sha256: String(sequence % 10).repeat(64),
      created_at: context.createdAt,
      expires_at: context.expiresAt,
    },
  };
}

async function register(command: Awaited<ReturnType<typeof registration>>["command"]) {
  return asService(() => scalar("select private.brain_register_provider_deletion_handle($1::jsonb)", [JSON.stringify(command)]));
}
async function lease(handleId: string, token = "d".repeat(64)) {
  return asService(() => scalar("select private.brain_lease_provider_deletion_handle($1::jsonb)", [JSON.stringify({
    schema_version: "ctrl.provider-deletion-handle-lease.r65",
    handle_id: handleId,
    lease_token_hmac: token,
    lease_seconds: 300,
  })]));
}

describe("provider deletion handle PostgreSQL R65", () => {
  it("requires an accepted exchange and exact provider coherence", async () => {
    const now = new Date();
    const unaccepted = await setupExchange("elevenlabs", now, false);
    const prepared = await registration(unaccepted, "generation_unaccepted", now);
    await expect(register(prepared.command)).rejects.toThrow("provider_deletion_handle_exchange_not_accepted");
    const acceptedReceipt = await setupExchange("elevenlabs", now);
    const mismatch = await registration(acceptedReceipt, "generation_mismatch", now);
    await expect(register({ ...mismatch.command, provider: "stripe", retention_class: "account_lifetime", expires_at: null }))
      .rejects.toThrow("provider_deletion_handle_provider_mismatch");
  });

  it("round-trips an R64 encrypted envelope through a bounded lease", async () => {
    const now = new Date();
    const receipt = await setupExchange("elevenlabs", now);
    const prepared = await registration(receipt, "generation_secret_r65", now);
    expect((await register(prepared.command)).status).toBe("recorded");
    const first = await lease(prepared.command.handle_id);
    const replay = await lease(prepared.command.handle_id);
    expect(first.status).toBe("leased");
    expect(replay.status).toBe("idempotent");
    expect(JSON.stringify(first)).not.toContain("generation_secret_r65");
    await expect(lease(prepared.command.handle_id, "e".repeat(64))).rejects.toThrow("provider_deletion_handle_already_leased");
    await expect(decryptProviderDeletionHandle({
      envelope: JSON.stringify(first.cipher_envelope),
      context: prepared.context,
      keyring,
    })).resolves.toBe("generation_secret_r65");
  });

  it("converges on registration replay and rejects changed ciphertext", async () => {
    const now = new Date();
    const receipt = await setupExchange("elevenlabs", now);
    const prepared = await registration(receipt, "generation_replay", now);
    expect((await register(prepared.command)).status).toBe("recorded");
    expect((await register(prepared.command)).status).toBe("idempotent");
    const changed = structuredClone(prepared.command);
    changed.cipher_envelope.ciphertext = `${changed.cipher_envelope.ciphertext}A`;
    await expect(register(changed)).rejects.toThrow("provider_deletion_handle_operation_identity_conflict");
  });

  it("destroys an expired exchange handle without returning ciphertext", async () => {
    const now = new Date();
    const receipt = await setupExchange("elevenlabs", new Date(now.getTime() - 2 * 24 * 60 * 60 * 1_000));
    const prepared = await registration(receipt, "generation_expired", now, {
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1_000),
      expiresAt: new Date(now.getTime() - 60 * 60 * 1_000),
    });
    await register(prepared.command);
    expect(await lease(prepared.command.handle_id)).toEqual({
      status: "expired_and_destroyed",
      handle_id: prepared.command.handle_id,
    });
    expect(await scalar("select cipher_envelope is null from private.brain_provider_deletion_handles where id = $1::uuid", [prepared.command.handle_id])).toBe(true);
  });

  it("requires a matching operational-success fact before destroying a leased handle", async () => {
    const now = new Date();
    const receipt = await setupExchange("elevenlabs", now);
    const prepared = await registration(receipt, "generation_delete", now);
    await register(prepared.command);
    const token = "f".repeat(64);
    await lease(prepared.command.handle_id, token);
    const closureId = `65000000-0000-4000-8003-${String(sequence++).padStart(12, "0")}`;
    const destroy = {
      schema_version: "ctrl.provider-deletion-handle-destroy.r65",
      handle_id: prepared.command.handle_id,
      lease_token_hmac: token,
      destroy_reason: "operational_deletion",
      closure_fact_id: closureId,
    };
    await expect(asService(() => scalar("select private.brain_destroy_provider_deletion_handle($1::jsonb)", [JSON.stringify(destroy)])))
      .rejects.toThrow("provider_deletion_handle_success_fact_required");
    await asService(() => scalar("select private.brain_append_provider_closure_fact($1::jsonb)", [JSON.stringify({
      schema_version: "ctrl.provider-closure-fact.r63",
      fact_id: closureId,
      receipt_id: receipt.receipt_id,
      fact_kind: "operational_deletion_succeeded",
      scope: "provider_object",
      idempotency_key_sha256: "1".repeat(64),
      evidence_sha256: "2".repeat(64),
      occurred_at: new Date(now.getTime() - 1_000).toISOString(),
    })]));
    expect((await asService(() => scalar("select private.brain_destroy_provider_deletion_handle($1::jsonb)", [JSON.stringify(destroy)]))).status).toBe("destroyed");
    expect(await scalar("select cipher_envelope is null and lease_token_hmac is null from private.brain_provider_deletion_handles where id = $1::uuid", [prepared.command.handle_id])).toBe(true);
  });

  it("keeps Stripe encrypted for account lifetime and destroys it only after closure proof", async () => {
    const now = new Date();
    const receipt = await setupExchange("stripe", now);
    const prepared = await registration(receipt, "cus_r65_account", now);
    await register(prepared.command);
    expect(await scalar("select expires_at is null from private.brain_provider_deletion_handles where id = $1::uuid", [prepared.command.handle_id])).toBe(true);
    const token = "3".repeat(64);
    await lease(prepared.command.handle_id, token);
    const closureId = `65000000-0000-4000-8003-${String(sequence++).padStart(12, "0")}`;
    await asService(() => scalar("select private.brain_append_provider_closure_fact($1::jsonb)", [JSON.stringify({
      schema_version: "ctrl.provider-closure-fact.r63",
      fact_id: closureId,
      receipt_id: receipt.receipt_id,
      fact_kind: "operational_deletion_succeeded",
      scope: "provider_object",
      idempotency_key_sha256: "4".repeat(64),
      evidence_sha256: "5".repeat(64),
      occurred_at: new Date(now.getTime() - 1_000).toISOString(),
    })]));
    const destroyed = await asService(() => scalar("select private.brain_destroy_provider_deletion_handle($1::jsonb)", [JSON.stringify({
      schema_version: "ctrl.provider-deletion-handle-destroy.r65",
      handle_id: prepared.command.handle_id,
      lease_token_hmac: token,
      destroy_reason: "account_closure",
      closure_fact_id: closureId,
    })]));
    expect(destroyed).toMatchObject({ status: "destroyed", destroy_reason: "account_closure" });
  });

  it("denies service-role raw inserts", async () => {
    const now = new Date();
    const receipt = await setupExchange("stripe", now);
    await expect(asService(() => database().query(
      "insert into private.brain_provider_deletion_handles(id, schema_version, exchange_id, provider, retention_class, cipher_envelope, registration_idempotency_sha256, created_at) values ($1::uuid, 'ctrl.provider-deletion-handle.r65', $2::uuid, 'stripe', 'account_lifetime', '{}'::jsonb, $3, now())",
      [`65000000-0000-4000-8002-${String(sequence++).padStart(12, "0")}`, receipt.receipt_id, "6".repeat(64)],
    ))).rejects.toThrow();
  });
});
