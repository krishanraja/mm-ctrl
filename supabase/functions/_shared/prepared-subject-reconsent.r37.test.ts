import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  handleSubjectReconsent,
  RECONSENT_STATEMENT,
  reconsentStatementResponse,
  type ReconsentEndpointDependencies,
} from "./prepared-subject-reconsent.r37";

const ids = {
  user: "13600000-0000-4000-8000-000000000001",
  previousWorkspace: "24600000-0000-4000-8000-000000000001",
  previousCustody: "35600000-0000-4000-8000-000000000001",
  subject: "46600000-0000-4000-8000-000000000001",
  operator: "57600000-0000-4000-8000-000000000001",
  consent: "68600000-0000-4000-8000-000000000001",
  workspace: "79600000-0000-4000-8000-000000000001",
  custody: "8a600000-0000-4000-8000-000000000001",
};

function body(extra: Record<string, unknown> = {}) {
  return {
    schema_version: "ctrl.prepared-intelligence-subject-reconsent-request.r37",
    previous_workspace_id: ids.previousWorkspace,
    decision: RECONSENT_STATEMENT.decision,
    statement_version: RECONSENT_STATEMENT.version,
    statement_sha256: RECONSENT_STATEMENT.sha256,
    ...extra,
  };
}

function dependencies(overrides: Partial<ReconsentEndpointDependencies> = {}) {
  const generated = [ids.consent, ids.workspace, ids.custody];
  const defaults: ReconsentEndpointDependencies = {
    authenticate: vi.fn(async () => ({ user_id: ids.user })),
    resolveErasedScope: vi.fn(async () => ({
      previous_custody_principal_id: ids.previousCustody,
      subject_id: ids.subject,
      operator_principal_id: ids.operator,
    })),
    reserve: vi.fn(async (command) => ({
      status: "reserved" as const,
      consent_id: command.consent_id,
      reserved_workspace_id: command.reserved_workspace_id,
      reserved_custody_principal_id: command.reserved_custody_principal_id,
      scope_status: "reserved_not_created" as const,
    })),
    uuid: vi.fn(() => generated.shift() ?? ids.custody),
    now: vi.fn(() => new Date("2026-09-17T12:00:00.000Z")),
    sha256: vi.fn(async (value) => createHash("sha256").update(value).digest("hex")),
  };
  return { ...defaults, ...overrides };
}

describe("prepared subject reconsent R37", () => {
  it("publishes one versioned plain-language statement", () => {
    expect(createHash("sha256").update(RECONSENT_STATEMENT.text).digest("hex"))
      .toBe(RECONSENT_STATEMENT.sha256);
    expect(reconsentStatementResponse()).toEqual({
      status: 200,
      body: {
        code: "reconsent_statement",
        decision: "start_new_brain",
        statement_version: "brain-restart-consent.v1",
        statement: RECONSENT_STATEMENT.text,
        statement_sha256: RECONSENT_STATEMENT.sha256,
      },
    });
  });

  it("derives every privileged identity outside the browser request", async () => {
    const deps = dependencies();
    const result = await handleSubjectReconsent({
      method: "POST",
      authorization: "Bearer signed-user-token",
      body: body(),
    }, deps);

    expect(result).toEqual({
      status: 200,
      body: {
        code: "reconsent_reserved",
        status: "reserved",
        consent_id: ids.consent,
        scope_status: "reserved_not_created",
      },
    });
    expect(deps.resolveErasedScope).toHaveBeenCalledWith({
      previous_workspace_id: ids.previousWorkspace,
      authenticated_user_id: ids.user,
      occurred_at: "2026-09-17T12:00:00.000Z",
    });
    expect(deps.reserve).toHaveBeenCalledWith(expect.objectContaining({
      previous_workspace_id: ids.previousWorkspace,
      previous_custody_principal_id: ids.previousCustody,
      subject_id: ids.subject,
      consented_by_user_id: ids.user,
      operator_principal_id: ids.operator,
      consent_id: ids.consent,
      reserved_workspace_id: ids.workspace,
      reserved_custody_principal_id: ids.custody,
      statement_version: "brain-restart-consent.v1",
      purpose: "prepared_intelligence",
    }));
  });

  it("rejects browser attempts to submit privileged identity", async () => {
    const deps = dependencies();
    const result = await handleSubjectReconsent({
      method: "POST",
      authorization: "Bearer signed-user-token",
      body: body({ subject_id: ids.subject }),
    }, deps);
    expect(result).toEqual({ status: 422, body: { code: "reconsent_request_invalid" } });
    expect(deps.resolveErasedScope).not.toHaveBeenCalled();
    expect(deps.reserve).not.toHaveBeenCalled();
  });

  it.each([
    [null, body(), "authentication_required", 401],
    ["Bearer signed-user-token", body({ decision: "restore_old_brain" }), "reconsent_request_invalid", 422],
    ["Bearer signed-user-token", body({ statement_version: "brain-restart-consent.v0" }), "reconsent_request_invalid", 422],
    ["Bearer signed-user-token", body({ statement_sha256: "0".repeat(64) }), "reconsent_request_invalid", 422],
  ])("fails closed before reservation", async (authorization, requestBody, code, status) => {
    const deps = dependencies();
    const result = await handleSubjectReconsent({ method: "POST", authorization, body: requestBody }, deps);
    expect(result).toEqual({ status, body: { code } });
    expect(deps.reserve).not.toHaveBeenCalled();
  });

  it("does not reveal whether an unavailable erased scope exists", async () => {
    const deps = dependencies({ resolveErasedScope: vi.fn(async () => null) });
    const result = await handleSubjectReconsent({
      method: "POST",
      authorization: "Bearer signed-user-token",
      body: body(),
    }, deps);
    expect(result).toEqual({ status: 403, body: { code: "reconsent_scope_unavailable" } });
    expect(deps.reserve).not.toHaveBeenCalled();
  });

  it("returns a bounded failure without leaking database detail", async () => {
    const deps = dependencies({ reserve: vi.fn(async () => { throw new Error("sensitive database detail"); }) });
    const result = await handleSubjectReconsent({
      method: "POST",
      authorization: "Bearer signed-user-token",
      body: body(),
    }, deps);
    expect(result).toEqual({ status: 409, body: { code: "reconsent_not_reserved" } });
  });

  it("refuses any reservation result that claims the scope already exists", async () => {
    const deps = dependencies({
      reserve: vi.fn(async () => ({
        status: "reserved",
        consent_id: ids.consent,
        reserved_workspace_id: ids.workspace,
        reserved_custody_principal_id: ids.custody,
        scope_status: "created" as never,
      })),
    });
    const result = await handleSubjectReconsent({
      method: "POST",
      authorization: "Bearer signed-user-token",
      body: body(),
    }, deps);
    expect(result).toEqual({ status: 502, body: { code: "reservation_contract_invalid" } });
  });
});
