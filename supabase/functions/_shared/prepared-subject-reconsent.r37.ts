export const RECONSENT_STATEMENT = {
  decision: "start_new_brain",
  version: "brain-restart-consent.v1",
  text: "Start a new Brain. My old Brain stays erased. Only information I add or approve from now on can enter the new one.",
  sha256: "fd5855180ba007f89e8e03457c46c7fa710367d88cb697f822651247e29bf2ed",
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const REQUEST_KEYS = [
  "decision",
  "previous_workspace_id",
  "schema_version",
  "statement_sha256",
  "statement_version",
] as const;

export interface ReconsentEndpointRequest {
  method: string;
  authorization: string | null;
  body: unknown;
}

export interface ReconsentScopeResolution {
  previous_custody_principal_id: string;
  subject_id: string;
  operator_principal_id: string;
}

export interface ReconsentReservationCommand {
  schema_version: "ctrl.prepared-intelligence-subject-reconsent-reservation.r36";
  consent_id: string;
  previous_workspace_id: string;
  previous_custody_principal_id: string;
  subject_id: string;
  consented_by_user_id: string;
  operator_principal_id: string;
  reserved_workspace_id: string;
  reserved_custody_principal_id: string;
  reserved_tenant_key: string;
  statement_version: "brain-restart-consent.v1";
  purpose: "prepared_intelligence";
  request_sha256: string;
  occurred_at: string;
}

export interface ReconsentReservationResult {
  status: "reserved" | "idempotent" | "converged";
  consent_id: string;
  reserved_workspace_id: string;
  reserved_custody_principal_id: string;
  scope_status: "reserved_not_created";
}

export interface ReconsentEndpointDependencies {
  authenticate: (authorization: string) => Promise<{ user_id: string } | null>;
  resolveErasedScope: (input: {
    previous_workspace_id: string;
    authenticated_user_id: string;
    occurred_at: string;
  }) => Promise<ReconsentScopeResolution | null>;
  reserve: (command: ReconsentReservationCommand) => Promise<ReconsentReservationResult>;
  uuid: () => string;
  now: () => Date;
  sha256: (value: string) => Promise<string>;
}

export interface ReconsentEndpointResponse {
  status: number;
  body: Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === REQUEST_KEYS.length
    && keys.every((key, index) => key === [...REQUEST_KEYS].sort()[index]);
}

function isValidRequest(body: unknown): body is Record<string, string> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return false;
  const value = body as Record<string, unknown>;
  return exactKeys(value)
    && value.schema_version === "ctrl.prepared-intelligence-subject-reconsent-request.r37"
    && typeof value.previous_workspace_id === "string"
    && UUID.test(value.previous_workspace_id)
    && value.decision === RECONSENT_STATEMENT.decision
    && value.statement_version === RECONSENT_STATEMENT.version
    && value.statement_sha256 === RECONSENT_STATEMENT.sha256;
}

function validResolution(value: ReconsentScopeResolution | null): value is ReconsentScopeResolution {
  return value !== null
    && UUID.test(value.previous_custody_principal_id)
    && UUID.test(value.subject_id)
    && UUID.test(value.operator_principal_id);
}

function response(status: number, code: string, extra: Record<string, unknown> = {}): ReconsentEndpointResponse {
  return { status, body: { code, ...extra } };
}

export function reconsentStatementResponse(): ReconsentEndpointResponse {
  return response(200, "reconsent_statement", {
    decision: RECONSENT_STATEMENT.decision,
    statement_version: RECONSENT_STATEMENT.version,
    statement: RECONSENT_STATEMENT.text,
    statement_sha256: RECONSENT_STATEMENT.sha256,
  });
}

export async function handleSubjectReconsent(
  request: ReconsentEndpointRequest,
  dependencies: ReconsentEndpointDependencies,
): Promise<ReconsentEndpointResponse> {
  if (request.method !== "POST") return response(405, "method_not_allowed");
  if (!request.authorization) return response(401, "authentication_required");

  const authenticated = await dependencies.authenticate(request.authorization);
  if (!authenticated || !UUID.test(authenticated.user_id)) {
    return response(401, "authentication_required");
  }
  if (!isValidRequest(request.body)) return response(422, "reconsent_request_invalid");

  const occurredAt = dependencies.now().toISOString();
  const scope = await dependencies.resolveErasedScope({
    previous_workspace_id: request.body.previous_workspace_id,
    authenticated_user_id: authenticated.user_id,
    occurred_at: occurredAt,
  });
  if (!validResolution(scope)) return response(403, "reconsent_scope_unavailable");

  const consentId = dependencies.uuid();
  const reservedWorkspaceId = dependencies.uuid();
  const reservedCustodyId = dependencies.uuid();
  if (![consentId, reservedWorkspaceId, reservedCustodyId].every((value) => UUID.test(value))) {
    return response(500, "server_identity_generation_failed");
  }

  const requestFingerprint = await dependencies.sha256([
    "prepared-subject-reconsent-request-r37",
    authenticated.user_id,
    request.body.previous_workspace_id,
    RECONSENT_STATEMENT.decision,
    RECONSENT_STATEMENT.version,
    RECONSENT_STATEMENT.sha256,
  ].join("\n"));
  if (!SHA256.test(requestFingerprint)) return response(500, "server_fingerprint_failed");

  try {
    const result = await dependencies.reserve({
      schema_version: "ctrl.prepared-intelligence-subject-reconsent-reservation.r36",
      consent_id: consentId,
      previous_workspace_id: request.body.previous_workspace_id,
      previous_custody_principal_id: scope.previous_custody_principal_id,
      subject_id: scope.subject_id,
      consented_by_user_id: authenticated.user_id,
      operator_principal_id: scope.operator_principal_id,
      reserved_workspace_id: reservedWorkspaceId,
      reserved_custody_principal_id: reservedCustodyId,
      reserved_tenant_key: `brain:${reservedWorkspaceId}`,
      statement_version: RECONSENT_STATEMENT.version,
      purpose: "prepared_intelligence",
      request_sha256: requestFingerprint,
      occurred_at: occurredAt,
    });
    if (result.scope_status !== "reserved_not_created") {
      return response(502, "reservation_contract_invalid");
    }
    return response(200, "reconsent_reserved", {
      status: result.status,
      consent_id: result.consent_id,
      scope_status: result.scope_status,
    });
  } catch {
    return response(409, "reconsent_not_reserved");
  }
}
