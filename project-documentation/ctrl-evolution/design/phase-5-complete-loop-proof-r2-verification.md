# CTRL Phase 5 complete-loop proof R2 verification

**Verification revision:** `RV-002`

**Artifact:** `complete-loop-proof-r2.html`

**Status:** Mechanically verified synthetic product proof awaiting cold founder judgement. This is not production acceptance or implementation authority.

## Intended observable outcome

The prototype must demonstrate a causal product loop rather than a polished composition. A leader's route choice changes CTRL's challenge, correction changes the proposed call, and explicit approval or rejection changes what the Brain retains.

## Runtime evidence

Headless Chromium exercised the current artifact with no console or page errors.

| Check | Result |
|---|---|
| `390 x 844` | No horizontal overflow. Primary action is `52` CSS pixels high. |
| `360 x 800` | No horizontal overflow. Primary action is `52` CSS pixels high. |
| Simulated 200% view at `195 x 422` | No horizontal overflow. Primary action remains `52` CSS pixels high. |
| Simulated virtual keyboard at `390 x 500` | No horizontal overflow. Ordinary vertical scroll preserves access. |
| Route response | Strategy, incentives, capability and uncertain-sequence choices produce distinct challenge, evidence boundary, call, test and Brain proposal content. |
| Accept and keep | The flow reaches `finish`; the Brain count changes from `14` to `15`; the approved principle appears in the final receipt. |
| Correct CTRL | The typed correction replaces CTRL's reading in the proposed call. |
| Resist and skip | The original direction remains provisional, CTRL converts its challenge into a test, and the Brain remains at `14`. |
| Not relevant | The contrast is rejected, the Brain remains at `14`, and no learning step is forced. |
| Editable call and learning | User wording becomes the visible call or approved Brain principle. |

The start, contrast and accepted-finish states were rendered and visually inspected at `390 x 844`. The product proposition is stated before the first action; the evidence boundary remains legible in the contrast; the final state separates the owned decision from the optional Brain change.

## Current artifact hashes

- HTML SHA-256: `b04d9e60044f7d17fea091d959226d2640be391b925ad53be7603a8de4b96943`
- Start render SHA-256: `80c262cd550a53e5dd7715fcf2c69daf9f1b992eb48b195b6dd6cf5e2ff41eaa`
- Contrast render SHA-256: `2153b52d69411ee630a79ffae0c35d5d674ab03f728d95f370fbf8c7dfdef0fa`
- Finish render SHA-256: `4d1ed53bb5eff5fc5b662ea5f2fcb60a59df3e2b5a6eb6786c3532a8a3fad7d3`

## Honest limits

The fixture and branch logic are synthetic and deterministic. They prove interaction structure, state change and the intended trust contract, not LLM quality, retrieval quality, runtime persistence, GitHub export or customer value. Voice uses the browser's local speech-recognition capability where available and falls back to tap and type; no transcript is stored in this proof.

Only cold founder use can decide whether the complete loop now makes the product gaugeable and feels worth returning to. If it still reads as a polished mock without believable intelligence or compounding value, R2 fails and fresh divergence is required.
