export type ProviderName =
  | "openai" | "anthropic" | "google_ai" | "xai" | "elevenlabs"
  | "perplexity" | "exa" | "brave" | "tavily" | "newsapi" | "builtwith"
  | "people_data_labs" | "artificial_analysis" | "tranco" | "gdelt"
  | "hacker_news_algolia" | "fixed_rss_publishers" | "resend" | "stripe"
  | "configured_downstream";

export type ProcessorKind = "model" | "audio" | "research" | "delivery" | "billing" | "configured_downstream";
export type ControlMode =
  | "unverified" | "public_policy_default" | "contractual_zdr"
  | "request_verified_zdr" | "provider_policy_retention"
  | "regulated_retention" | "fixed_public_fetch";
export type ProviderEventKind =
  | "accepted" | "rejected" | "outcome_unknown" | "delivered"
  | "expiry_pending" | "expired" | "operationally_deleted"
  | "residual_retention" | "verification_failed";

export interface ProviderErasureReviewInput {
  provider: ProviderName;
  processor_kind: ProcessorKind;
  control_mode: ControlMode;
  latest_event: ProviderEventKind;
  deletion_handle_available: boolean;
}

export type ProviderReviewAction =
  | "verify_zdr_attestation"
  | "await_provider_policy_expiry"
  | "request_operational_deletion"
  | "record_irretrievable_recipient_copy"
  | "record_public_query_boundary";

export type ProviderErasureReviewResult =
  | { status: "invalid"; reasons: string[] }
  | {
      status: "held" | "review_plan" | "observed_terminal";
      execution_authority: "none";
      reasons: string[];
      actions: Array<{
        action: ProviderReviewAction;
        required_evidence: string[];
        candidate_event: "expired" | "operationally_deleted" | null;
      }>;
    };

const MODEL_PROVIDERS = new Set<ProviderName>(["openai", "anthropic", "google_ai", "xai"]);
const RESEARCH_PROVIDERS = new Set<ProviderName>([
  "perplexity", "exa", "brave", "tavily", "newsapi", "builtwith",
  "people_data_labs", "artificial_analysis", "tranco", "gdelt",
  "hacker_news_algolia", "fixed_rss_publishers",
]);
const TERMINAL_EVENTS = new Set<ProviderEventKind>([
  "rejected", "expired", "operationally_deleted", "residual_retention",
]);

function routeIsCoherent(input: ProviderErasureReviewInput): boolean {
  if (input.processor_kind === "model") return MODEL_PROVIDERS.has(input.provider);
  if (input.processor_kind === "audio") return input.provider === "elevenlabs";
  if (input.processor_kind === "research") return RESEARCH_PROVIDERS.has(input.provider);
  if (input.processor_kind === "delivery") return input.provider === "resend";
  if (input.processor_kind === "billing") return input.provider === "stripe";
  return input.processor_kind === "configured_downstream" && input.provider === "configured_downstream";
}

const action = (
  value: ProviderReviewAction,
  required_evidence: string[],
  candidate_event: "expired" | "operationally_deleted" | null,
) => ({ action: value, required_evidence, candidate_event });

export function buildProviderErasureReviewPlan(input: ProviderErasureReviewInput): ProviderErasureReviewResult {
  if (!routeIsCoherent(input)) return { status: "invalid", reasons: ["provider_processor_route_incoherent"] };
  if (input.latest_event === "rejected") {
    return { status: "observed_terminal", execution_authority: "none", reasons: ["provider_rejected_exchange"], actions: [] };
  }
  if (input.latest_event === "outcome_unknown") {
    return { status: "held", execution_authority: "none", reasons: ["provider_outcome_must_be_resolved"], actions: [] };
  }
  if (input.latest_event === "verification_failed") {
    return { status: "held", execution_authority: "none", reasons: ["terminal_verification_failure_requires_remediation"], actions: [] };
  }
  if (input.processor_kind === "configured_downstream") {
    return { status: "held", execution_authority: "none", reasons: ["configured_downstream_contract_unresolved"], actions: [] };
  }
  if (input.processor_kind === "billing") {
    return {
      status: "held",
      execution_authority: "none",
      reasons: [
        "registry_cannot_express_operational_deletion_and_residual_retention",
        ...(input.deletion_handle_available ? [] : ["provider_deletion_handle_unavailable"]),
      ],
      actions: [],
    };
  }
  if (TERMINAL_EVENTS.has(input.latest_event)) {
    return { status: "observed_terminal", execution_authority: "none", reasons: [`provider_terminal:${input.latest_event}`], actions: [] };
  }

  if (input.control_mode === "contractual_zdr" || input.control_mode === "request_verified_zdr") {
    return {
      status: "review_plan",
      execution_authority: "none",
      reasons: ["no_retention_requires_evidence_before_expired_event"],
      actions: [action("verify_zdr_attestation", ["control_evidence_digest", "request_or_contract_scope_match"], "expired")],
    };
  }

  if (input.processor_kind === "audio") {
    if (!input.deletion_handle_available) {
      return {
        status: "held",
        execution_authority: "none",
        reasons: ["provider_deletion_handle_unavailable", "receipt_hmac_is_not_a_deletion_handle"],
        actions: [],
      };
    }
    return {
      status: "review_plan",
      execution_authority: "none",
      reasons: ["operational_deletion_requires_external_execution"],
      actions: [action("request_operational_deletion", ["encrypted_provider_deletion_handle", "provider_deletion_receipt"], "operationally_deleted")],
    };
  }

  if (input.processor_kind === "delivery") {
    return {
      status: "review_plan",
      execution_authority: "none",
      reasons: ["delivery_copy_cannot_be_recalled", "provider_expiry_not_immediate_deletion"],
      actions: [
        action("record_irretrievable_recipient_copy", ["content_free_delivery_receipt"], null),
        action("await_provider_policy_expiry", ["provider_policy_version", "expiry_deadline", "expiry_evidence"], "expired"),
      ],
    };
  }

  if (input.processor_kind === "research") {
    const actions = [action("record_public_query_boundary", ["query_minimization_digest", "public_source_attestation"], null)];
    if (input.control_mode !== "fixed_public_fetch") {
      actions.push(action("await_provider_policy_expiry", ["provider_policy_version", "expiry_deadline", "expiry_evidence"], "expired"));
    }
    return {
      status: "review_plan",
      execution_authority: "none",
      reasons: ["research_route_contains_no_private_brain_class"],
      actions,
    };
  }

  if (input.processor_kind === "model") {
    return {
      status: "review_plan",
      execution_authority: "none",
      reasons: ["provider_expiry_not_immediate_deletion"],
      actions: [action("await_provider_policy_expiry", ["provider_policy_version", "expiry_deadline", "expiry_evidence"], "expired")],
    };
  }

  return { status: "invalid", reasons: ["provider_plan_unreachable"] };
}
