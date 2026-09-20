export type ProviderClosureObligation =
  | "payload_disposition"
  | "operational_deletion"
  | "residual_retention_boundary"
  | "external_copy_boundary";

export type ProviderClosureScope =
  | "exchange_payload"
  | "provider_object"
  | "regulated_record"
  | "external_copy";

export type ProviderClosureFactKind =
  | "no_retention_verified"
  | "policy_expiry_pending"
  | "policy_expired"
  | "operational_deletion_succeeded"
  | "operational_deletion_failed"
  | "residual_retention_confirmed"
  | "external_copy_confirmed"
  | "verification_failed"
  | "verification_recovered";

export interface ProviderClosureFact {
  fact_id: string;
  fact_kind: ProviderClosureFactKind;
  scope: ProviderClosureScope;
  evidence_sha256: string;
  occurred_at: string;
}

export interface ProviderClosureInput {
  obligations: ProviderClosureObligation[];
  facts: ProviderClosureFact[];
}

export type ProviderClosureResult =
  | { status: "invalid"; reasons: string[] }
  | {
      status:
        | "held"
        | "complete"
        | "bounded_complete_with_residual"
        | "ctrl_complete_external_copy_remains"
        | "bounded_complete_with_residual_and_external_copy";
      execution_authority: "none";
      reasons: string[];
      satisfied_obligations: ProviderClosureObligation[];
      pending_obligations: ProviderClosureObligation[];
    };

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const OBLIGATION_ORDER: ProviderClosureObligation[] = [
  "payload_disposition",
  "operational_deletion",
  "residual_retention_boundary",
  "external_copy_boundary",
];
const EXPECTED_SCOPE: Record<ProviderClosureFactKind, ProviderClosureScope[]> = {
  no_retention_verified: ["exchange_payload"],
  policy_expiry_pending: ["exchange_payload"],
  policy_expired: ["exchange_payload"],
  operational_deletion_succeeded: ["provider_object"],
  operational_deletion_failed: ["provider_object"],
  residual_retention_confirmed: ["regulated_record"],
  external_copy_confirmed: ["external_copy"],
  verification_failed: ["exchange_payload", "provider_object", "regulated_record", "external_copy"],
  verification_recovered: ["exchange_payload", "provider_object", "regulated_record", "external_copy"],
};

function laterFact(
  facts: ProviderClosureFact[],
  factKind: ProviderClosureFactKind,
  after: ProviderClosureFact,
): ProviderClosureFact | undefined {
  return facts.find((fact) => fact.scope === after.scope && fact.fact_kind === factKind && fact.occurred_at > after.occurred_at);
}

export function evaluateProviderClosureFacts(input: ProviderClosureInput): ProviderClosureResult {
  const reasons: string[] = [];
  const obligationSet = new Set(input.obligations);
  if (obligationSet.size !== input.obligations.length) reasons.push("duplicate_obligation");
  const factIds = new Set<string>();
  for (const fact of input.facts) {
    if (!TOKEN.test(fact.fact_id)) reasons.push(`invalid_fact_id:${fact.fact_id}`);
    if (factIds.has(fact.fact_id)) reasons.push(`duplicate_fact_id:${fact.fact_id}`);
    factIds.add(fact.fact_id);
    if (!SHA256.test(fact.evidence_sha256)) reasons.push(`invalid_evidence_sha256:${fact.fact_id}`);
    if (!ISO_INSTANT.test(fact.occurred_at) || Number.isNaN(Date.parse(fact.occurred_at))) reasons.push(`invalid_occurred_at:${fact.fact_id}`);
    if (!EXPECTED_SCOPE[fact.fact_kind].includes(fact.scope)) reasons.push(`fact_scope_mismatch:${fact.fact_id}`);
  }

  const sortedFacts = [...input.facts].sort((left, right) => left.occurred_at.localeCompare(right.occurred_at) || left.fact_id.localeCompare(right.fact_id));
  const payloadFinals = sortedFacts.filter((fact) => fact.scope === "exchange_payload" &&
    ["no_retention_verified", "policy_expired"].includes(fact.fact_kind));
  if (new Set(payloadFinals.map((fact) => fact.fact_kind)).size > 1) reasons.push("conflicting_payload_disposition");
  for (const fact of sortedFacts.filter((entry) => entry.fact_kind === "verification_recovered")) {
    const priorFailure = sortedFacts.find((entry) => entry.scope === fact.scope && entry.fact_kind === "verification_failed" && entry.occurred_at < fact.occurred_at);
    if (!priorFailure) reasons.push(`recovery_without_prior_failure:${fact.fact_id}`);
  }
  if (reasons.length > 0) return { status: "invalid", reasons: [...new Set(reasons)].sort() };

  const holdReasons: string[] = [];
  for (const fact of sortedFacts.filter((entry) => entry.fact_kind === "verification_failed")) {
    if (!laterFact(sortedFacts, "verification_recovered", fact)) holdReasons.push(`unrecovered_verification_failure:${fact.scope}`);
  }
  for (const fact of sortedFacts.filter((entry) => entry.fact_kind === "operational_deletion_failed")) {
    if (!laterFact(sortedFacts, "operational_deletion_succeeded", fact)) holdReasons.push("operational_deletion_failed");
  }

  const satisfied = new Set<ProviderClosureObligation>();
  if (payloadFinals.length === 1) satisfied.add("payload_disposition");
  if (sortedFacts.some((fact) => fact.fact_kind === "operational_deletion_succeeded")) satisfied.add("operational_deletion");
  if (sortedFacts.some((fact) => fact.fact_kind === "residual_retention_confirmed")) satisfied.add("residual_retention_boundary");
  if (sortedFacts.some((fact) => fact.fact_kind === "external_copy_confirmed")) satisfied.add("external_copy_boundary");
  if (sortedFacts.some((fact) => fact.fact_kind === "policy_expiry_pending") && !satisfied.has("payload_disposition")) {
    holdReasons.push("provider_policy_expiry_pending");
  }

  const pending = input.obligations.filter((obligation) => !satisfied.has(obligation));
  holdReasons.push(...pending.map((obligation) => `obligation_pending:${obligation}`));
  const satisfiedOrdered = OBLIGATION_ORDER.filter((obligation) => obligationSet.has(obligation) && satisfied.has(obligation));
  const pendingOrdered = OBLIGATION_ORDER.filter((obligation) => obligationSet.has(obligation) && !satisfied.has(obligation));
  if (holdReasons.length > 0) {
    return {
      status: "held",
      execution_authority: "none",
      reasons: [...new Set(holdReasons)].sort(),
      satisfied_obligations: satisfiedOrdered,
      pending_obligations: pendingOrdered,
    };
  }

  const hasResidual = obligationSet.has("residual_retention_boundary");
  const hasExternalCopy = obligationSet.has("external_copy_boundary");
  const status = hasResidual && hasExternalCopy
    ? "bounded_complete_with_residual_and_external_copy"
    : hasResidual
      ? "bounded_complete_with_residual"
      : hasExternalCopy
        ? "ctrl_complete_external_copy_remains"
        : "complete";
  return {
    status,
    execution_authority: "none",
    reasons: [],
    satisfied_obligations: satisfiedOrdered,
    pending_obligations: [],
  };
}
