import {
  admitPublicResearchQuery,
  type PublicSourceAdmissionDependencies,
  type PublicSourceAdmissionInput,
} from "./public-source-admission.r52";
import type { ResearchProvider } from "./public-research-query.r50";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const CALLSITE = /^[a-zA-Z0-9_./:-]{3,240}$/;

export type PublicResearchControlMode =
  | "public_policy_default"
  | "provider_policy_retention"
  | "contractual_zdr"
  | "request_verified_zdr"
  | "fixed_public_fetch";

export interface PrepareResearchOperationInput {
  schema_version: "ctrl.prepare-research-operation.r54";
  receipt_id: string;
  workspace_id: string;
  idempotency_key_sha256: string;
  callsite: string;
  occurred_at: string;
  control_mode: PublicResearchControlMode;
  control_evidence_sha256: string;
  admission: PublicSourceAdmissionInput;
}

export interface ResearchProviderCommand {
  schema_version: "ctrl.research-provider-command.r54";
  provider: ResearchProvider;
  query_kind: "fixed_public_fetch" | "public_company_name" | "public_domain" | "public_topic_terms";
  outbound_query: string | null;
  request_sha256: string;
  execute_authorized: false;
}

export interface ProviderExchangeReceiptCommand {
  schema_version: "ctrl.provider-exchange-receipt.r51";
  receipt_id: string;
  workspace_id: string;
  provider: ResearchProvider;
  processor_kind: "research";
  callsite: string;
  purpose_family: "research_and_enrichment";
  data_classes: Array<"company_identifier" | "public_web_content" | "search_query">;
  request_sha256: string;
  idempotency_key_sha256: string;
  query_minimization_sha256: string | null;
  control_mode: PublicResearchControlMode;
  control_evidence_sha256: string;
  occurred_at: string;
}

export interface PreparedResearchOperation {
  schema_version: "ctrl.prepared-research-operation.r54";
  standing: "receipt_required_before_dispatch";
  provider_command: ResearchProviderCommand;
  receipt_command: ProviderExchangeReceiptCommand;
  public_source_sha256: string;
}

const EXACT_KEYS = [
  "admission",
  "callsite",
  "control_evidence_sha256",
  "control_mode",
  "idempotency_key_sha256",
  "occurred_at",
  "receipt_id",
  "schema_version",
  "workspace_id",
];

function fail(code: string): never {
  throw new Error(code);
}

function exactInput(value: Record<string, unknown>): void {
  const actual = Object.keys(value).sort();
  if (actual.length !== EXACT_KEYS.length || actual.some((key, index) => key !== EXACT_KEYS[index])) {
    fail("research_operation_shape_invalid");
  }
}

export async function prepareResearchOperation(
  input: unknown,
  dependencies: PublicSourceAdmissionDependencies,
): Promise<PreparedResearchOperation> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("research_operation_object_required");
  }
  const value = input as Record<string, unknown>;
  exactInput(value);
  if (value.schema_version !== "ctrl.prepare-research-operation.r54") {
    fail("research_operation_schema_invalid");
  }
  if (typeof value.receipt_id !== "string" || !UUID.test(value.receipt_id)
    || typeof value.workspace_id !== "string" || !UUID.test(value.workspace_id)) {
    fail("research_operation_identity_invalid");
  }
  if (typeof value.idempotency_key_sha256 !== "string" || !SHA256.test(value.idempotency_key_sha256)) {
    fail("research_operation_idempotency_invalid");
  }
  if (typeof value.callsite !== "string" || !CALLSITE.test(value.callsite)) {
    fail("research_operation_callsite_invalid");
  }
  if (typeof value.control_evidence_sha256 !== "string" || !SHA256.test(value.control_evidence_sha256)) {
    fail("research_operation_control_evidence_invalid");
  }
  if (typeof value.occurred_at !== "string") fail("research_operation_time_invalid");
  const occurredAt = Date.parse(value.occurred_at);
  if (!Number.isFinite(occurredAt) || occurredAt > dependencies.now().getTime()) {
    fail("research_operation_time_invalid");
  }

  const admitted = await admitPublicResearchQuery(value.admission, dependencies);
  const query = admitted.prepared_query;
  const isFixed = query.query_kind === "fixed_public_fetch";
  const allowedWebModes: PublicResearchControlMode[] = [
    "public_policy_default",
    "provider_policy_retention",
    "contractual_zdr",
    "request_verified_zdr",
  ];
  if (isFixed ? value.control_mode !== "fixed_public_fetch"
    : !allowedWebModes.includes(value.control_mode as PublicResearchControlMode)) {
    fail("research_operation_control_mode_mismatch");
  }

  const controlMode = value.control_mode as PublicResearchControlMode;
  return {
    schema_version: "ctrl.prepared-research-operation.r54",
    standing: "receipt_required_before_dispatch",
    public_source_sha256: admitted.public_source_sha256,
    provider_command: {
      schema_version: "ctrl.research-provider-command.r54",
      provider: query.provider,
      query_kind: query.query_kind,
      outbound_query: query.outbound_query,
      request_sha256: query.request_sha256,
      execute_authorized: false,
    },
    receipt_command: {
      schema_version: "ctrl.provider-exchange-receipt.r51",
      receipt_id: value.receipt_id,
      workspace_id: value.workspace_id,
      provider: query.provider,
      processor_kind: "research",
      callsite: value.callsite,
      purpose_family: "research_and_enrichment",
      data_classes: query.data_classes,
      request_sha256: query.request_sha256,
      idempotency_key_sha256: value.idempotency_key_sha256,
      query_minimization_sha256: isFixed ? null : query.query_minimization_sha256,
      control_mode: controlMode,
      control_evidence_sha256: value.control_evidence_sha256,
      occurred_at: new Date(occurredAt).toISOString(),
    },
  };
}
