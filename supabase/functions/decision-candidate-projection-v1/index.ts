import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  decryptBrainDecisionField,
  parseBrainDecisionKeyring,
} from "../_shared/brain-decision-crypto.ts";
import { parseDecisionCandidateProjectionRequest } from "../_shared/decision-candidate-projection-core.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit, safeErrorMessage } from "../_shared/public-request-guard.ts";

const MAX_BYTES = 4_096;

type CandidateProjectionContext = {
  candidate_id: string;
  question_id: string;
  workspace_id: string;
  subject_id: string;
  claim_ciphertext: string;
  proposed_at: string;
  disposition: string;
  source_id: string;
  source_type: string;
  source_captured_at: string;
  source_content_ciphertext: string;
  epistemic_basis: string;
};

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function projectionContext(value: unknown): CandidateProjectionContext {
  const row = value as Partial<CandidateProjectionContext> | null;
  const required = [
    row?.candidate_id,
    row?.question_id,
    row?.workspace_id,
    row?.subject_id,
    row?.claim_ciphertext,
    row?.proposed_at,
    row?.disposition,
    row?.source_id,
    row?.source_type,
    row?.source_captured_at,
    row?.source_content_ciphertext,
    row?.epistemic_basis,
  ];
  if (!row || typeof row !== "object" || !required.every((member) => typeof member === "string")) {
    throw new Error("candidate_projection_context_invalid");
  }
  return row as CandidateProjectionContext;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(request.headers)) return response({ error: "json_required" }, 415);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      console.error("decision-candidate-projection-v1 project binding failed");
      return response({ error: "service_configuration_error" }, 503);
    }

    let parsed;
    try {
      parsed = parseDecisionCandidateProjectionRequest(await readJsonWithLimit(request, MAX_BYTES));
    } catch (error) {
      return response({ error: safeErrorMessage(error) }, 400);
    }

    let keyring;
    try {
      keyring = parseBrainDecisionKeyring(Deno.env.get("BRAIN_DECISION_KEYRING_JSON") ?? "");
    } catch (error) {
      console.error("decision-candidate-projection-v1 key configuration failed", { error: safeErrorMessage(error) });
      return response({ error: "service_configuration_error" }, 503);
    }

    try {
      const { data, error } = await ctx.supabase.rpc("read_brain_decision_candidate_v1", {
        p_candidate_id: parsed.candidateId,
      });
      if (error) throw error;
      const context = projectionContext(data);
      const [claim, sourceText] = await Promise.all([
        decryptBrainDecisionField({
          envelope: context.claim_ciphertext,
          context: {
            workspaceId: context.workspace_id,
            subjectId: context.subject_id,
            recordId: context.candidate_id,
            recordKind: "decision_candidate",
            field: "claim",
          },
          keyring,
        }),
        parsed.includeBasis
          ? decryptBrainDecisionField({
            envelope: context.source_content_ciphertext,
            context: {
              workspaceId: context.workspace_id,
              subjectId: context.subject_id,
              recordId: context.source_id,
              recordKind: "decision_source",
              field: "content",
            },
            keyring,
          })
          : Promise.resolve(null),
      ]);

      return response({
        candidate: {
          id: context.candidate_id,
          standing: context.disposition,
          claim,
          proposedAt: context.proposed_at,
        },
        question: { id: context.question_id },
        basis: parsed.includeBasis ? {
          sourceType: context.source_type,
          capturedAt: context.source_captured_at,
          epistemicBasis: context.epistemic_basis,
          sourceText,
        } : null,
      });
    } catch (error) {
      const message = safeErrorMessage(error);
      const status = message.includes("not_found") ? 404 : message.includes("forbidden") ? 403 : 500;
      if (status >= 500) console.error("decision-candidate-projection-v1 failed", { error: message });
      return response({ error: status === 404 ? "not_found" : status === 403 ? "forbidden" : "projection_failed" }, status);
    }
  }),
};
