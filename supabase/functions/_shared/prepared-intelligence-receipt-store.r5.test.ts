import { describe, expect, it } from "vitest";
import {
  appendReceipt,
  createEmptyReceiptStore,
  eraseSubject,
  invalidateByCorrection,
  recordDelivery,
  registerProjection,
  resolveProjection,
  resolveReceipt,
  type ReceiptEnvelope,
  type ReceiptScope,
} from "./prepared-intelligence-receipt-store.r5";

const scope: ReceiptScope = {
  owner_id: "owner-1",
  subject_id: "leader-1",
  audience: "customer_private",
  purpose: "prepared_intelligence",
};

const envelope = (overrides: Partial<ReceiptEnvelope> = {}): ReceiptEnvelope => ({
  ...scope,
  receipt_id: "receipt-news-1",
  kind: "qualified_news",
  produced_at: "2026-09-17T09:00:00+01:00",
  expires_at: "2026-09-24T09:00:00+01:00",
  correction_dependency_ids: ["brain:decision-14", "brain:objective-2"],
  payload: { headline: "A relevant category shift", sources: ["Reuters", "FT"] },
  ...overrides,
});

describe("prepared intelligence receipt store R5", () => {
  it("appends and reads an owner-scoped receipt without payload in the ledger event", async () => {
    const result = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(result.status).toBe("committed");
    if (result.status !== "committed") return;
    expect(result.state.events[0]).not.toHaveProperty("payload");
    expect(resolveReceipt(result.state, "receipt-news-1", scope, "2026-09-18T09:00:00+01:00")).toMatchObject({
      status: "available",
      payload: { headline: "A relevant category shift", sources: ["Reuters", "FT"] },
    });
  });

  it("treats exact replay as byte-stable idempotency", async () => {
    const first = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(first.status).toBe("committed");
    if (first.status !== "committed") return;
    const second = await appendReceipt(first.state, envelope());
    expect(second).toEqual({ status: "idempotent", state: first.state });
  });

  it("holds a conflicting replay without changing state", async () => {
    const first = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(first.status).toBe("committed");
    if (first.status !== "committed") return;
    const second = await appendReceipt(first.state, envelope({ payload: { headline: "Different fact" } }));
    expect(second).toEqual({ status: "held", reasons: ["receipt_identity_conflict"], state: first.state });
  });

  it("canonicalises object-key order into one content identity", async () => {
    const first = await appendReceipt(createEmptyReceiptStore(), envelope({ payload: { a: 1, b: 2 } }));
    expect(first.status).toBe("committed");
    if (first.status !== "committed") return;
    const second = await appendReceipt(first.state, envelope({ payload: { b: 2, a: 1 } }));
    expect(second.status).toBe("idempotent");
  });

  it("fails a cross-subject read closed", async () => {
    const result = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(result.status).toBe("committed");
    if (result.status !== "committed") return;
    expect(resolveReceipt(result.state, "receipt-news-1", { ...scope, subject_id: "leader-2" }, "2026-09-18T09:00:00+01:00")).toEqual({
      status: "held",
      reason: "receipt_scope_mismatch",
    });
  });

  it("expires a receipt without rewriting its ledger history", async () => {
    const result = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(result.status).toBe("committed");
    if (result.status !== "committed") return;
    expect(resolveReceipt(result.state, "receipt-news-1", scope, "2026-09-24T09:00:00+01:00")).toEqual({
      status: "held",
      reason: "receipt_expired",
    });
    expect(result.state.events).toHaveLength(1);
  });

  it("invalidates dependent receipts and their registered projection after correction", async () => {
    const stored = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(stored.status).toBe("committed");
    if (stored.status !== "committed") return;
    const projected = await registerProjection(stored.state, {
      ...scope,
      projection_id: "prepared-1",
      receipt_ids: ["receipt-news-1"],
      registered_at: "2026-09-18T09:00:00+01:00",
    });
    expect(projected.status).toBe("committed");
    if (projected.status !== "committed") return;
    const corrected = await invalidateByCorrection(projected.state, {
      ...scope,
      correction_id: "correction-1",
      dependency_ids: ["brain:decision-14"],
      invalidated_at: "2026-09-19T09:00:00+01:00",
    });
    expect(corrected.status).toBe("committed");
    if (corrected.status !== "committed") return;
    expect(resolveReceipt(corrected.state, "receipt-news-1", scope, "2026-09-20T09:00:00+01:00")).toEqual({
      status: "held",
      reason: "receipt_invalidated",
    });
    expect(resolveProjection(corrected.state, "prepared-1", scope, "2026-09-20T09:00:00+01:00")).toEqual({
      status: "held",
      reason: "projection_stale",
      stale_receipt_ids: ["receipt-news-1"],
    });
    const replayedProjection = await registerProjection(corrected.state, {
      ...scope,
      projection_id: "prepared-1",
      receipt_ids: ["receipt-news-1"],
      registered_at: "2026-09-18T09:00:00+01:00",
    });
    expect(replayedProjection).toEqual({ status: "idempotent", state: corrected.state });
  });

  it("holds a correction timestamp that predates its receipt", async () => {
    const stored = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(stored.status).toBe("committed");
    if (stored.status !== "committed") return;
    const corrected = await invalidateByCorrection(stored.state, {
      ...scope,
      correction_id: "correction-early",
      dependency_ids: ["brain:decision-14"],
      invalidated_at: "2026-09-16T09:00:00+01:00",
    });
    expect(corrected).toEqual({ status: "held", reasons: ["correction_time_precedes_receipt"], state: stored.state });
  });

  it("does not invalidate an unrelated receipt", async () => {
    const first = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(first.status).toBe("committed");
    if (first.status !== "committed") return;
    const second = await appendReceipt(first.state, envelope({
      receipt_id: "receipt-news-2",
      correction_dependency_ids: ["brain:objective-99"],
    }));
    expect(second.status).toBe("committed");
    if (second.status !== "committed") return;
    const corrected = await invalidateByCorrection(second.state, {
      ...scope,
      correction_id: "correction-1",
      dependency_ids: ["brain:decision-14"],
      invalidated_at: "2026-09-19T09:00:00+01:00",
    });
    expect(corrected.status).toBe("committed");
    if (corrected.status !== "committed") return;
    expect(resolveReceipt(corrected.state, "receipt-news-2", scope, "2026-09-20T09:00:00+01:00").status).toBe("available");
  });

  it("erases subject content while retaining a payload-free audit tombstone", async () => {
    const stored = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(stored.status).toBe("committed");
    if (stored.status !== "committed") return;
    const erased = await eraseSubject(stored.state, {
      erasure_id: "erasure-1",
      owner_id: "owner-1",
      subject_id: "leader-1",
      erased_at: "2026-09-19T09:00:00+01:00",
    });
    expect(erased.status).toBe("committed");
    if (erased.status !== "committed") return;
    expect(erased.state.content_blobs).toEqual([]);
    expect(erased.state.events.at(-1)).toMatchObject({ type: "subject_erased", receipt_ids: ["receipt-news-1"] });
    expect(erased.state.events.at(-1)).not.toHaveProperty("canonical_payload");
    expect(resolveReceipt(erased.state, "receipt-news-1", scope, "2026-09-20T09:00:00+01:00")).toEqual({
      status: "held",
      reason: "receipt_erased",
    });
    const attemptedRevival = await appendReceipt(erased.state, envelope({ receipt_id: "receipt-news-after-erasure" }));
    expect(attemptedRevival).toEqual({
      status: "held",
      reasons: ["subject_erasure_tombstone_active"],
      state: erased.state,
    });
  });

  it("a past delivery receipt does not keep corrected truth alive", async () => {
    const stored = await appendReceipt(createEmptyReceiptStore(), envelope());
    expect(stored.status).toBe("committed");
    if (stored.status !== "committed") return;
    const delivered = await recordDelivery(stored.state, {
      ...scope,
      delivery_id: "delivery-1",
      receipt_id: "receipt-news-1",
      channel: "audio",
      attempted_at: "2026-09-18T09:00:00+01:00",
      outcome: "delivered",
    });
    expect(delivered.status).toBe("committed");
    if (delivered.status !== "committed") return;
    const corrected = await invalidateByCorrection(delivered.state, {
      ...scope,
      correction_id: "correction-1",
      dependency_ids: ["brain:decision-14"],
      invalidated_at: "2026-09-19T09:00:00+01:00",
    });
    expect(corrected.status).toBe("committed");
    if (corrected.status !== "committed") return;
    expect(resolveReceipt(corrected.state, "receipt-news-1", scope, "2026-09-20T10:00:00+01:00")).toEqual({
      status: "held",
      reason: "receipt_invalidated",
    });
    const unsafeRedelivery = await recordDelivery(corrected.state, {
      ...scope,
      delivery_id: "delivery-2",
      receipt_id: "receipt-news-1",
      channel: "audio",
      attempted_at: "2026-09-20T09:00:00+01:00",
      outcome: "delivered",
    });
    expect(unsafeRedelivery).toEqual({
      status: "held",
      reasons: ["delivery_receipt_unavailable"],
      state: corrected.state,
    });
  });

  it("rejects non-JSON payloads before a receipt event exists", async () => {
    const result = await appendReceipt(createEmptyReceiptStore(), envelope({ payload: { score: Number.NaN } }));
    expect(result).toEqual({
      status: "held",
      reasons: ["receipt_payload_not_canonical_json"],
      state: createEmptyReceiptStore(),
    });
  });

  it("holds malformed projection input instead of throwing across the runtime boundary", async () => {
    const malformed = {
      ...scope,
      projection_id: "prepared-1",
      receipt_ids: [42],
      registered_at: "2026-09-18T09:00:00+01:00",
    } as unknown as Parameters<typeof registerProjection>[1];
    await expect(registerProjection(createEmptyReceiptStore(), malformed)).resolves.toEqual({
      status: "held",
      reasons: ["projection_receipts_invalid"],
      state: createEmptyReceiptStore(),
    });
  });
});
