# G13 Living Brain R2 rendered QA record

## Target

- **Artifact:** `g13-living-brain-proof-r2.html`
- **Fixture:** `g13-demo-brain-fixture.json`
- **Environment:** local static proof at `http://127.0.0.1:4189/`
- **Identity:** authorised synthetic demo identity for `hello@krishraja.com`; no real authentication account or credential persisted
- **Viewports:** Chromium at 390 × 844 and 1440 × 900
- **Authority:** local fixture, interaction proof, screenshots and Git snapshot only

## Pass contract

The proof must lead with individual development rather than work management, expose how its personal synthesis was formed, render a rich but semantically truthful Brain, and let the user curate a public-safe portrait without performing an external share.

## Result

**Status:** passed locally on 7 September 2026.

- The fixture contains 20 current items, 18 typed relationships, ten sources and three correction records.
- Every item has a valid source reference. Every relationship resolves two canonical items and carries evidence. Every portrait lens resolves canonical item IDs.
- The share portrait allowlist contains only items explicitly marked shareable.
- Both viewports loaded the fixture without a console error, page error, error overlay or horizontal overflow.
- The opening led with the personal becoming synthesis and contained no work queue.
- The earlier, now and becoming movement and all three personal lenses rendered in both viewports.
- The map rendered all 20 canonical nodes and 18 typed relationships. Mobile used a bounded 12-node orientation layer and hid every relationship whose endpoint was outside that layer.
- Selecting a node exposed standing, evidence type, version, audience and its exact typed relationships.
- Evidence view exposed a stable source ID, source assertion and correction history.
- The share preview exposed six allowlisted choices, kept eight private meanings outside the portrait and included no send or publish control.
- Hash-addressed refresh, reduced motion and a practical 42px minimum control target passed.

## Founder approval

**Status:** approved as the governing My Brain product, interaction and visual direction on 7 September 2026.

The founder's unanchored reaction to the reviewed R2 artifact was: "this is awesome!"

The lock applies to this artifact and its reviewed scope. Personal becoming remains the hero; the transparent, explorable Brain remains a useful showpiece; and evidence, standing, version, audience, correction and curated sharing remain structural rather than decorative. R1's sober, work-first hero treatment is superseded, but its truthful evidence, correction and repair mechanics carry forward underneath R2.

- Artifact commit: `03830d6d18c91ad2a495f50cdfe2e61b872ac734`
- Artifact SHA-256: `c00e6609aa7b0f1683097df6d4456944458ab94adc3a44640b83a491fef9b7ab`
- Fixture SHA-256: `02fa968575d7000874f0f10a09123336ad6ec3f7bf373dcd351fbb7e7ef2b1b9`
- Separately gated: production data, real authentication, schema mutation, implementation, deployment and release

## Corrections during QA

1. Map nodes initially used their restrained 16 to 27px visual size as the hit target. The visible dots were retained while their interactive area was raised to 44px. The original and adjacent checks then passed.
2. On mobile, share controls appeared before the portrait and delayed the visual payoff. The portrait now appears first, curation follows, and Refresh preview returns the user to the revised portrait.
3. Canon voice review removed the one banned adjective and moved metadata labels below headings so they do not become heading eyebrows.

## Evidence

- [`evidence/g13-r2-mobile-overview.png`](evidence/g13-r2-mobile-overview.png)
- [`evidence/g13-r2-mobile-map.png`](evidence/g13-r2-mobile-map.png)
- [`evidence/g13-r2-mobile-share.png`](evidence/g13-r2-mobile-share.png)
- [`evidence/g13-r2-desktop-overview.png`](evidence/g13-r2-desktop-overview.png)
- [`evidence/g13-r2-desktop-map.png`](evidence/g13-r2-desktop-map.png)
- [`evidence/g13-r2-desktop-share.png`](evidence/g13-r2-desktop-share.png)

Run again with:

```bash
npm run brain:g13:r2-check -- http://127.0.0.1:4189/g13-living-brain-proof-r2.html
```

## Boundary

The proof validates the representative data shape and rendered interaction only. It does not validate production ingestion, personal inference quality, authentication, persistence, sharing, deployment or real-customer comprehension.
