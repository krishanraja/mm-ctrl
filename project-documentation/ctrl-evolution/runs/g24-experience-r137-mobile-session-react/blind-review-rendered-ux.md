# R137 independent rendered UX review

## First verdict: VETO

The first rendered implementation fit both required phone sizes and preserved the desktop Decision Table, but it failed integrity and accessibility gates:

1. Sparse, stale and conflicted answers selected evidence to seek, yet the result falsely said `Recommendation holds` as though that evidence already existed.
2. The stale Basis used the ready-state explanation and marked a route as current, contradicting the paused parent state.
3. `Say it instead` showed a toast but supplied no answer.
4. Focus fell to the page body after recalculation and after closing Basis.
5. Important metadata was rendered at 8 pixels.

The reviewer explicitly rejected the argument that these could be treated as mock limitations because they breached named founder-lock and implementation-contract requirements.

## Repair

- Non-ready outcomes now remain qualified and state exactly what the answer did and did not establish.
- Basis title, summary and current-route standing now follow the active data state.
- Browser speech recognition supplies captured text to the answer path, with an explicit unavailable path.
- Focus moves to each replacement turn and Radix Dialog restores it to `Inspect basis`.
- Meaningful metadata is 10 pixels.

## Second verdict: VETO

The four substantive veto classes were closed, but a narrow repair changed the required provenance label from exact `7 linked sources` to `7 sources · 9 Sept`. Both independent reviewers vetoed because `linked` carries meaning and the founder lock required the exact phrase.

## Final repair and verdict: PASS

The footer again displays exact `7 linked sources`, while the as-of date moved to the status line. Direct rendered inspection at 320 by 568 confirmed:

- document and body remain 320 by 568;
- no horizontal, vertical or nested overflow;
- every control remains at least 44 pixels high;
- the final control ends at 556 pixels and the footer at 540 pixels;
- no console errors, failed requests, broken assets or visual clipping.

The reviewer returned final `PASS` and edited no files.

## Limitation

The review used Chromium and synthetic fixture data. Voice was proven with the browser recognition path and a deterministic test double, not a live microphone or external speech provider.
