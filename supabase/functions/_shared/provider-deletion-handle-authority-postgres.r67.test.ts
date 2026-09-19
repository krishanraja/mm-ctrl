// @vitest-environment node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";
import { type BrainKeyring } from "./brain-crypto";
import {
  issueProviderHandleAuthority,
  verifyProviderHandleAuthority,
  type ExpectedProviderHandleAuthority,
  type ProviderHandleAuthorityKeyring,
  type ProviderHandleAuthorityOperation,
  type ProviderHandleAuthorityRequest,
} from "./provider-deletion-handle-authority.r66";
import {
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
  "supabase/candidates/g25_provider_deletion_handle_authority_spend_r67.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "67000000-0000-4000-8000-000000000001";
const owner = "67000000-0000-4000-8000-000000000002";
const handleKeyring: BrainKeyring = { "handle-key-v1": Buffer.alloc(32, 17).toString("base64") };
const authorityKeyring: ProviderHandleAuthorityKeyring = { "authority-key-v1": Buffer.alloc(32, 18).toString("base64") };
let sharedDatabase: Awaited<ReturnType<typeof createG25PostgresHarness>> | null = null;
let sequence = 10;

beforeAll(async () => {
  sharedDatabase = await createG25PostgresHarness();
  await sharedDatabase.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r67@example.test"]);
  await sharedDatabase.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r67-provider-authority"],
  );
  for (const candidate of candidates) await sharedDatabase.exec(candidate);
});
afterAll(async () => { await sharedDatabase?.close(); });

function database() {
  if (!sharedDatabase) throw new Error("R67 PostgreSQL harness is not initialized");
  return sharedDatabase;
}

async function asRole<T>(role: "service_role" | "provider_handle_crypto_writer" | "provider_deletion_worker", action: () => Promise<T>) {
  const db = database();
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function scalar(sql: string, params: unknown[] = []) {
  const result = await database().query(sql, params);
  return Object.values(result.rows[0])[0];
}

function nextUuid(group: number) {
  return `67000000-0000-4000-800${group}-${String(sequence++).padStart(12, "0")}`;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function exchange(provider: "elevenlabs" | "stripe", now: Date) {
  const stripe = provider === "stripe";
  const receiptId = nextUuid(0);
  return {
    schema_version: "ctrl.provider-exchange-receipt.r51",
    receipt_id: receiptId,
    workspace_id: workspace,
    provider,
    processor_kind: stripe ? "billing" : "audio",
    callsite: stripe ? "supabase/functions/delete-account/index.ts" : "supabase/functions/generate-tts/index.ts",
    purpose_family: stripe ? "billing" : "briefing_and_coaching",
    data_classes: stripe ? ["account_identity", "billing_metadata"] : ["public_web_content"],
    request_sha256: sha256(`${receiptId}:request`),
    idempotency_key_sha256: sha256(`${receiptId}:idempotency`),
    query_minimization_sha256: null,
    control_mode: stripe ? "regulated_retention" : "public_policy_default",
    control_evidence_sha256: "a".repeat(64),
    occurred_at: new Date(now.getTime() - 10_000).toISOString(),
  };
}

async function setupExchange(provider: "elevenlabs" | "stripe", now = new Date()) {
  const receipt = exchange(provider, now);
  await asRole("service_role", () => scalar("select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(receipt)]));
  const eventId = nextUuid(1);
  await asRole("service_role", () => scalar("select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify({
    schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
    event_id: eventId,
    receipt_id: receipt.receipt_id,
    event_kind: "accepted",
    idempotency_key_sha256: sha256(`${eventId}:idempotency`),
    provider_request_identity_hmac: "b".repeat(64),
    evidence_sha256: "c".repeat(64),
    occurred_at: new Date(now.getTime() - 9_000).toISOString(),
  })]));
  return receipt;
}

async function preparedRegistration(provider: "elevenlabs" | "stripe" = "elevenlabs", now = new Date()) {
  const receipt = await setupExchange(provider, now);
  const handleId = nextUuid(2);
  const createdAt = new Date(now.getTime() - 8_000).toISOString();
  const expiresAt = provider === "stripe" ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000).toISOString();
  const context: ProviderDeletionHandleContext = {
    workspaceId: workspace,
    receiptId: receipt.receipt_id,
    handleId,
    provider,
    retentionClass: provider === "stripe" ? "account_lifetime" : "exchange_window",
    createdAt,
    expiresAt,
    purpose: "provider_deletion",
  };
  const serializedEnvelope = await encryptProviderDeletionHandle({
    providerHandle: provider === "stripe" ? `cus_r67_${sequence}` : `generation_r67_${sequence}`,
    context,
    keyring: handleKeyring,
    activeKeyId: "handle-key-v1",
  });
  return {
    receipt,
    context,
    command: {
      schema_version: "ctrl.provider-deletion-handle.r65",
      handle_id: handleId,
      receipt_id: receipt.receipt_id,
      provider,
      retention_class: context.retentionClass,
      cipher_envelope: JSON.parse(serializedEnvelope),
      cipher_envelope_sha256: sha256(serializedEnvelope),
      registration_idempotency_sha256: String(sequence % 10).repeat(64),
      created_at: createdAt,
      expires_at: expiresAt,
    },
  };
}

async function authority(request: ProviderHandleAuthorityRequest, expected: ExpectedProviderHandleAuthority, now: Date) {
  const token = await issueProviderHandleAuthority({ request, keyring: authorityKeyring, activeKeyId: "authority-key-v1" });
  const verified = await verifyProviderHandleAuthority({ token, keyring: authorityKeyring, expected, now: now.toISOString() });
  if (verified.status !== "accepted") throw new Error(`authority held: ${verified.reasons.join(",")}`);
  return { authority: verified.authority, tokenSha256: sha256(token) };
}

async function preparedAuthority(
  prepared: Awaited<ReturnType<typeof preparedRegistration>>,
  operation: ProviderHandleAuthorityOperation,
  now: Date,
  operationFields: Record<string, unknown>,
) {
  const request = {
    authority_id: nextUuid(4),
    workspace_id: workspace,
    receipt_id: prepared.receipt.receipt_id,
    handle_id: prepared.command.handle_id,
    provider: prepared.receipt.provider,
    actor_id: nextUuid(5),
    job_id: nextUuid(6),
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    expires_at: new Date(now.getTime() + 240_000).toISOString(),
    operation,
    ...operationFields,
  } as ProviderHandleAuthorityRequest;
  const expected: ExpectedProviderHandleAuthority = {
    operation,
    workspace_id: workspace,
    receipt_id: prepared.receipt.receipt_id,
    handle_id: prepared.command.handle_id,
    provider: prepared.receipt.provider,
    job_id: request.job_id,
  };
  return authority(request, expected, now);
}

async function registerPrepared(prepared: Awaited<ReturnType<typeof preparedRegistration>>, now = new Date()) {
  const auth = await preparedAuthority(prepared, "register", now, {
    cipher_envelope_sha256: prepared.command.cipher_envelope_sha256,
  });
  const result = await asRole("provider_handle_crypto_writer", () => scalar(
    "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
    [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(prepared.command)],
  ));
  return { auth, result };
}

describe("provider deletion-handle authority spend PostgreSQL R67", () => {
  it("lets only the crypto writer register and converges on an exact replay", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    const first = await registerPrepared(prepared, now);
    expect(first.result.status).toBe("recorded");
    const replay = await asRole("provider_handle_crypto_writer", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(first.auth.authority), first.auth.tokenSha256, JSON.stringify(prepared.command)],
    ));
    expect(replay.status).toBe("idempotent");
    await expect(asRole("service_role", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(first.auth.authority), first.auth.tokenSha256, JSON.stringify(prepared.command)],
    ))).rejects.toThrow();
  });

  it("denies every role the other role's operation", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    const auth = await preparedAuthority(prepared, "register", now, {
      cipher_envelope_sha256: prepared.command.cipher_envelope_sha256,
    });
    await expect(asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(prepared.command)],
    ))).rejects.toThrow();
    await expect(asRole("provider_handle_crypto_writer", () => scalar(
      "select private.brain_authorized_lease_provider_deletion_handle('{}'::jsonb, $1, '{}'::jsonb)",
      ["d".repeat(64)],
    ))).rejects.toThrow();
  });

  it("requires a worker authority to lease and permits only its exact retry", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    await registerPrepared(prepared, now);
    const auth = await preparedAuthority(prepared, "lease", now, { lease_seconds: 300 });
    const lease = {
      schema_version: "ctrl.provider-deletion-handle-lease.r65",
      handle_id: prepared.command.handle_id,
      lease_token_hmac: "d".repeat(64),
      lease_seconds: 300,
    };
    const first = await asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_lease_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(lease)],
    ));
    expect(first.status).toBe("leased");
    const replay = await asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_lease_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(lease)],
    ));
    expect(replay.status).toBe("idempotent");
    await expect(asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_lease_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), "e".repeat(64), JSON.stringify(lease)],
    ))).rejects.toThrow("provider_handle_authority_replay_conflict");
  });

  it("rolls back an authority spend when the underlying operation fails", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    const auth = await preparedAuthority(prepared, "register", now, {
      cipher_envelope_sha256: prepared.command.cipher_envelope_sha256,
    });
    const invalid = { ...prepared.command, retention_class: "account_lifetime", expires_at: null };
    await expect(asRole("provider_handle_crypto_writer", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(invalid)],
    ))).rejects.toThrow("provider_deletion_handle_exchange_window_invalid");
    expect(await scalar(
      "select count(*)::int from private.brain_provider_handle_authority_spends where authority_id = $1::uuid",
      [auth.authority.authority_id],
    )).toBe(0);
    const repaired = await asRole("provider_handle_crypto_writer", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(auth.authority), auth.tokenSha256, JSON.stringify(prepared.command)],
    ));
    expect(repaired.status).toBe("recorded");
  });

  it("rejects expired authority before touching the handle", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    const request = {
      authority_id: nextUuid(4), workspace_id: workspace, receipt_id: prepared.receipt.receipt_id,
      handle_id: prepared.command.handle_id, provider: "elevenlabs" as const, actor_id: nextUuid(5), job_id: nextUuid(6),
      issued_at: new Date(now.getTime() - 300_000).toISOString(), expires_at: new Date(now.getTime() - 1).toISOString(),
      operation: "register" as const, cipher_envelope_sha256: prepared.command.cipher_envelope_sha256,
    };
    const token = await issueProviderHandleAuthority({ request, keyring: authorityKeyring, activeKeyId: "authority-key-v1" });
    const parsed = JSON.parse(token);
    await expect(asRole("provider_handle_crypto_writer", () => scalar(
      "select private.brain_authorized_register_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(parsed.authority), sha256(token), JSON.stringify(prepared.command)],
    ))).rejects.toThrow("provider_handle_authority_time_invalid");
  });

  it("requires a matching success fact and destroy authority", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("stripe", now);
    await registerPrepared(prepared, now);
    const leaseAuth = await preparedAuthority(prepared, "lease", now, { lease_seconds: 300 });
    const leaseToken = "f".repeat(64);
    await asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_lease_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(leaseAuth.authority), leaseAuth.tokenSha256, JSON.stringify({
        schema_version: "ctrl.provider-deletion-handle-lease.r65", handle_id: prepared.command.handle_id,
        lease_token_hmac: leaseToken, lease_seconds: 300,
      })],
    ));
    const factId = nextUuid(3);
    await asRole("service_role", () => scalar("select private.brain_append_provider_closure_fact($1::jsonb)", [JSON.stringify({
      schema_version: "ctrl.provider-closure-fact.r63", fact_id: factId, receipt_id: prepared.receipt.receipt_id,
      fact_kind: "operational_deletion_succeeded", scope: "provider_object",
      idempotency_key_sha256: "1".repeat(64), evidence_sha256: "2".repeat(64),
      occurred_at: new Date(now.getTime() - 500).toISOString(),
    })]));
    const destroyAuth = await preparedAuthority(prepared, "destroy", now, {
      destruction_reason: "account_closure_succeeded", success_fact_id: factId,
    });
    const destroyed = await asRole("provider_deletion_worker", () => scalar(
      "select private.brain_authorized_destroy_provider_deletion_handle($1::jsonb, $2, $3::jsonb)",
      [JSON.stringify(destroyAuth.authority), destroyAuth.tokenSha256, JSON.stringify({
        schema_version: "ctrl.provider-deletion-handle-destroy.r65", handle_id: prepared.command.handle_id,
        lease_token_hmac: leaseToken, destroy_reason: "account_closure", closure_fact_id: factId,
      })],
    ));
    expect(destroyed).toMatchObject({ status: "destroyed", destroy_reason: "account_closure" });
  });

  it("rejects operation-field swaps and invalid destruction evidence", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    const registerAuth = await preparedAuthority(prepared, "register", now, {
      cipher_envelope_sha256: prepared.command.cipher_envelope_sha256,
    });
    const swapped = structuredClone(registerAuth.authority) as Record<string, unknown>;
    delete swapped.cipher_envelope_sha256;
    swapped.lease_seconds = 300;
    await expect(scalar(
      "select private.brain_spend_provider_handle_authority($1::jsonb, $2, 'provider_handle_crypto_writer', 'register')",
      [JSON.stringify(swapped), registerAuth.tokenSha256],
    )).rejects.toThrow("provider_handle_authority_shape_invalid");

    const destroyAuth = await preparedAuthority(prepared, "destroy", now, {
      destruction_reason: "operational_deletion_succeeded",
      success_fact_id: nextUuid(3),
    });
    const invalidEvidence = { ...destroyAuth.authority, destruction_reason: "exchange_expired" };
    await expect(scalar(
      "select private.brain_spend_provider_handle_authority($1::jsonb, $2, 'provider_deletion_worker', 'destroy')",
      [JSON.stringify(invalidEvidence), destroyAuth.tokenSha256],
    )).rejects.toThrow("provider_handle_authority_destruction_evidence_invalid");
  });

  it("keeps authority spends content-free and denies direct table reads", async () => {
    const now = new Date();
    const prepared = await preparedRegistration("elevenlabs", now);
    await registerPrepared(prepared, now);
    const serialized = JSON.stringify((await database().query(
      "select * from private.brain_provider_handle_authority_spends where handle_id = $1::uuid",
      [prepared.command.handle_id],
    )).rows[0]);
    expect(serialized).not.toContain("ciphertext");
    expect(serialized).not.toContain("generation_r67");
    await expect(asRole("service_role", () => database().query("select * from private.brain_provider_handle_authority_spends"))).rejects.toThrow();
    await expect(asRole("provider_deletion_worker", () => database().query("select * from private.brain_provider_deletion_handles"))).rejects.toThrow();
  });

  it("denies the old broad service-role entry points", async () => {
    await expect(asRole("service_role", () => scalar(
      "select private.brain_register_provider_deletion_handle('{}'::jsonb)",
    ))).rejects.toThrow();
    await expect(asRole("service_role", () => scalar(
      "select private.brain_lease_provider_deletion_handle('{}'::jsonb)",
    ))).rejects.toThrow();
    await expect(asRole("service_role", () => scalar(
      "select private.brain_destroy_provider_deletion_handle('{}'::jsonb)",
    ))).rejects.toThrow();
  });
});
