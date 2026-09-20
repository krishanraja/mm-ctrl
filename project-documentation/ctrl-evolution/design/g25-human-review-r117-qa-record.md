# G25 human review R117 QA record

Status: local and independent proof passed; durable public preview replacement pending
Date: 2026-09-19
Authority: local proof and non-production preview only

## Proof boundary

This is a static, synthetic interaction proof over the R116 owner-gate packet shape. It does not read or write Supabase, change a Brain standard, create an account, publish work, deploy a customer feature or alter production. Every apparent state transition is held in the browser and disappears on reload.

## Acceptance target

A leader should be able to answer four questions from the first mobile view:

1. What rule is being proposed?
2. What will it change in practice?
3. Who is allowed to decide?
4. Where can I inspect the evidence before deciding?

The deeper layer must then expose the exact current rule, exact proposed rule, two concrete sources, another possible explanation and the reversal limit without adding a second navigation system.

## Local verification

| Check | Result |
|---|---|
| Static copy, authority, disclosure and accessibility contract | Pass |
| 320x568 ready view | Pass, no horizontal or vertical overflow |
| 390x844 ready view | Pass, no horizontal or vertical overflow |
| 1280x720 ready view | Pass, no horizontal or vertical overflow |
| 1440x900 ready view | Pass, no horizontal or vertical overflow |
| All interactive controls | Pass, at least 44px |
| Evidence disclosure | Pass, exact before and after wording, evidence, countercase and reversal shown |
| Keyboard containment | Pass, modal focus trap, Escape close and focus restoration |
| Human choice | Pass, one inline saving state and focused result; no second loader |
| Reversal | Pass, explicit confirmation before the previous rule is restored |
| Failure states | Pass, rejected, stale, error and loading remain non-deceptive |
| Long wording | Pass, exact wording must be reviewed before approval; natural vertical scroll only |
| Reduced motion | Pass, animations disabled through the user preference query |
| Browser console | Pass, no warning or error observed in local rendered review |
| Independent final review | Pass after repairing persistent mobile close access and plain reversal wording |

Focused browser acceptance executed seven tests across the four named viewports. The long fixture uses natural vertical scroll at 320x568; the normal decision does not.

## Copy and visual review

- The first screen contains one question, one exact rule, one consequence, one evidence route, one ownership sentence and two choices.
- The concrete case uses fictional proposal amounts and delays. It is explicitly labelled synthetic and does not imply a claim about a real person.
- The page uses the Mindmaker icon without the obsolete wordmark.
- The surface remains dark, quiet and instrument-like. Evidence notches carry meaning because there are exactly two visible sources behind them.
- One duplicate synthetic disclaimer discovered during the final visual pass was removed before founder review.
- The evidence header and 44px close control remain visible at maximum mobile scroll.

## Frozen local identity

| File | SHA-256 |
|---|---|
| `public/g25-human-review-r117.html` | `425ef7dd7dc84e47d791785f8276e194b24fde791e8c11019730d6efa1c2d754` |
| `public/g25-human-review-r117.css` | `4fd84d9b7d438c810ffbfb433e1cc43d8039f9f9e43951a8b6c9dfd9f889986f` |
| `public/g25-human-review-r117.js` | `273ddccb049a031567f98bd59bbfc9fd77dce7720e8f6a3718ea5f29b9ada1c8` |

The [independent verdict](g25-human-review-r117-independent-verdict.md) records the initial veto, repair and fresh pass.

## Retired temporary verification

- Deployment: `dpl_FVDufLTy8Af17gPvw6rRh597ZSac`
- State: `READY`
- URL: `https://temporary-instant-ochre-to6qkmc.vercel.app/g25-human-review-r117.html`
- Standing: anonymous temporary Vercel deployment, unlinked to the mm-ctrl project and scheduled to expire after 60 minutes
- Exact-byte check: all three frozen artifact hashes matched the remote response
- Remote browser result: seven of seven focused tests passed

The temporary deployment contained only the already-built static output and created no change to the linked Vercel project or production. It is retired as a founder-review route because anonymous Vercel deployments expire and did not open reliably on a second device.

## Unproved

This proof does not establish that the proposed rule is a valuable real-world learning, that the R116 packet is sufficient for every leader, that notification timing is correct, or that customers will trust the interaction. It also does not prove live authentication, persistence, concurrency or database repair. Those claims require separate product and founder gates.

## Next gate

Publish the exact committed proof through a durable public route, verify it as a logged-out visitor and present it cold for Krish's first reaction. Product implementation remains closed until that reaction is recorded.
