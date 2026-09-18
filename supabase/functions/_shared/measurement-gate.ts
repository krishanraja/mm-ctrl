import type { ScoredVerdict } from "./critique-core.ts";

export type MeasurementGateVerdict = "holds" | "breaks" | "insufficient";

/**
 * Collapse criterion-level Standard-lens answers into the one gate answer used
 * by the confusion matrix. A borderline does not block, because the gate did
 * not stop the work. An absent or wholly unpointed answer is not a pass.
 */
export function gateFromStandardVerdicts(
  verdicts: readonly Pick<ScoredVerdict, "verdict">[],
): { gate: MeasurementGateVerdict; scoredCriteria: number } {
  const scoreable = verdicts.filter((row) =>
    row.verdict === "holds" || row.verdict === "borderline" || row.verdict === "breaks"
  );
  if (scoreable.some((row) => row.verdict === "breaks")) {
    return { gate: "breaks", scoredCriteria: scoreable.length };
  }
  if (scoreable.length > 0) return { gate: "holds", scoredCriteria: scoreable.length };
  return { gate: "insufficient", scoredCriteria: 0 };
}

