import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  brainDecisionRequestFingerprint,
  decryptBrainDecisionField,
  encryptBrainDecisionField,
  parseBrainDecisionKeyring,
} from "../_shared/brain-decision-crypto.ts";
import {
  type DecisionReconstructionInput,
  type DecisionReconstructionResult,
} from "../_shared/decision-reconstruction-core.ts";
import {
  DECISION_RECONSTRUCTION_MODEL,
  DECISION_RECONSTRUCTION_PRICING_VERSION,
  DECISION_RECONSTRUCTION_PROMPT_VERSION,
  DECISION_RECONSTRUCTION_SCHEMA_VERSION,
  reconstructDecisionWithOpenAI,
  type DecisionReconstructionProviderReceipt,
} from "../_shared/decision-reconstruction-openai.ts";
import {
  decisionReconstructionStatus,
  parseDecisionReconstructionRequest,
} from "../_shared/decision-reconstruction-request.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit, safeErrorMessage } from "../_shared/public-request-guard.ts";

const MAX_BYTES = 8_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReconstructionPacket = {
  decision_id: string;
  decision_version_id: string;
  question_id: string;
  workspace_id: string;
  subject_id: string;
  title_ciphertext: string;
  stakes_ciphertext: string;
  human_prior_id: string | null;
  human_prior_ciphertext: string | null;
  question_ciphertext: string;
  evidence: Array<{
    evidence_atom_id: string;
    assertion_id: string;
    stance: "supports" | "refutes" | "context";
    source_type: "meeting" | "document" | "observed_action" | "external";
    epistemic_basis: "user_stated" | "observed" | "external_claim" | "inferred";
    captured_at_us: string;
    statement_ciphertext: string;
    atom_sha256: string;
  }>;
};

type BeginResult = {
  status: "created" | "replayed";
  run_id: string;
  state: "pending" | "completed" | "failed";
  workspace_id?: string;
  subject_id?: string;
  packet?: ReconstructionPacket;
  input_sha256?: string;
  outcome?: "candidate" | "abstain" | "invalid" | "provider_error" | null;
  candidate_id?: string | null;
  output_ciphertext?: string | null;
  model_returned?: string | null;
  provider_response_id?: string | null;
  pricing_version?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  estimated_cost_microusd?: number | null;
  error_code?: string | null;
};

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function packet(value: unknown): ReconstructionPacket {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("reconstruction_packet_invalid");
  const row = value as Partial<ReconstructionPacket>;
  if (![row.decision_id, row.decision_version_id, row.question_id, row.workspace_id, row.subject_id,
    row.title_ciphertext, row.stakes_ciphertext, row.question_ciphertext].every((entry) => typeof entry === "string") ||
    !Array.isArray(row.evidence)) {
    throw new Error("reconstruction_packet_invalid");
  }
  if ((row.human_prior_id === null) !== (row.human_prior_ciphertext === null)) {
    throw new Error("reconstruction_prior_invalid");
  }
  return row as ReconstructionPacket;
}

function beginResult(value: unknown): BeginResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("reconstruction_begin_invalid");
  const result = value as Partial<BeginResult>;
  if ((result.status !== "created" && result.status !== "replayed") || typeof result.run_id !== "string") {
    throw new Error("reconstruction_begin_invalid");
  }
  return result as BeginResult;
}

function microsToIso(value: string): string {
  if (!/^\d{16}$/.test(value)) throw new Error("evidence_captured_at_invalid");
  return new Date(Number(BigInt(value) / 1000n)).toISOString();
}

function controlledFailure(error: unknown): { outcome: "invalid" | "provider_error"; code: string } {
  const message = safeErrorMessage(error);
  const semantic = message.startsWith("candidate_") || message.startsWith("evidence_") ||
    message.startsWith("output_") || message.startsWith("abstention_") ||
    message.startsWith("leader_question_");
  const provider = /^provider_[a-z0-9_]+$/.test(message);
  const rawCode = semantic || provider ? message : "provider_failure";
  return {
    outcome: semantic ? "invalid" : "provider_error",
    code: rawCode.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80),
  };
}

function receiptFromReplay(begin: BeginResult): DecisionReconstructionProviderReceipt {
  if (typeof begin.model_returned !== "string" || typeof begin.provider_response_id !== "string" ||
    begin.pricing_version !== DECISION_RECONSTRUCTION_PRICING_VERSION ||
    !Number.isInteger(begin.input_tokens) || !Number.isInteger(begin.output_tokens) ||
    !Number.isInteger(begin.estimated_cost_microusd)) {
    throw new Error("reconstruction_replay_receipt_invalid");
  }
  return {
    provider: "openai",
    modelRequested: DECISION_RECONSTRUCTION_MODEL,
    modelReturned: begin.model_returned,
    responseId: begin.provider_response_id,
    promptVersion: DECISION_RECONSTRUCTION_PROMPT_VERSION,
    schemaVersion: DECISION_RECONSTRUCTION_SCHEMA_VERSION,
    pricingVersion: DECISION_RECONSTRUCTION_PRICING_VERSION,
    inputTokens: begin.input_tokens!,
    outputTokens: begin.output_tokens!,
    estimatedCostMicrousd: begin.estimated_cost_microusd!,
  };
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(request.headers)) return response({ error: "json_required" }, 415);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      console.error("decision-reconstruct-v1 project binding failed");
      return response({ error: "service_configuration_error" }, 503);
    }
    const actorId = ctx.userClaims?.id;
    if (typeof actorId !== "string" || !UUID.test(actorId)) {
      return response({ error: "authentication_failed" }, 401);
    }

    let requestBody;
    try {
      requestBody = parseDecisionReconstructionRequest(await readJsonWithLimit(request, MAX_BYTES));
    } catch (error) {
      const message = safeErrorMessage(error);
      return response({ error: message === "request_too_large" ? message : "invalid_request" }, message === "request_too_large" ? 413 : 400);
    }

    const activeKeyId = Deno.env.get("BRAIN_DECISION_ACTIVE_KEY_ID") ?? "";
    const integrityKey = Deno.env.get("BRAIN_DECISION_INTEGRITY_KEY") ?? "";
    let keyring;
    try {
      keyring = parseBrainDecisionKeyring(Deno.env.get("BRAIN_DECISION_KEYRING_JSON") ?? "");
      if (!Object.hasOwn(keyring, activeKeyId) || integrityKey.length < 32) throw new Error("key_unavailable");
    } catch {
      return response({ error: "service_configuration_error" }, 503);
    }

    const runId = crypto.randomUUID();
    const { data: rawBegin, error: beginError } = await ctx.supabaseAdmin.rpc("begin_brain_decision_reconstruction_service_v1", {
      p_actor_id: actorId,
      p_run_id: runId,
      p_question_id: requestBody.questionId,
      p_idempotency_key: requestBody.idempotencyKey,
      p_provider: "openai",
      p_model_requested: DECISION_RECONSTRUCTION_MODEL,
      p_prompt_version: DECISION_RECONSTRUCTION_PROMPT_VERSION,
      p_schema_version: DECISION_RECONSTRUCTION_SCHEMA_VERSION,
    });
    if (beginError) {
      const status = decisionReconstructionStatus(beginError.message);
      return response({ error: status === 500 ? "reconstruction_failed" : "reconstruction_unavailable" }, status);
    }

    let begun: BeginResult;
    try {
      begun = beginResult(rawBegin);
    } catch {
      return response({ error: "reconstruction_failed" }, 500);
    }

    if (begun.status === "replayed") {
      if (begun.state === "pending") return response({ error: "reconstruction_in_progress" }, 409);
      if (begun.state === "failed") return response({ error: "reconstruction_failed", retryable: false }, 422);
      try {
        if (!begun.output_ciphertext) throw new Error("reconstruction_replay_output_missing");
        if (!begun.workspace_id || !begun.subject_id) throw new Error("reconstruction_replay_scope_missing");
        const outputText = await decryptBrainDecisionField({
          envelope: begun.output_ciphertext,
          context: {
            workspaceId: begun.workspace_id,
            subjectId: begun.subject_id,
            recordId: begun.run_id,
            recordKind: "decision_reconstruction_run",
            field: "output",
          },
          keyring,
        });
        const replayed = JSON.parse(outputText) as DecisionReconstructionResult;
        return response({
          status: "replayed",
          runId: begun.run_id,
          candidateId: begun.candidate_id ?? null,
          result: replayed,
          receipt: receiptFromReplay(begun),
        });
      } catch {
        return response({ error: "reconstruction_failed" }, 500);
      }
    }

    let canonicalPacket: ReconstructionPacket;
    let modelInput: DecisionReconstructionInput;
    try {
      canonicalPacket = packet(begun.packet);
      const decrypt = (envelope: string, recordId: string, recordKind: string, field: string) =>
        decryptBrainDecisionField({
          envelope,
          context: {
            workspaceId: canonicalPacket.workspace_id,
            subjectId: canonicalPacket.subject_id,
            recordId,
            recordKind,
            field,
          },
          keyring,
        });
      const [title, stakes, humanPrior, question, ...evidenceText] = await Promise.all([
        decrypt(canonicalPacket.title_ciphertext, canonicalPacket.decision_version_id, "decision_version", "title"),
        decrypt(canonicalPacket.stakes_ciphertext, canonicalPacket.decision_version_id, "decision_version", "stakes"),
        canonicalPacket.human_prior_id && canonicalPacket.human_prior_ciphertext
          ? decrypt(canonicalPacket.human_prior_ciphertext, canonicalPacket.human_prior_id, "decision_human_prior", "position")
          : Promise.resolve(null),
        decrypt(canonicalPacket.question_ciphertext, canonicalPacket.question_id, "decision_question", "prompt"),
        ...canonicalPacket.evidence.map((entry) =>
          decrypt(entry.statement_ciphertext, entry.assertion_id, "decision_assertion", "statement")
        ),
      ]);
      modelInput = {
        decisionId: canonicalPacket.decision_id,
        decisionVersionId: canonicalPacket.decision_version_id,
        questionId: canonicalPacket.question_id,
        decision: { title, stakes, humanPrior },
        question,
        evidence: canonicalPacket.evidence.map((entry, index) => ({
          evidenceAtomId: entry.evidence_atom_id,
          assertionId: entry.assertion_id,
          stance: entry.stance,
          sourceType: entry.source_type,
          epistemicBasis: entry.epistemic_basis,
          capturedAt: microsToIso(entry.captured_at_us),
          text: evidenceText[index],
        })),
      };
    } catch (error) {
      console.error("decision reconstruction packet failed", { error: safeErrorMessage(error) });
      await ctx.supabaseAdmin.rpc("finish_brain_decision_reconstruction_service_v1", {
        p_actor_id: actorId,
        p_run_id: begun.run_id, p_outcome: "invalid", p_output_ciphertext: null,
        p_output_sha256: null, p_model_returned: null, p_provider_response_id: null,
        p_pricing_version: null, p_input_tokens: null, p_output_tokens: null,
        p_estimated_cost_microusd: null, p_error_code: "canonical_packet_invalid",
      });
      return response({ error: "reconstruction_failed" }, 500);
    }

    let reconstruction;
    try {
      reconstruction = await reconstructDecisionWithOpenAI({
        apiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
        input: modelInput,
      });
    } catch (error) {
      const failure = controlledFailure(error);
      console.error("decision reconstruction provider failed", { code: failure.code });
      await ctx.supabaseAdmin.rpc("finish_brain_decision_reconstruction_service_v1", {
        p_actor_id: actorId,
        p_run_id: begun.run_id, p_outcome: failure.outcome, p_output_ciphertext: null,
        p_output_sha256: null, p_model_returned: null, p_provider_response_id: null,
        p_pricing_version: null, p_input_tokens: null, p_output_tokens: null,
        p_estimated_cost_microusd: null, p_error_code: failure.code,
      });
      return response({ error: "reconstruction_failed", retryable: false }, failure.outcome === "invalid" ? 422 : 502);
    }

    const outputJson = JSON.stringify(reconstruction.result);
    const outputCiphertext = await encryptBrainDecisionField({
      plaintext: outputJson,
      context: {
        workspaceId: canonicalPacket.workspace_id,
        subjectId: canonicalPacket.subject_id,
        recordId: begun.run_id,
        recordKind: "decision_reconstruction_run",
        field: "output",
      },
      keyring,
      activeKeyId,
    });
    const outputSha256 = await brainDecisionRequestFingerprint({
      integrityKey,
      material: outputCiphertext,
    });
    const receipt = reconstruction.receipt;

    if (reconstruction.result.status === "abstain") {
      const { error } = await ctx.supabaseAdmin.rpc("finish_brain_decision_reconstruction_service_v1", {
        p_actor_id: actorId,
        p_run_id: begun.run_id, p_outcome: "abstain", p_output_ciphertext: outputCiphertext,
        p_output_sha256: outputSha256, p_model_returned: receipt.modelReturned,
        p_provider_response_id: receipt.responseId, p_pricing_version: receipt.pricingVersion,
        p_input_tokens: receipt.inputTokens, p_output_tokens: receipt.outputTokens,
        p_estimated_cost_microusd: receipt.estimatedCostMicrousd, p_error_code: null,
      });
      if (error) return response({ error: "reconstruction_failed" }, 500);
      return response({ status: "created", runId: begun.run_id, candidateId: null, result: reconstruction.result, receipt }, 201);
    }

    const candidateId = crypto.randomUUID();
    const sourceId = crypto.randomUUID();
    const assertionId = crypto.randomUUID();
    const sourceText = JSON.stringify({
      kind: "decision_reconstruction",
      runId: begun.run_id,
      model: receipt.modelReturned,
      evidenceRefs: reconstruction.result.evidenceRefs,
      decisionImpact: reconstruction.result.decisionImpact,
      countercase: reconstruction.result.countercase,
      uncertainty: reconstruction.result.uncertainty,
    });
    const [sourceCiphertext, assertionCiphertext, candidateCiphertext] = await Promise.all([
      encryptBrainDecisionField({
        plaintext: sourceText,
        context: { workspaceId: canonicalPacket.workspace_id, subjectId: canonicalPacket.subject_id, recordId: sourceId, recordKind: "decision_source", field: "content" },
        keyring, activeKeyId,
      }),
      encryptBrainDecisionField({
        plaintext: reconstruction.result.claim,
        context: { workspaceId: canonicalPacket.workspace_id, subjectId: canonicalPacket.subject_id, recordId: assertionId, recordKind: "decision_assertion", field: "statement" },
        keyring, activeKeyId,
      }),
      encryptBrainDecisionField({
        plaintext: reconstruction.result.claim,
        context: { workspaceId: canonicalPacket.workspace_id, subjectId: canonicalPacket.subject_id, recordId: candidateId, recordKind: "decision_candidate", field: "claim" },
        keyring, activeKeyId,
      }),
    ]);
    const requestFingerprint = await brainDecisionRequestFingerprint({
      integrityKey,
      material: JSON.stringify({
        v: 1,
        run_id: begun.run_id,
        input_sha256: begun.input_sha256,
        result: reconstruction.result,
        receipt,
      }),
    });
    const { data: staged, error: stageError } = await ctx.supabaseAdmin.rpc(
      "commit_brain_decision_reconstruction_candidate_service_v1",
      {
        p_actor_id: actorId,
        p_run_id: begun.run_id,
        p_candidate_id: candidateId,
        p_source_id: sourceId,
        p_assertion_id: assertionId,
        p_source_content_ciphertext: sourceCiphertext,
        p_assertion_ciphertext: assertionCiphertext,
        p_candidate_ciphertext: candidateCiphertext,
        p_evidence_refs: reconstruction.result.evidenceRefs.map((entry) => ({
          evidence_atom_id: entry.evidenceAtomId,
          stance: entry.stance,
        })),
        p_request_fingerprint_sha256: requestFingerprint,
        p_output_ciphertext: outputCiphertext,
        p_output_sha256: outputSha256,
        p_model_returned: receipt.modelReturned,
        p_provider_response_id: receipt.responseId,
        p_pricing_version: receipt.pricingVersion,
        p_input_tokens: receipt.inputTokens,
        p_output_tokens: receipt.outputTokens,
        p_estimated_cost_microusd: receipt.estimatedCostMicrousd,
      },
    );
    if (stageError) {
      console.error("decision reconstruction commit failed", { error: stageError.code });
      await ctx.supabaseAdmin.rpc("finish_brain_decision_reconstruction_service_v1", {
        p_actor_id: actorId,
        p_run_id: begun.run_id, p_outcome: "invalid", p_output_ciphertext: null,
        p_output_sha256: null, p_model_returned: receipt.modelReturned,
        p_provider_response_id: receipt.responseId, p_pricing_version: receipt.pricingVersion,
        p_input_tokens: receipt.inputTokens, p_output_tokens: receipt.outputTokens,
        p_estimated_cost_microusd: receipt.estimatedCostMicrousd,
        p_error_code: "candidate_commit_failed",
      });
      return response({ error: "reconstruction_failed" }, 409);
    }
    const committed = staged as { candidate_id?: string } | null;
    return response({
      status: "created",
      runId: begun.run_id,
      candidateId: committed?.candidate_id ?? candidateId,
      result: reconstruction.result,
      receipt,
    }, 201);
  }),
};
