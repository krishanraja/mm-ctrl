import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  brainDecisionRequestFingerprint,
  decryptBrainDecisionField,
  encryptBrainDecisionField,
  parseBrainDecisionKeyring,
} from "../_shared/brain-decision-crypto.ts";
import {
  canonicalDecisionIngressFingerprintMaterial,
  decisionIngressErrorStatus,
  parseDecisionIngressRequest,
} from "../_shared/decision-ingress-core.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit, safeErrorMessage } from "../_shared/public-request-guard.ts";

const MAX_BYTES = 96_000;

type QuestionContext = {
  question_id: string;
  decision_id: string;
  decision_version_id: string;
  workspace_id: string;
  subject_id: string;
};

type CandidateContext = {
  candidate_id: string;
  question_id: string;
  workspace_id: string;
  subject_id: string;
  claim_ciphertext: string;
  disposition: string;
};

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function questionContext(value: unknown): QuestionContext {
  const row = value as Partial<QuestionContext> | null;
  if (!row || typeof row !== "object" ||
    ![row.question_id, row.decision_id, row.decision_version_id, row.workspace_id, row.subject_id]
      .every((member) => typeof member === "string")) {
    throw new Error("question_context_invalid");
  }
  return row as QuestionContext;
}

function candidateContext(value: unknown): CandidateContext {
  const row = value as Partial<CandidateContext> | null;
  if (!row || typeof row !== "object" ||
    ![row.candidate_id, row.question_id, row.workspace_id, row.subject_id, row.claim_ciphertext, row.disposition]
      .every((member) => typeof member === "string")) {
    throw new Error("candidate_context_invalid");
  }
  return row as CandidateContext;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(request.headers)) return response({ error: "json_required" }, 415);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      console.error("decision-ingress-v1 project binding failed");
      return response({ error: "service_configuration_error" }, 503);
    }

    let raw: unknown;
    try {
      raw = await readJsonWithLimit(request, MAX_BYTES);
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "request_too_large";
      return response({ error: tooLarge ? "request_too_large" : "invalid_json" }, tooLarge ? 413 : 400);
    }

    let parsed;
    try {
      parsed = parseDecisionIngressRequest(raw);
    } catch (error) {
      return response({ error: safeErrorMessage(error) }, 400);
    }

    let keyring;
    const activeKeyId = Deno.env.get("BRAIN_DECISION_ACTIVE_KEY_ID") ?? "";
    const integrityKey = Deno.env.get("BRAIN_DECISION_INTEGRITY_KEY") ?? "";
    try {
      keyring = parseBrainDecisionKeyring(Deno.env.get("BRAIN_DECISION_KEYRING_JSON") ?? "");
      if (!Object.hasOwn(keyring, activeKeyId)) throw new Error("active_key_unavailable");
    } catch (error) {
      console.error("decision-ingress-v1 key configuration failed", { error: safeErrorMessage(error) });
      return response({ error: "service_configuration_error" }, 503);
    }

    try {
      const fingerprint = await brainDecisionRequestFingerprint({
        integrityKey,
        material: canonicalDecisionIngressFingerprintMaterial(parsed),
      });

      if (parsed.action === "stage_candidate" || parsed.action === "stage_grounded_candidate") {
        const { data: contextData, error: contextError } = await ctx.supabase.rpc(
          "read_brain_decision_question_context_v1",
          { p_question_id: parsed.questionId },
        );
        if (contextError) throw contextError;
        const context = questionContext(contextData);
        const candidateId = crypto.randomUUID();
        const sourceId = crypto.randomUUID();
        const assertionId = crypto.randomUUID();
        const [sourceCiphertext, assertionCiphertext, candidateCiphertext] = await Promise.all([
          encryptBrainDecisionField({
            plaintext: parsed.sourceText,
            context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: sourceId, recordKind: "decision_source", field: "content" },
            keyring,
            activeKeyId,
          }),
          encryptBrainDecisionField({
            plaintext: parsed.candidateText,
            context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: assertionId, recordKind: "decision_assertion", field: "statement" },
            keyring,
            activeKeyId,
          }),
          encryptBrainDecisionField({
            plaintext: parsed.candidateText,
            context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: candidateId, recordKind: "decision_candidate", field: "claim" },
            keyring,
            activeKeyId,
          }),
        ]);
        const { data, error } = await ctx.supabase.rpc(
          parsed.action === "stage_grounded_candidate"
            ? "stage_grounded_brain_decision_candidate_v1"
            : "stage_brain_decision_candidate_v1",
          {
          p_candidate_id: candidateId,
          p_question_id: parsed.questionId,
          p_source_id: sourceId,
          p_assertion_id: assertionId,
          p_source_type: parsed.sourceType,
          p_source_content_ciphertext: sourceCiphertext,
          p_assertion_ciphertext: assertionCiphertext,
          p_candidate_ciphertext: candidateCiphertext,
          p_captured_at: parsed.capturedAt,
          ...(parsed.action === "stage_grounded_candidate" ? {
            p_evidence_refs: parsed.evidenceRefs.map((entry) => ({
              evidence_atom_id: entry.evidenceAtomId,
              stance: entry.stance,
            })),
          } : {}),
          p_idempotency_key: parsed.idempotencyKey,
          p_request_fingerprint_sha256: fingerprint,
          },
        );
        if (error) throw error;
        return response({ action: parsed.action, result: data }, 201);
      }

      if (parsed.action === "review_candidate" && parsed.disposition === "rejected") {
        const { data, error } = await ctx.supabase.rpc("reject_brain_decision_candidate_v1", {
          p_candidate_id: parsed.candidateId,
          p_reviewed_at: parsed.reviewedAt,
          p_idempotency_key: parsed.idempotencyKey,
          p_request_fingerprint_sha256: fingerprint,
        });
        if (error) throw error;
        return response({ action: parsed.action, result: data });
      }

      let context: QuestionContext;
      let answer: string;
      let candidateId: string | null = null;
      let candidateDisposition: "confirmed" | "corrected" | null = null;
      let recordedAt: string;
      let questionId: string;

      if (parsed.action === "review_candidate") {
        const { data: candidateData, error: candidateError } = await ctx.supabase.rpc(
          "read_brain_decision_candidate_v1",
          { p_candidate_id: parsed.candidateId },
        );
        if (candidateError) throw candidateError;
        const candidate = candidateContext(candidateData);
        const candidateText = await decryptBrainDecisionField({
          envelope: candidate.claim_ciphertext,
          context: {
            workspaceId: candidate.workspace_id,
            subjectId: candidate.subject_id,
            recordId: candidate.candidate_id,
            recordKind: "decision_candidate",
            field: "claim",
          },
          keyring,
        });
        if (parsed.disposition === "confirmed" && parsed.answer !== undefined && parsed.answer !== candidateText) {
          return response({ error: "confirmed_answer_must_match_candidate" }, 400);
        }
        answer = parsed.disposition === "confirmed" ? candidateText : parsed.answer!;
        questionId = candidate.question_id;
        recordedAt = parsed.reviewedAt;
        candidateId = parsed.candidateId;
        candidateDisposition = parsed.disposition;
        const { data: contextData, error: contextError } = await ctx.supabase.rpc(
          "read_brain_decision_question_context_v1",
          { p_question_id: questionId },
        );
        if (contextError) throw contextError;
        context = questionContext(contextData);
      } else {
        answer = parsed.answer;
        questionId = parsed.questionId;
        recordedAt = parsed.recordedAt;
        const { data: contextData, error: contextError } = await ctx.supabase.rpc(
          "read_brain_decision_question_context_v1",
          { p_question_id: questionId },
        );
        if (contextError) throw contextError;
        context = questionContext(contextData);
      }

      const answerId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const assertionId = crypto.randomUUID();
      const [sourceCiphertext, assertionCiphertext, answerCiphertext] = await Promise.all([
        encryptBrainDecisionField({
          plaintext: answer,
          context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: sourceId, recordKind: "decision_source", field: "content" },
          keyring,
          activeKeyId,
        }),
        encryptBrainDecisionField({
          plaintext: answer,
          context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: assertionId, recordKind: "decision_assertion", field: "statement" },
          keyring,
          activeKeyId,
        }),
        encryptBrainDecisionField({
          plaintext: answer,
          context: { workspaceId: context.workspace_id, subjectId: context.subject_id, recordId: answerId, recordKind: "decision_answer", field: "answer" },
          keyring,
          activeKeyId,
        }),
      ]);
      const { data, error } = await ctx.supabase.rpc("record_brain_decision_answer_v1", {
        p_answer_id: answerId,
        p_question_id: questionId,
        p_source_id: sourceId,
        p_assertion_id: assertionId,
        p_source_content_ciphertext: sourceCiphertext,
        p_assertion_ciphertext: assertionCiphertext,
        p_answer_ciphertext: answerCiphertext,
        p_recorded_at: recordedAt,
        p_idempotency_key: parsed.idempotencyKey,
        p_request_fingerprint_sha256: fingerprint,
        p_candidate_id: candidateId,
        p_candidate_disposition: candidateDisposition,
      });
      if (error) throw error;
      return response({ action: parsed.action, result: data }, 201);
    } catch (error) {
      const message = safeErrorMessage(error);
      const status = decisionIngressErrorStatus(message);
      if (status >= 500) console.error("decision-ingress-v1 failed", { action: parsed.action, error: message });
      return response({
        error: status === 404 ? "not_found"
          : status === 403 ? "forbidden"
          : status === 409 ? "state_conflict"
          : status === 503 ? "retry_later"
          : "decision_ingress_failed",
      }, status);
    }
  }),
};
