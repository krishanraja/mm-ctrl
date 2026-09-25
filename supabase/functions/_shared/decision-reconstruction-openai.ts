import {
  buildDecisionReconstructionPrompt,
  parseDecisionReconstructionInput,
  parseDecisionReconstructionOutput,
  type DecisionReconstructionInput,
  type DecisionReconstructionResult,
} from "./decision-reconstruction-core.ts";

export const DECISION_RECONSTRUCTION_MODEL = "gpt-5.6-sol";
export const DECISION_RECONSTRUCTION_PROMPT_VERSION = "r150.v1";
export const DECISION_RECONSTRUCTION_SCHEMA_VERSION = "r150.v1";
export const DECISION_RECONSTRUCTION_PRICING_VERSION = "openai-2026-09-25";

const OPENAI_INPUT_MICRO_USD_PER_TOKEN = 4;
const OPENAI_OUTPUT_MICRO_USD_PER_TOKEN = 20;

const OPENAI_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "status", "claim", "decisionImpact", "countercase", "uncertainty",
    "reason", "gap", "nextBestAction", "evidenceRefs",
  ],
  properties: {
    status: { type: "string", enum: ["candidate", "abstain"] },
    claim: { type: ["string", "null"] },
    decisionImpact: { type: ["string", "null"] },
    countercase: { type: ["string", "null"] },
    uncertainty: { type: ["string", "null"] },
    reason: {
      type: ["string", "null"],
      enum: ["evidence_too_thin", "evidence_conflict", "evidence_too_stale", "question_not_answerable", null],
    },
    gap: { type: ["string", "null"] },
    nextBestAction: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["kind", "prompt"],
      properties: {
        kind: { type: "string", enum: ["ask_leader", "research", "request_document", "run_session"] },
        prompt: { type: "string" },
      },
    },
    evidenceRefs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["evidenceAtomId", "stance"],
        properties: {
          evidenceAtomId: { type: "string" },
          stance: { type: "string", enum: ["supports", "refutes", "context"] },
        },
      },
    },
  },
} as const;

type ProviderEnvelope = {
  status: "candidate" | "abstain";
  claim: string | null;
  decisionImpact: string | null;
  countercase: string | null;
  uncertainty: string | null;
  reason: "evidence_too_thin" | "evidence_conflict" | "evidence_too_stale" | "question_not_answerable" | null;
  gap: string | null;
  nextBestAction: {
    kind: "ask_leader" | "research" | "request_document" | "run_session";
    prompt: string;
  } | null;
  evidenceRefs: Array<{
    evidenceAtomId: string;
    stance: "supports" | "refutes" | "context";
  }>;
};

export type DecisionReconstructionProviderReceipt = {
  provider: "openai";
  modelRequested: typeof DECISION_RECONSTRUCTION_MODEL;
  modelReturned: string;
  responseId: string;
  promptVersion: typeof DECISION_RECONSTRUCTION_PROMPT_VERSION;
  schemaVersion: typeof DECISION_RECONSTRUCTION_SCHEMA_VERSION;
  pricingVersion: typeof DECISION_RECONSTRUCTION_PRICING_VERSION;
  inputTokens: number;
  outputTokens: number;
  estimatedCostMicrousd: number;
};

export class DecisionReconstructionProviderError extends Error {}

function providerObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DecisionReconstructionProviderError(`${field}_invalid`);
  }
  return value as Record<string, unknown>;
}

function strictProviderEnvelope(value: unknown): ProviderEnvelope {
  const envelope = providerObject(value, "provider_output");
  const expected = [
    "status", "claim", "decisionImpact", "countercase", "uncertainty",
    "reason", "gap", "nextBestAction", "evidenceRefs",
  ].sort();
  const actual = Object.keys(envelope).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new DecisionReconstructionProviderError("provider_output_shape_invalid");
  }
  if (envelope.status !== "candidate" && envelope.status !== "abstain") {
    throw new DecisionReconstructionProviderError("provider_output_status_invalid");
  }
  if (!Array.isArray(envelope.evidenceRefs)) {
    throw new DecisionReconstructionProviderError("provider_output_evidence_invalid");
  }

  if (envelope.status === "candidate") {
    if ([envelope.claim, envelope.decisionImpact, envelope.countercase, envelope.uncertainty]
      .some((entry) => typeof entry !== "string") ||
      envelope.reason !== null || envelope.gap !== null || envelope.nextBestAction !== null) {
      throw new DecisionReconstructionProviderError("provider_candidate_branch_invalid");
    }
  } else if (envelope.claim !== null || envelope.decisionImpact !== null ||
    envelope.countercase !== null || envelope.uncertainty !== null ||
    typeof envelope.reason !== "string" || typeof envelope.gap !== "string" ||
    !envelope.nextBestAction || typeof envelope.nextBestAction !== "object") {
    throw new DecisionReconstructionProviderError("provider_abstention_branch_invalid");
  }
  return envelope as ProviderEnvelope;
}

function compactProviderEnvelope(envelope: ProviderEnvelope): unknown {
  if (envelope.status === "candidate") {
    return {
      status: envelope.status,
      claim: envelope.claim,
      decisionImpact: envelope.decisionImpact,
      countercase: envelope.countercase,
      uncertainty: envelope.uncertainty,
      evidenceRefs: envelope.evidenceRefs,
    };
  }
  return {
    status: envelope.status,
    reason: envelope.reason,
    gap: envelope.gap,
    nextBestAction: envelope.nextBestAction,
    evidenceRefs: envelope.evidenceRefs,
  };
}

function outputText(payload: Record<string, unknown>): string {
  if (!Array.isArray(payload.output)) throw new DecisionReconstructionProviderError("provider_output_missing");
  for (const item of payload.output) {
    const output = providerObject(item, "provider_output_item");
    if (!Array.isArray(output.content)) continue;
    for (const contentItem of output.content) {
      const content = providerObject(contentItem, "provider_content_item");
      if (content.type === "refusal") throw new DecisionReconstructionProviderError("provider_refused");
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new DecisionReconstructionProviderError("provider_output_text_missing");
}

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new DecisionReconstructionProviderError(`${field}_invalid`);
  }
  return Number(value);
}

export function buildDecisionReconstructionOpenAIRequest(rawInput: unknown): Record<string, unknown> {
  const input = parseDecisionReconstructionInput(rawInput);
  const prompt = buildDecisionReconstructionPrompt(input);
  return {
    model: DECISION_RECONSTRUCTION_MODEL,
    store: false,
    reasoning: { effort: "high" },
    input: [
      { role: "developer", content: [{ type: "input_text", text: prompt.system }] },
      { role: "user", content: [{ type: "input_text", text: prompt.user }] },
    ],
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "decision_reconstruction_r150",
        description: "One grounded provisional candidate or an honest abstention.",
        strict: true,
        schema: OPENAI_OUTPUT_SCHEMA,
      },
    },
  };
}

export async function reconstructDecisionWithOpenAI({
  apiKey,
  input: rawInput,
  fetchImpl = fetch,
}: {
  apiKey: string;
  input: unknown;
  fetchImpl?: typeof fetch;
}): Promise<{ result: DecisionReconstructionResult; receipt: DecisionReconstructionProviderReceipt }> {
  if (typeof apiKey !== "string" || apiKey.trim().length < 20) {
    throw new DecisionReconstructionProviderError("provider_key_unavailable");
  }
  const input: DecisionReconstructionInput = parseDecisionReconstructionInput(rawInput);
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildDecisionReconstructionOpenAIRequest(input)),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    throw new DecisionReconstructionProviderError(`provider_http_${response.status}`);
  }
  const payload = providerObject(await response.json(), "provider_response");
  if (payload.status !== "completed") {
    throw new DecisionReconstructionProviderError("provider_response_incomplete");
  }
  const responseId = typeof payload.id === "string" ? payload.id : "";
  const modelReturned = typeof payload.model === "string" ? payload.model : "";
  if (!responseId || !modelReturned) throw new DecisionReconstructionProviderError("provider_receipt_invalid");
  const usage = providerObject(payload.usage, "provider_usage");
  const inputTokens = integer(usage.input_tokens, "provider_input_tokens");
  const outputTokens = integer(usage.output_tokens, "provider_output_tokens");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText(payload));
  } catch (error) {
    if (error instanceof DecisionReconstructionProviderError) throw error;
    throw new DecisionReconstructionProviderError("provider_output_json_invalid");
  }
  const envelope = strictProviderEnvelope(parsedJson);
  const result = parseDecisionReconstructionOutput(compactProviderEnvelope(envelope), input);
  return {
    result,
    receipt: {
      provider: "openai",
      modelRequested: DECISION_RECONSTRUCTION_MODEL,
      modelReturned,
      responseId,
      promptVersion: DECISION_RECONSTRUCTION_PROMPT_VERSION,
      schemaVersion: DECISION_RECONSTRUCTION_SCHEMA_VERSION,
      pricingVersion: DECISION_RECONSTRUCTION_PRICING_VERSION,
      inputTokens,
      outputTokens,
      estimatedCostMicrousd:
        inputTokens * OPENAI_INPUT_MICRO_USD_PER_TOKEN + outputTokens * OPENAI_OUTPUT_MICRO_USD_PER_TOKEN,
    },
  };
}
