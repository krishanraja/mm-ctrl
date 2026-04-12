/**
 * Supabase-integrated guardrail wrapper. Loads training material, delegates
 * the decision logic to guardrails-core (pure TS), and writes rejections to
 * fact_extraction_log.
 *
 * All callers (extract-user-context and any future writer) MUST route
 * through this function before inserting into user_memory.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadGlobalTraining } from "./training-loader.ts";
import {
  runGuardrailsPure,
  mapPreferenceSubtype as mapPreferenceSubtypeCore,
  applyTypographyRulesCore,
  findBannedPhrasesCore,
  stripBannedPhrasesCore,
} from "./guardrails-core.ts";
import type {
  IncomingFact,
  GuardedFact,
  RejectedFact,
} from "./guardrails-core.ts";
import type { TrainingMaterial, PreferenceSubtypeKey } from "./training-schema.ts";

export type { IncomingFact, GuardedFact, RejectedFact } from "./guardrails-core.ts";

export interface GuardrailResult {
  kept: GuardedFact[];
  rejected: RejectedFact[];
  training_version: number;
}

export async function runGuardrails(
  facts: IncomingFact[],
  userId: string | null,
  sessionId: string | null,
  supabase: SupabaseClient
): Promise<GuardrailResult> {
  const training = await loadGlobalTraining(supabase);
  const { kept, rejected } = runGuardrailsPure(facts, training);

  if (rejected.length > 0 && userId) {
    try {
      const rows = rejected.map(r => ({
        user_id: userId,
        session_id: sessionId,
        raw_fact: r.fact,
        reason_id: r.reason_id,
        reason: r.reason,
        training_material_version: training.version,
      }));
      await supabase.from("fact_extraction_log").insert(rows);
    } catch (e) {
      console.warn("fact-guardrails: failed to log rejections", e instanceof Error ? e.message : e);
    }
  }

  return { kept, rejected, training_version: training.version };
}

export function mapPreferenceSubtype(value: string, training: TrainingMaterial): PreferenceSubtypeKey | null {
  return mapPreferenceSubtypeCore(value, training);
}

export function applyTypographyRules(text: string, training: TrainingMaterial): string {
  return applyTypographyRulesCore(text, training);
}

export function findBannedPhrases(text: string, training: TrainingMaterial): string[] {
  return findBannedPhrasesCore(text, training);
}

export function stripBannedPhrases(text: string, training: TrainingMaterial): string {
  return stripBannedPhrasesCore(text, training);
}
