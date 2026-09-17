// @vitest-environment node

import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createG25PostgresHarness } from "../../../scripts/lib/g25-postgres-harness.mjs";
import { prepareResearchOperation } from "./prepared-research-operation.r54";
import type { PublicSourceAdmissionDependencies } from "./public-source-admission.r52";
import {
  classifyResearchProviderOutcome,
  type ResearchProviderOutcomeDependencies,
} from "./research-provider-outcome.r55";

const root = process.cwd();
const candidates = [
  "supabase/candidates/g25_provider_exchange_receipt_registry_r49.sql",
  "supabase/candidates/g25_provider_exchange_retry_identity_r51.sql",
  "supabase/candidates/g25_provider_route_matrix_r53.sql",
].map((path) => readFileSync(resolve(root, path), "utf8"));
const workspace = "56000000-0000-4000-8000-000000000001";
const owner = "56000000-0000-4000-8000-000000000002";
const sha256 = async (value: string) => createHash("sha256").update(value).digest("hex");
const databases: Array<Awaited<ReturnType<typeof createG25PostgresHarness>>> = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.close();
});

async function database() {
  const db = await createG25PostgresHarness();
  databases.push(db);
  await db.query("insert into auth.users(id, email) values ($1::uuid, $2)", [owner, "r56@example.test"]);
  await db.query(
    "insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values ($1::uuid, $2::uuid, $2::uuid, $3)",
    [workspace, owner, "r56-research-corridor"],
  );
  for (const candidate of candidates) await db.exec(candidate);
  return db;
}

async function asService<T>(db: Awaited<ReturnType<typeof database>>, action: () => Promise<T>) {
  await db.exec("set role service_role");
  try { return await action(); } finally { await db.exec("reset role"); }
}

async function scalar(db: Awaited<ReturnType<typeof database>>, sql: string, params: unknown[] = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

function dependencies(now: Date) {
  const admission: PublicSourceAdmissionDependencies = {
    sha256,
    now: () => now,
    fetchPublicSource: vi.fn(async (url) => ({
      status: 200,
      final_url: url,
      content_type: "text/plain",
      body: "Current public evidence about AI adoption in marketing.",
      fetched_at: new Date(now.getTime() - 1_000).toISOString(),
      verified_public_route: true,
    })),
  };
  const outcome: ResearchProviderOutcomeDependencies = {
    sha256,
    now: () => now,
    hmacProviderRequestIdentity: async (provider, raw) => createHmac("sha256", "r56-test-key")
      .update(`${provider}\n${raw}`)
      .digest("hex"),
  };
  return { admission, outcome };
}

async function operation(receiptId: string, operationDigest: string, now: Date) {
  return prepareResearchOperation({
    schema_version: "ctrl.prepare-research-operation.r54",
    receipt_id: receiptId,
    workspace_id: workspace,
    idempotency_key_sha256: operationDigest,
    callsite: "supabase/functions/decision-engine/retrievers.ts",
    occurred_at: new Date(now.getTime() - 4_000).toISOString(),
    control_mode: "request_verified_zdr",
    control_evidence_sha256: "b".repeat(64),
    admission: {
      schema_version: "ctrl.public-source-admission.r52",
      admission_kind: "web_evidence",
      public_source_urls: ["https://public.example.org/report"],
      query: {
        schema_version: "ctrl.public-research-query.r50",
        query_kind: "public_topic_terms",
        provider: "brave",
        purpose: "decision_evidence",
        terms: ["ai-adoption", "marketing"],
      },
    },
  }, dependencies(now).admission);
}

describe("prepared research PostgreSQL corridor R56", () => {
  it("requires receipt persistence before accepting the initial provider event", async () => {
    const db = await database();
    const now = new Date();
    const prepared = await operation(
      "56000000-0000-4000-8000-000000000010", "1".repeat(64), now,
    );
    const event = await classifyResearchProviderOutcome(prepared, {
      schema_version: "ctrl.research-provider-outcome.r55",
      event_id: "56000000-0000-4000-8000-000000000101",
      idempotency_key_sha256: "2".repeat(64),
      outcome: "accepted",
      provider_request_id: "request-r56-accepted",
      provider_response_sha256: "c".repeat(64),
      response_control_sha256: "d".repeat(64),
      occurred_at: new Date(now.getTime() - 2_000).toISOString(),
    }, dependencies(now).outcome);

    await expect(asService(db, () => db.query(
      "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(event)],
    ))).rejects.toThrow("provider_event_receipt_not_found");

    const receiptResult = await asService(db, () => scalar(db,
      "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(prepared.receipt_command)],
    ));
    const eventResult = await asService(db, () => scalar(db,
      "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(event)],
    ));
    expect(receiptResult.status).toBe("recorded");
    expect(eventResult.status).toBe("recorded");
  });

  it("persists only digest evidence, converges on replay and rejects changed outcome evidence", async () => {
    const db = await database();
    const now = new Date();
    const prepared = await operation(
      "56000000-0000-4000-8000-000000000020", "3".repeat(64), now,
    );
    const outcomeInput = {
      schema_version: "ctrl.research-provider-outcome.r55" as const,
      event_id: "56000000-0000-4000-8000-000000000102",
      idempotency_key_sha256: "4".repeat(64),
      outcome: "accepted" as const,
      provider_request_id: "request-r56-secret",
      provider_response_sha256: "e".repeat(64),
      response_control_sha256: "f".repeat(64),
      occurred_at: new Date(now.getTime() - 2_000).toISOString(),
    };
    const event = await classifyResearchProviderOutcome(prepared, outcomeInput, dependencies(now).outcome);
    await asService(db, () => scalar(db,
      "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(prepared.receipt_command)],
    ));
    await asService(db, () => scalar(db,
      "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(event)],
    ));

    const receiptReplay = await asService(db, () => scalar(db,
      "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(prepared.receipt_command)],
    ));
    const eventReplay = await asService(db, () => scalar(db,
      "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(event)],
    ));
    expect(receiptReplay.status).toBe("idempotent");
    expect(eventReplay.status).toBe("idempotent");

    const stored = await scalar(db, `
      select jsonb_build_object(
        'exchange', to_jsonb(x),
        'event', to_jsonb(e)
      )::text
      from private.brain_provider_exchanges x
      join private.brain_provider_exchange_events e on e.exchange_id = x.id
      where x.id = $1::uuid
    `, [prepared.receipt_command.receipt_id]);
    expect(stored).not.toContain("request-r56-secret");
    expect(stored).not.toContain("ai-adoption marketing");
    expect(event.provider_request_identity_hmac).toMatch(/^[0-9a-f]{64}$/);

    const changed = await classifyResearchProviderOutcome(prepared, {
      ...outcomeInput,
      event_id: "56000000-0000-4000-8000-000000000199",
      provider_response_sha256: "9".repeat(64),
    }, dependencies(now).outcome);
    await expect(asService(db, () => db.query(
      "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(changed)],
    ))).rejects.toThrow("provider_event_operation_identity_conflict");
  });

  it.each(["rejected", "outcome_unknown"] as const)(
    "accepts the honest initial %s state with no invented provider identity",
    async (outcomeKind) => {
      const db = await database();
      const now = new Date();
      const discriminator = outcomeKind === "rejected" ? "5" : "6";
      const prepared = await operation(
        `56000000-0000-4000-8000-0000000000${discriminator}0`, discriminator.repeat(64), now,
      );
      const event = await classifyResearchProviderOutcome(prepared, {
        schema_version: "ctrl.research-provider-outcome.r55",
        event_id: `56000000-0000-4000-8000-0000000001${discriminator}0`,
        idempotency_key_sha256: (outcomeKind === "rejected" ? "7" : "8").repeat(64),
        outcome: outcomeKind,
        provider_request_id: null,
        provider_response_sha256: "a".repeat(64),
        response_control_sha256: "b".repeat(64),
        occurred_at: new Date(now.getTime() - 2_000).toISOString(),
      }, dependencies(now).outcome);
      await asService(db, () => scalar(db,
        "select private.brain_record_provider_exchange($1::jsonb)", [JSON.stringify(prepared.receipt_command)],
      ));
      const result = await asService(db, () => scalar(db,
        "select private.brain_append_provider_exchange_event($1::jsonb)", [JSON.stringify(event)],
      ));
      expect(result.event_kind).toBe(outcomeKind);
      expect(event.provider_request_identity_hmac).toBeNull();
    },
  );
});
