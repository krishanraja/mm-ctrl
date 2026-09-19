import { describe, expect, it } from "vitest";
import type { CompiledProviderDeletionJobEnvelope } from "./provider-deletion-job-envelope.r70";
import {
  compileProviderDeletionDispatchLifecycle,
  PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA,
  type ProviderDeletionDispatchEvent,
  type ProviderDeletionDispatchEventKind,
} from "./provider-deletion-dispatch-lifecycle.r71";

const envelope: CompiledProviderDeletionJobEnvelope = {
  schema_version: "ctrl.provider-deletion-job-envelope.r70",
  dispatch_id: "71000000-0000-4000-8000-000000000001",
  topology_sha256: "a".repeat(64),
  target_cell: "deletion_worker",
  attempt: 1,
  predecessor_dispatch_id: null,
  authority_token: "content-free-token",
  issued_at: "2026-09-17T20:00:00Z",
  expires_at: "2026-09-17T20:05:00Z",
  workspace_id: "71000000-0000-4000-8000-000000000002",
  receipt_id: "71000000-0000-4000-8000-000000000003",
  handle_id: "71000000-0000-4000-8000-000000000004",
  provider: "elevenlabs",
  job_id: "71000000-0000-4000-8000-000000000005",
  operation: "lease",
  authority_token_sha256: "b".repeat(64),
  envelope_sha256: "c".repeat(64),
};
let sequence = 10;

function event(kind: ProviderDeletionDispatchEventKind, predecessor: string | null, change: Partial<ProviderDeletionDispatchEvent> = {}): ProviderDeletionDispatchEvent {
  const defaults: ProviderDeletionDispatchEvent = {
    schema_version: PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA,
    event_id: `71000000-0000-4000-8001-${String(sequence++).padStart(12, "0")}`,
    dispatch_id: envelope.dispatch_id,
    event_kind: kind,
    actor_cell: kind === "dispatched" || kind === "retry_requested" || kind === "dead_lettered"
      ? "authority_issuer"
      : kind.startsWith("operator_") ? "operator" : "deletion_worker",
    attempt: envelope.attempt,
    predecessor_event_id: predecessor,
    occurred_at: `2026-09-17T20:00:${String(sequence).padStart(2, "0")}Z`,
    result_receipt_sha256: kind === "completed" ? "d".repeat(64) : null,
    failure_code: kind === "failed_retryable" || kind === "failed_terminal" ? "provider_timeout" : null,
    failure_evidence_sha256: kind === "failed_retryable" || kind === "failed_terminal" ? "e".repeat(64) : null,
    next_dispatch_id: kind === "retry_requested" || kind === "operator_recovery_linked"
      ? "71000000-0000-4000-8000-000000000099" : null,
    recovery_note_sha256: kind.startsWith("operator_recovery_") ? "f".repeat(64) : null,
  };
  return { ...defaults, ...change };
}

function chain(kinds: ProviderDeletionDispatchEventKind[], changes: Partial<ProviderDeletionDispatchEvent>[] = []) {
  const events: ProviderDeletionDispatchEvent[] = [];
  for (const [index, kind] of kinds.entries()) {
    events.push(event(kind, events.at(-1)?.event_id ?? null, changes[index]));
  }
  return events;
}

describe("provider deletion dispatch lifecycle R71", () => {
  it("accepts dispatched, accepted and completed with a content-free receipt digest", async () => {
    const result = await compileProviderDeletionDispatchLifecycle({ envelope, events: chain(["dispatched", "accepted", "completed"]) });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.lifecycle).toMatchObject({
      state: "completed", automatic_terminal: true, operator_attention_required: false, closed: true, event_count: 3,
    });
  });

  it("accepts a retryable failure followed by one linked retry", async () => {
    const events = chain(["dispatched", "accepted", "failed_retryable", "retry_requested"]);
    const result = await compileProviderDeletionDispatchLifecycle({ envelope, events });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.lifecycle).toMatchObject({
      state: "retry_requested", automatic_terminal: true, closed: true,
      next_dispatch_id: "71000000-0000-4000-8000-000000000099",
    });
  });

  it("forces the fifth retryable failure to dead-letter", async () => {
    const fifth = { ...envelope, attempt: 5 };
    const events = chain(["dispatched", "accepted", "failed_retryable", "dead_lettered"])
      .map((item) => ({ ...item, attempt: 5 }));
    await expect(compileProviderDeletionDispatchLifecycle({ envelope: fifth, events })).resolves.toMatchObject({
      status: "accepted", lifecycle: {
        state: "dead_lettered", automatic_terminal: true, operator_attention_required: true, closed: false,
      },
    });
    const retry = chain(["dispatched", "accepted", "failed_retryable", "retry_requested"])
      .map((item) => ({ ...item, attempt: 5 }));
    await expect(compileProviderDeletionDispatchLifecycle({ envelope: fifth, events: retry })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_retry_limit_reached"]),
    });
  });

  it("allows a terminal failure to dead-letter before attempt five", async () => {
    const result = await compileProviderDeletionDispatchLifecycle({
      envelope,
      events: chain(["dispatched", "accepted", "failed_terminal", "dead_lettered"]),
    });
    expect(result.status).toBe("accepted");
  });

  it("rejects prematurely dead-lettering a retryable failure", async () => {
    await expect(compileProviderDeletionDispatchLifecycle({
      envelope,
      events: chain(["dispatched", "failed_retryable", "dead_lettered"]),
    })).resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["dispatch_dead_letter_premature"]) });
  });

  it("records operator recovery as a separate linked dispatch", async () => {
    const events = chain([
      "dispatched", "accepted", "failed_terminal", "dead_lettered",
      "operator_recovery_requested", "operator_recovery_linked",
    ]);
    const result = await compileProviderDeletionDispatchLifecycle({ envelope, events });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.lifecycle).toMatchObject({
      state: "operator_recovery_linked", automatic_terminal: true, operator_attention_required: false, closed: true,
      next_dispatch_id: "71000000-0000-4000-8000-000000000099",
    });
  });

  it("rejects a broken predecessor chain", async () => {
    const events = chain(["dispatched", "accepted"]);
    events[1].predecessor_event_id = "71000000-0000-4000-8001-000000000099";
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_chain_invalid"]),
    });
  });

  it("rejects duplicate event identities", async () => {
    const events = chain(["dispatched", "accepted"]);
    events[1].event_id = events[0].event_id;
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_identity_invalid"]),
    });
  });

  it("rejects a state transition after completion", async () => {
    const events = chain(["dispatched", "accepted", "completed", "failed_retryable"]);
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_transition_invalid"]),
    });
  });

  it("rejects the wrong actor for acceptance", async () => {
    const events = chain(["dispatched", "accepted"]);
    events[1].actor_cell = "crypto_writer";
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_actor_invalid"]),
    });
  });

  it("rejects failure prose in place of a bounded code and evidence digest", async () => {
    const events = chain(["dispatched", "failed_terminal"]);
    events[1].failure_code = "Provider said the whole customer record was missing";
    events[1].failure_evidence_sha256 = null;
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_detail_invalid"]),
    });
  });

  it("rejects event time regression", async () => {
    const events = chain(["dispatched", "accepted"]);
    events[1].occurred_at = "2026-09-17T20:00:00Z";
    events[0].occurred_at = "2026-09-17T20:00:01Z";
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_time_regressed"]),
    });
  });

  it("rejects dispatch or attempt substitution", async () => {
    const events = chain(["dispatched"]);
    events[0].dispatch_id = "71000000-0000-4000-8000-000000000099";
    events[0].attempt = 2;
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["dispatch_event_scope_mismatch"]),
    });
  });

  it("rejects unexpected event fields", async () => {
    const events = chain(["dispatched"]) as Array<ProviderDeletionDispatchEvent & { raw_provider_handle?: string }>;
    events[0].raw_provider_handle = "generation_secret";
    await expect(compileProviderDeletionDispatchLifecycle({ envelope, events })).resolves.toEqual({
      status: "held", reasons: ["dispatch_event_shape_invalid"],
    });
  });
});
