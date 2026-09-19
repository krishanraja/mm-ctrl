import { describe, expect, it } from "vitest";
import {
  ownerStandardChangeErrorStatus,
  ownerStandardChangeRpc,
  parseOwnerStandardChangeRequest,
} from "./standard-change-owner-core";

const id = "11111111-1111-4111-8111-111111111111";
const sha = "a".repeat(64);

describe("standard change owner request contract", () => {
  it("maps one exact prepare request", () => {
    const parsed = parseOwnerStandardChangeRequest({
      action: "prepare",
      check_id: id,
      expected_result_sha256: sha,
    });
    expect(ownerStandardChangeRpc(parsed)).toEqual({
      name: "prepare_standard_change_review",
      args: { p_check_id: id, p_expected_result_sha256: sha },
    });
  });

  it("maps approve and retains the optional owner note", () => {
    const parsed = parseOwnerStandardChangeRequest({
      action: "decide",
      review_packet_id: id,
      expected_packet_sha256: sha,
      expected_standard_sha256: "b".repeat(64),
      request_id: "approve_request_0001",
      decision: "approved",
      note: "This is the exact change I reviewed.",
    });
    expect(ownerStandardChangeRpc(parsed).args).toMatchObject({
      p_decision: "approved",
      p_note: "This is the exact change I reviewed.",
    });
  });

  it("maps an exact reversal without weakening the head hashes", () => {
    const parsed = parseOwnerStandardChangeRequest({
      action: "reverse",
      application_id: id,
      expected_application_hash: sha,
      expected_active_standard_sha256: "b".repeat(64),
      request_id: "reverse_request_0001",
      reason: "The owner wants the prior standard restored.",
    });
    expect(ownerStandardChangeRpc(parsed).name).toBe("reverse_standard_change_application");
  });

  it("rejects extra fields and malformed hashes", () => {
    expect(() => parseOwnerStandardChangeRequest({
      action: "prepare",
      check_id: id,
      expected_result_sha256: "short",
      apply: true,
    })).toThrow("invalid_prepare_request");
  });

  it("keeps product conflicts distinct from internal failures", () => {
    expect(ownerStandardChangeErrorStatus("standard_change_review_source_stale")).toBe(409);
    expect(ownerStandardChangeErrorStatus("standard_change_review_not_owned")).toBe(404);
    expect(ownerStandardChangeErrorStatus("unexpected_failure")).toBe(500);
  });
});
