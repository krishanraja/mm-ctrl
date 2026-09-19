import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { RECONSENT_STATEMENT, type ReconsentEndpointDependencies } from "./prepared-subject-reconsent.r37";
import {
  handleReconsentAndCreate,
  type ReconsentOrchestratorDependencies,
} from "./prepared-reconsent-orchestrator.r41";

const ids = {
  user: "14100000-0000-4000-8000-000000000001",
  oldWorkspace: "24100000-0000-4000-8000-000000000001",
  oldCustody: "34100000-0000-4000-8000-000000000001",
  subject: "44100000-0000-4000-8000-000000000001",
  operator: "54100000-0000-4000-8000-000000000001",
  consent: "64100000-0000-4000-8000-000000000001",
  reservedWorkspace: "74100000-0000-4000-8000-000000000001",
  reservedCustody: "84100000-0000-4000-8000-000000000001",
  creation: "94100000-0000-4000-8000-000000000001",
};

function request() {
  return {
    method: "POST",
    authorization: "Bearer signed-user-token",
    body: {
      schema_version: "ctrl.prepared-intelligence-subject-reconsent-request.r37",
      previous_workspace_id: ids.oldWorkspace,
      decision: RECONSENT_STATEMENT.decision,
      statement_version: RECONSENT_STATEMENT.version,
      statement_sha256: RECONSENT_STATEMENT.sha256,
    },
  };
}

function reconsentDependencies(): ReconsentEndpointDependencies {
  const generated = [ids.consent, ids.reservedWorkspace, ids.reservedCustody];
  return {
    authenticate: vi.fn(async () => ({ user_id: ids.user })),
    resolveErasedScope: vi.fn(async () => ({
      previous_custody_principal_id: ids.oldCustody,
      subject_id: ids.subject,
      operator_principal_id: ids.operator,
    })),
    reserve: vi.fn(async (command) => ({
      status: "reserved",
      consent_id: command.consent_id,
      reserved_workspace_id: command.reserved_workspace_id,
      reserved_custody_principal_id: command.reserved_custody_principal_id,
      scope_status: "reserved_not_created",
    })),
    uuid: vi.fn(() => generated.shift() ?? ids.reservedCustody),
    now: vi.fn(() => new Date("2026-09-17T12:00:00.000Z")),
    sha256: vi.fn(async (value) => createHash("sha256").update(value).digest("hex")),
  };
}

function dependencies(overrides: Partial<ReconsentOrchestratorDependencies> = {}) {
  const defaults: ReconsentOrchestratorDependencies = {
    reconsent: reconsentDependencies(),
    createScope: vi.fn(async (command) => ({
      status: "created",
      creation_id: command.creation_id,
      consent_id: command.consent_id,
      workspace_id: ids.reservedWorkspace,
      custody_principal_id: ids.reservedCustody,
      scope_status: "active_new_scope",
    })),
    creationUuid: vi.fn(() => ids.creation),
    now: vi.fn(() => new Date("2026-09-17T12:00:01.000Z")),
    sha256: vi.fn(async (value) => createHash("sha256").update(value).digest("hex")),
  };
  return { ...defaults, ...overrides };
}

describe("prepared reconsent orchestrator R41", () => {
  it("reserves first, then creates, and returns only bounded new-scope standing", async () => {
    const deps = dependencies();
    const result = await handleReconsentAndCreate(request(), deps);
    expect(result).toEqual({
      status: 200,
      body: {
        code: "brain_restarted",
        status: "created",
        consent_id: ids.consent,
        creation_id: ids.creation,
        workspace_id: ids.reservedWorkspace,
        scope_status: "active_new_scope",
      },
    });
    expect(deps.createScope).toHaveBeenCalledWith(expect.objectContaining({
      schema_version: "ctrl.prepared-intelligence-reconsent-scope-creation.r38",
      creation_id: ids.creation,
      consent_id: ids.consent,
      occurred_at: "2026-09-17T12:00:01.000Z",
    }));
  });

  it("does not create when authentication or request validation fails", async () => {
    const deps = dependencies();
    const result = await handleReconsentAndCreate({ ...request(), authorization: null }, deps);
    expect(result).toEqual({ status: 401, body: { code: "authentication_required" } });
    expect(deps.createScope).not.toHaveBeenCalled();
  });

  it("names the recoverable middle state after reservation succeeds", async () => {
    const deps = dependencies({
      createScope: vi.fn(async () => { throw new Error("response lost after unknown commit standing"); }),
    });
    const result = await handleReconsentAndCreate(request(), deps);
    expect(result).toEqual({
      status: 503,
      body: {
        code: "reconsent_reserved_pending_creation",
        consent_id: ids.consent,
        scope_status: "reserved_not_created",
        retryable: true,
      },
    });
  });

  it("returns the first scope when a later attempt converges after a lost response", async () => {
    const deps = dependencies({
      creationUuid: vi.fn(() => "a4100000-0000-4000-8000-000000000001"),
      createScope: vi.fn(async () => ({
        status: "idempotent",
        creation_id: ids.creation,
        consent_id: ids.consent,
        workspace_id: ids.reservedWorkspace,
        custody_principal_id: ids.reservedCustody,
        scope_status: "active_new_scope",
      })),
    });
    const result = await handleReconsentAndCreate(request(), deps);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      status: "idempotent",
      creation_id: ids.creation,
      workspace_id: ids.reservedWorkspace,
    });
  });

  it("rejects a mismatched creation response rather than announcing success", async () => {
    const deps = dependencies({
      createScope: vi.fn(async () => ({
        status: "created",
        creation_id: ids.creation,
        consent_id: "b4100000-0000-4000-8000-000000000001",
        workspace_id: ids.reservedWorkspace,
        custody_principal_id: ids.reservedCustody,
        scope_status: "active_new_scope",
      })),
    });
    const result = await handleReconsentAndCreate(request(), deps);
    expect(result).toEqual({ status: 502, body: { code: "scope_creation_contract_invalid" } });
  });
});
