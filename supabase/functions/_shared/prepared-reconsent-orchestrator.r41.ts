import {
  handleSubjectReconsent,
  type ReconsentEndpointDependencies,
  type ReconsentEndpointRequest,
  type ReconsentEndpointResponse,
} from "./prepared-subject-reconsent.r37";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;

interface ScopeCreationCommand {
  schema_version: "ctrl.prepared-intelligence-reconsent-scope-creation.r38";
  creation_id: string;
  consent_id: string;
  request_sha256: string;
  occurred_at: string;
}

interface ScopeCreationResult {
  status: "created" | "idempotent";
  creation_id: string;
  consent_id: string;
  workspace_id: string;
  custody_principal_id: string;
  scope_status: "active_new_scope";
}

export interface ReconsentOrchestratorDependencies {
  reconsent: ReconsentEndpointDependencies;
  createScope: (command: ScopeCreationCommand) => Promise<ScopeCreationResult>;
  creationUuid: () => string;
  now: () => Date;
  sha256: (value: string) => Promise<string>;
}

function response(status: number, code: string, extra: Record<string, unknown> = {}): ReconsentEndpointResponse {
  return { status, body: { code, ...extra } };
}

export async function handleReconsentAndCreate(
  request: ReconsentEndpointRequest,
  dependencies: ReconsentOrchestratorDependencies,
): Promise<ReconsentEndpointResponse> {
  const reservation = await handleSubjectReconsent(request, dependencies.reconsent);
  if (reservation.status !== 200) return reservation;

  const consentId = reservation.body.consent_id;
  if (typeof consentId !== "string" || !UUID.test(consentId)
    || reservation.body.scope_status !== "reserved_not_created") {
    return response(502, "reservation_contract_invalid");
  }

  const creationId = dependencies.creationUuid();
  if (!UUID.test(creationId)) return response(500, "server_identity_generation_failed");
  const requestSha256 = await dependencies.sha256([
    "prepared-reconsent-scope-create-r41",
    consentId,
  ].join("\n"));
  if (!SHA256.test(requestSha256)) return response(500, "server_fingerprint_failed");

  try {
    const created = await dependencies.createScope({
      schema_version: "ctrl.prepared-intelligence-reconsent-scope-creation.r38",
      creation_id: creationId,
      consent_id: consentId,
      request_sha256: requestSha256,
      occurred_at: dependencies.now().toISOString(),
    });
    if (created.consent_id !== consentId
      || created.scope_status !== "active_new_scope"
      || !UUID.test(created.creation_id)
      || !UUID.test(created.workspace_id)) {
      return response(502, "scope_creation_contract_invalid");
    }
    return response(200, "brain_restarted", {
      status: created.status,
      consent_id: consentId,
      creation_id: created.creation_id,
      workspace_id: created.workspace_id,
      scope_status: created.scope_status,
    });
  } catch {
    return response(503, "reconsent_reserved_pending_creation", {
      consent_id: consentId,
      scope_status: "reserved_not_created",
      retryable: true,
    });
  }
}
