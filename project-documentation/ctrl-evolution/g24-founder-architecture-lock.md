# G24 founder architecture lock

**Date:** 12 September 2026

**Decider:** Krish Raja

**Source revision:** `9fdca0aaae479a6c3e0b896f712fca8b54b2e23e`

**Decision:** Krish explicitly approved both the exact G24 R1 through R5 architecture chain and the separate bounded local headless Crossing build.

**Final call:** "yes to both"

## Architecture bytes locked

| Revision | Artifact | SHA-256 |
|---|---|---|
| R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` |
| R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` |
| R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` |
| R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` |
| R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` |
| R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` |
| R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` |
| R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` |
| R4 | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` |
| R4 | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` |
| R4 | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` |
| R5 | `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` |
| R5 | `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` |
| R5 | `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` |

Council clearance: `runs/g24-r5-architecture-council-004/adjudication.md` at SHA-256 `006c1816d5bc754792c16fb85d183f4d626b98112f9395e5d6ec964f9be72f1f`, final status `CLEAR_FOR_FOUNDER_LOCK`.

## Authority granted

The architecture lock makes the exact R1 through R5 chain the governing G24 architecture.

The separate build approval authorises:

- local headless Crossing implementation;
- adversarial, quiet, stale, sparse and unrelated-lineage fixtures;
- deterministic validators and tests;
- local repository documentation and commits; and
- correction of failures inside the locked architecture.

## Authority still closed

This decision does not authorise:

- customer-facing UI work;
- customer data or account creation;
- external research or model spend;
- Supabase branch, migration or production database changes;
- email, customer contact, session scheduling or session capture;
- connectors or external service mutation;
- deployment, feature enablement, merge or release; or
- legacy backend deletion.

## Protected implementation boundary

The build must preserve one canonical Brain, human-owned purpose and judgement, the exact named-leader Release authority, the complete controlling dependency lineage, one five-output selector, one versioned intervention atom and the separation of relationship lifecycle from permission and Release.

The headless build proves deterministic semantics only. It cannot prove customer comprehension, visual magic, real-world decision lift, model intelligence, production atomicity, delivery, commercial value or a safe legacy cutover.

## Revisit trigger

Reopen this lock only if implementation produces a credible conforming case that the R1 through R5 chain cannot decide safely, or if a later named proof gate falsifies an inherited product or authority assumption. Ordinary implementation choices do not reopen the architecture.
