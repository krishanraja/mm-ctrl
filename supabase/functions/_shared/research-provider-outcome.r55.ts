import type { PreparedResearchOperation } from "./prepared-research-operation.r54";
import type { PublicResearchQueryDependencies } from "./public-research-query.r50";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const PROVIDER_REQUEST_ID = /^[a-zA-Z0-9._:/-]{1,256}$/;

export type InitialProviderOutcome = "accepted" | "rejected" | "outcome_unknown";

export interface ResearchProviderOutcomeInput {
  schema_version: "ctrl.research-provider-outcome.r55";
  event_id: string;
  idempotency_key_sha256: string;
  outcome: InitialProviderOutcome;
  provider_request_id: string | null;
  provider_response_sha256: string;
  response_control_sha256: string | null;
  occurred_at: string;
}

export interface ProviderExchangeLifecycleEventCommand {
  schema_version: "ctrl.provider-exchange-lifecycle-event.r51";
  event_id: string;
  receipt_id: string;
  event_kind: InitialProviderOutcome;
  idempotency_key_sha256: string;
  provider_request_identity_hmac: string | null;
  evidence_sha256: string;
  occurred_at: string;
}

export interface ResearchProviderOutcomeDependencies extends PublicResearchQueryDependencies {
  now: () => Date;
  hmacProviderRequestIdentity: (provider: string, rawProviderRequestId: string) => Promise<string>;
}

const EXACT_OUTCOME_KEYS = [
  "event_id",
  "idempotency_key_sha256",
  "occurred_at",
  "outcome",
  "provider_request_id",
  "provider_response_sha256",
  "response_control_sha256",
  "schema_version",
];

function fail(code: string): never {
  throw new Error(code);
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function validatePreparedOperation(value: unknown): asserts value is PreparedResearchOperation {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("research_outcome_prepared_operation_invalid");
  }
  const prepared = value as PreparedResearchOperation;
  if (prepared.schema_version !== "ctrl.prepared-research-operation.r54"
    || prepared.standing !== "receipt_required_before_dispatch"
    || prepared.provider_command?.execute_authorized !== false
    || prepared.receipt_command?.schema_version !== "ctrl.provider-exchange-receipt.r51"
    || prepared.receipt_command?.provider !== prepared.provider_command?.provider
    || prepared.receipt_command?.request_sha256 !== prepared.provider_command?.request_sha256
    || !UUID.test(prepared.receipt_command?.receipt_id ?? "")
    || !SHA256.test(prepared.receipt_command?.request_sha256 ?? "")) {
    fail("research_outcome_prepared_operation_invalid");
  }
}

export async function classifyResearchProviderOutcome(
  preparedOperation: unknown,
  input: unknown,
  dependencies: ResearchProviderOutcomeDependencies,
): Promise<ProviderExchangeLifecycleEventCommand> {
  validatePreparedOperation(preparedOperation);
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("research_outcome_object_required");
  }
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  if (keys.length !== EXACT_OUTCOME_KEYS.length
    || keys.some((key, index) => key !== EXACT_OUTCOME_KEYS[index])) {
    fail("research_outcome_shape_invalid");
  }
  if (value.schema_version !== "ctrl.research-provider-outcome.r55") {
    fail("research_outcome_schema_invalid");
  }
  if (typeof value.event_id !== "string" || !UUID.test(value.event_id)) {
    fail("research_outcome_event_identity_invalid");
  }
  if (typeof value.idempotency_key_sha256 !== "string" || !SHA256.test(value.idempotency_key_sha256)) {
    fail("research_outcome_idempotency_invalid");
  }
  if (value.outcome !== "accepted" && value.outcome !== "rejected" && value.outcome !== "outcome_unknown") {
    fail("research_outcome_kind_invalid");
  }
  if (typeof value.provider_response_sha256 !== "string" || !SHA256.test(value.provider_response_sha256)) {
    fail("research_outcome_response_evidence_invalid");
  }
  if (value.response_control_sha256 !== null
    && (typeof value.response_control_sha256 !== "string" || !SHA256.test(value.response_control_sha256))) {
    fail("research_outcome_control_evidence_invalid");
  }
  if (preparedOperation.receipt_command.control_mode === "request_verified_zdr"
    && value.response_control_sha256 === null) {
    fail("research_outcome_request_control_evidence_required");
  }
  if (value.provider_request_id !== null
    && (typeof value.provider_request_id !== "string" || !PROVIDER_REQUEST_ID.test(value.provider_request_id))) {
    fail("research_outcome_provider_request_identity_invalid");
  }
  if (typeof value.occurred_at !== "string") fail("research_outcome_time_invalid");
  const occurredAt = Date.parse(value.occurred_at);
  const receiptAt = Date.parse(preparedOperation.receipt_command.occurred_at);
  const now = dependencies.now().getTime();
  if (!Number.isFinite(occurredAt) || !Number.isFinite(receiptAt) || !Number.isFinite(now)
    || occurredAt < receiptAt || occurredAt > now) {
    fail("research_outcome_time_invalid");
  }

  const providerRequestIdentityHmac = value.provider_request_id === null
    ? null
    : await dependencies.hmacProviderRequestIdentity(
      preparedOperation.provider_command.provider,
      value.provider_request_id,
    );
  if (providerRequestIdentityHmac !== null && !SHA256.test(providerRequestIdentityHmac)) {
    fail("research_outcome_provider_request_hmac_invalid");
  }

  const evidenceSha256 = await dependencies.sha256(canonical({
    schema_version: "ctrl.research-provider-outcome-evidence.r55",
    receipt_id: preparedOperation.receipt_command.receipt_id,
    provider: preparedOperation.provider_command.provider,
    request_sha256: preparedOperation.provider_command.request_sha256,
    outcome: value.outcome,
    provider_request_identity_hmac: providerRequestIdentityHmac,
    provider_response_sha256: value.provider_response_sha256,
    response_control_sha256: value.response_control_sha256,
  }));
  if (!SHA256.test(evidenceSha256)) fail("research_outcome_evidence_hash_invalid");

  return {
    schema_version: "ctrl.provider-exchange-lifecycle-event.r51",
    event_id: value.event_id,
    receipt_id: preparedOperation.receipt_command.receipt_id,
    event_kind: value.outcome,
    idempotency_key_sha256: value.idempotency_key_sha256,
    provider_request_identity_hmac: providerRequestIdentityHmac,
    evidence_sha256: evidenceSha256,
    occurred_at: new Date(occurredAt).toISOString(),
  };
}
