# G24 R4 fresh architecture council brief

**Run:** `g24-r4-architecture-council-003`

**Date:** 12 September 2026

**Review mode:** Seven fresh isolated specialist passes, followed by history-aware prosecution, defense and adjudication

**Authority:** Local review records only. No product implementation or external action.

## Read order for sealed Pack A

1. `standard.md`
2. the R1 baseline artifacts when needed to verify inherited ownership
3. the frozen R2 direction and supporting evidence note when needed to detect regression
4. the frozen R3 candidate when needed to distinguish inherited semantics from the R4 amendment
5. the three exact R4 candidate artifacts

Do not read either earlier G24 council folder, `judge-history/`, another specialist's file, builder commentary, founder prediction or chat history during the sealed pass.

## Frozen R4 submission

| Artifact | SHA-256 |
|---|---|
| `project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` |
| `project-documentation/ctrl-evolution/g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` |
| `project-documentation/ctrl-evolution/g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` |

**Review standard SHA-256:** `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b`

## Frozen dependencies

### R1 accepted baseline

| Artifact | SHA-256 |
|---|---|
| `project-documentation/ctrl-evolution/g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` |
| `project-documentation/ctrl-evolution/g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` |
| `project-documentation/ctrl-evolution/g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` |

### R2 frozen direction

| Artifact | SHA-256 |
|---|---|
| `project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` |
| `project-documentation/ctrl-evolution/g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` |
| `project-documentation/ctrl-evolution/g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` |
| `project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` |

### R3 frozen repair dependency

| Artifact | SHA-256 |
|---|---|
| `project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` |
| `project-documentation/ctrl-evolution/g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` |
| `project-documentation/ctrl-evolution/g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` |

## Required sealed output

Each specialist writes only its assigned file and records:

- all checked hashes and whether they match;
- fresh-context and exclusion compliance;
- one verdict from the standard;
- the strongest part it tried to break;
- every applicable criterion as `holds`, `breaks` or `insufficient-evidence` with exact file and section or JSON pointer;
- current-gate defects separately from later-gate watchpoints;
- for every veto, the exact failure path, smallest sufficient repair and resolving test; and
- explicit preservation of all closed external actions.

After all seven outputs exist, they freeze before any history, prior verdict or cross-judge material is loaded.

