import { describe, expect, it } from "vitest";
import { gateFromStandardVerdicts } from "./measurement-gate.ts";

describe("held-out standard gate", () => {
  it("refuses to call an empty answer a pass", () => {
    expect(gateFromStandardVerdicts([])).toEqual({ gate: "insufficient", scoredCriteria: 0 });
    expect(gateFromStandardVerdicts([{ verdict: "insufficient evidence" } as never]))
      .toEqual({ gate: "insufficient", scoredCriteria: 0 });
  });

  it("lets any enforced break block the item", () => {
    expect(gateFromStandardVerdicts([
      { verdict: "holds" } as never,
      { verdict: "breaks" } as never,
    ])).toEqual({ gate: "breaks", scoredCriteria: 2 });
  });

  it("counts borderline as non-blocking without hiding how many checks ran", () => {
    expect(gateFromStandardVerdicts([
      { verdict: "borderline" } as never,
      { verdict: "holds" } as never,
    ])).toEqual({ gate: "holds", scoredCriteria: 2 });
  });
});

