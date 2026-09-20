/**
 * grade-sort: one fast, owner-bound interaction write.
 *
 * The route computes feedback from owner-visible rows, but one database
 * transaction owns every mutation: grade upsert, optional person-authored
 * candidate, optional manipulation answer, and the idempotency receipt. A
 * failed late write therefore cannot leave a grade without its diagnostic
 * context or a grade-evidence row without its construct.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  canShowKill,
  matchesExistingConstruct,
  namesIntendedDimension,
  pairSplitRate,
  selfAgreement,
  splitRateForHalt,
  haltVerdict,
  type ConstructLike,
  type PairRole,
  type Verdict,
} from "../_shared/sort-composition.ts";
import { createLogger } from "../_shared/logger.ts";
import { matchesExpectedSupabaseProject } from "../_shared/project-binding.ts";
import { isJsonRequest, readJsonWithLimit } from "../_shared/public-request-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERDICTS: Verdict[] = ["send", "would_not_send", "skip"];
const REQUEST_KEYS = new Set([
  "run_id", "item_id", "verdict", "why", "ms_to_grade",
  "manip_answer", "pair_id", "request_id",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,120}$/;
const MAX_REQUEST_BYTES = 4_096;
const MAX_WHY_CHARS = 600;
const MAX_MANIP_ANSWER_CHARS = 600;
const MAX_POLE_CHARS = 240;
const MIN_WHY_CHARS_FOR_CONSTRUCT = 12;
const MAX_GRADE_MS = 86_400_000;

interface SessionItem {
  id: string;
  user_id: string;
  session_id: string;
  surface: string;
  position: number;
  pair_id: string | null;
  pair_role: PairRole | null;
  intended_dimension: string | null;
  held_out: boolean;
  repeat_of: string | null;
  targets: string[] | null;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const log = createLogger("grade-sort");
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!isJsonRequest(req.headers)) return json({ error: "content_type_must_be_json" }, 415);

    let payload: Record<string, unknown>;
    try {
      const raw = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_shape");
      payload = raw as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.message === "request_too_large") {
        return json({ error: "request_too_large" }, 413);
      }
      return json({ error: "invalid_json" }, 400);
    }
    if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) {
      return json({ error: "unexpected_field" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const expectedProjectRef = Deno.env.get("EXPECTED_SUPABASE_PROJECT_REF") ?? "";
    if (!matchesExpectedSupabaseProject(supabaseUrl, expectedProjectRef)) {
      log.error("database configuration does not match the configured project");
      return json({ error: "database_configuration_error" }, 503);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "missing_authorization" }, 401);
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (userError || !userId) return json({ error: "unauthorized" }, 401);

    const runId = typeof payload.run_id === "string" ? payload.run_id.trim() : "";
    const itemId = typeof payload.item_id === "string" ? payload.item_id.trim() : "";
    const requestId = typeof payload.request_id === "string" ? payload.request_id.trim() : "";
    const verdict = VERDICTS.includes(payload.verdict as Verdict) ? payload.verdict as Verdict : null;
    if (!UUID.test(runId) || !UUID.test(itemId)) return json({ error: "invalid_run_or_item_id" }, 400);
    if (!REQUEST_ID.test(requestId)) return json({ error: "request_id_required" }, 400);
    if (!verdict) return json({ error: "invalid_verdict" }, 400);

    if (payload.why !== undefined && typeof payload.why !== "string") return json({ error: "invalid_why" }, 400);
    if (payload.manip_answer !== undefined && typeof payload.manip_answer !== "string") return json({ error: "invalid_manip_answer" }, 400);
    if (payload.pair_id !== undefined && typeof payload.pair_id !== "string") return json({ error: "invalid_pair_id" }, 400);
    const why = typeof payload.why === "string" ? payload.why.trim() : "";
    const manipAnswer = typeof payload.manip_answer === "string" ? payload.manip_answer.trim() : "";
    const manipPairId = typeof payload.pair_id === "string" ? payload.pair_id.trim() : "";
    if (why.length > MAX_WHY_CHARS) return json({ error: "why_too_long" }, 400);
    if (manipAnswer.length > MAX_MANIP_ANSWER_CHARS) return json({ error: "manip_answer_too_long" }, 400);
    if (Boolean(manipAnswer) !== Boolean(manipPairId) || (manipPairId && !UUID.test(manipPairId))) {
      return json({ error: "manip_answer_and_pair_required_together" }, 400);
    }
    let msToGrade: number | null = null;
    if (payload.ms_to_grade !== undefined) {
      if (typeof payload.ms_to_grade !== "number" || !Number.isInteger(payload.ms_to_grade) ||
          payload.ms_to_grade < 0 || payload.ms_to_grade > MAX_GRADE_MS) {
        return json({ error: "invalid_ms_to_grade" }, 400);
      }
      msToGrade = payload.ms_to_grade;
    }

    const requestFingerprint = await sha256Hex(JSON.stringify({
      run_id: runId,
      item_id: itemId,
      verdict,
      why: why || null,
      ms_to_grade: msToGrade,
      manip_answer: manipAnswer || null,
      pair_id: manipPairId || null,
    }));

    const { data: sessionRows, error: sessionError } = await client
      .from("sort_items")
      .select("id,user_id,session_id,surface,position,pair_id,pair_role,intended_dimension,held_out,repeat_of,targets")
      .eq("session_id", runId)
      .order("position", { ascending: true });
    if (sessionError) throw new Error(`session_items_read_failed:${sessionError.code ?? "unknown"}`);
    const items = (sessionRows ?? []) as SessionItem[];
    const gradedItem = items.find((item) => item.id === itemId);
    if (!gradedItem) return json({ error: "item_not_found" }, 404);
    const itemById = new Map(items.map((item) => [item.id, item]));

    let createConstruct = false;
    if (why.length >= MIN_WHY_CHARS_FOR_CONSTRUCT && verdict !== "skip") {
      const { data: existing, error: constructError } = await client
        .from("constructs")
        .select("id,emergent_pole")
        .in("status", ["candidate", "elicited", "compiled"])
        .limit(200);
      if (constructError) throw new Error(`construct_match_read_failed:${constructError.code ?? "unknown"}`);
      const deckSet = new Set(items.flatMap((item) => item.targets ?? []));
      const rows = (existing ?? []) as Array<{ id: string; emergent_pole: string }>;
      const candidates: ConstructLike[] = [
        ...rows.filter((row) => deckSet.has(row.id)),
        ...rows.filter((row) => !deckSet.has(row.id)),
      ].map((row) => ({ id: row.id, emergentPole: row.emergent_pole }));
      createConstruct = !matchesExistingConstruct(why, candidates);
    }

    let manip: { pair_id: string; ok: boolean; scored: boolean } | null = null;
    if (manipAnswer && manipPairId) {
      const members = items.filter((item) => item.pair_id === manipPairId);
      if (members.length !== 2 || gradedItem.pair_id !== manipPairId) {
        return json({ error: "invalid_manipulation_pair" }, 400);
      }
      const key = members.find((item) => item.intended_dimension)?.intended_dimension ?? "";
      const scored = key.trim().length > 0;
      const ok = scored ? namesIntendedDimension(manipAnswer, key) : false;
      manip = { pair_id: manipPairId, ok, scored };
    }

    const { data: submission, error: submissionError } = await client.rpc("submit_sort_grade_atomic", {
      p_request_id: requestId,
      p_request_fingerprint: requestFingerprint,
      p_run_id: runId,
      p_item_id: itemId,
      p_verdict: verdict,
      p_why: why || null,
      p_ms_to_grade: msToGrade,
      p_create_construct: createConstruct,
      p_manip_pair_id: manipPairId || null,
      p_manip_answer: manipAnswer || null,
      p_manip_scored: manip?.scored ?? null,
      p_manip_ok: manip?.ok ?? null,
    });
    if (submissionError || !submission) {
      const message = submissionError?.message ?? "unknown";
      if (message.includes("grade_sort_request_conflict")) return json({ error: "request_id_conflict" }, 409);
      if (message.includes("grade_sort_run_not_ready")) return json({ error: "sort_not_ready" }, 409);
      if (message.includes("grade_sort_run_not_owned") || message.includes("grade_sort_item_not_owned")) {
        return json({ error: "item_not_found" }, 404);
      }
      if (message.includes("grade_sort_invalid_")) return json({ error: "invalid_submission" }, 400);
      throw new Error(`grade_submission_failed:${submissionError?.code ?? "unknown"}`);
    }

    const { data: gradeRows, error: gradeReadError } = await client
      .from("sort_grades")
      .select("item_id,verdict,why")
      .in("item_id", items.map((item) => item.id));
    if (gradeReadError) throw new Error(`grade_read_failed:${gradeReadError.code ?? "unknown"}`);
    const grades = (gradeRows ?? []) as Array<{ item_id: string; verdict: Verdict; why: string | null }>;
    const gradedIds = new Set(grades.map((grade) => grade.item_id));
    const pairGrades = grades.map((grade) => {
      const row = itemById.get(grade.item_id);
      return { pairId: row?.pair_id ?? null, pairRole: row?.pair_role ?? null, verdict: grade.verdict };
    });
    const split = pairSplitRate(pairGrades);
    const haltRate = splitRateForHalt(pairGrades);
    const agreement = selfAgreement(grades.map((grade) => ({
      itemId: grade.item_id,
      repeatOfItemId: itemById.get(grade.item_id)?.repeat_of ?? null,
      verdict: grade.verdict,
    })));

    let trainingAccepts = 0;
    let trainingRejects = 0;
    for (const grade of grades) {
      const row = itemById.get(grade.item_id);
      if (!row || row.held_out || row.repeat_of) continue;
      if (grade.verdict === "send") trainingAccepts += 1;
      if (grade.verdict === "would_not_send") trainingRejects += 1;
    }
    const newConstructId = typeof submission.new_construct_id === "string" ? submission.new_construct_id : null;

    log.info("grade recorded", {
      run_id: runId,
      position: gradedItem.position,
      verdict,
      graded: grades.length,
      total: items.length,
      idempotent: submission.idempotent === true,
    });
    return json({
      graded: grades.length,
      total: items.length,
      remaining: Math.max(0, items.length - grades.length),
      next_position: items.find((item) => !gradedIds.has(item.id))?.position ?? null,
      pair_split: split.total > 0
        ? { split: split.split, total: split.total, rate: Number(split.rate.toFixed(4)) }
        : null,
      halt: haltRate === null ? null : { rate: Number(haltRate.toFixed(4)), verdict: haltVerdict(haltRate) },
      self_agreement: agreement.total > 0 ? agreement : null,
      can_show_kill: canShowKill({ gradedCount: grades.length, trainingAccepts, trainingRejects }),
      training_split: { accepts: trainingAccepts, rejects: trainingRejects },
      new_construct: newConstructId ? { id: newConstructId, emergent_pole: why.slice(0, MAX_POLE_CHARS) } : null,
      manip,
      idempotent: submission.idempotent === true,
    });
  } catch (error) {
    log.error("grade-sort handler error", { error: error instanceof Error ? error.message : "unknown" });
    return json({ error: "grade_sort_failed" }, 500);
  }
});
