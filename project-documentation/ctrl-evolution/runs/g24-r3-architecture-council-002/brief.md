# G24 R3 fresh architecture council brief

**Run:** `g24-r3-architecture-council-002`

**Date:** 12 September 2026

**Review mode:** Seven fresh isolated specialist passes, followed by history-aware prosecution, defense and adjudication

**Authority:** Local review records only. No product implementation or external action.

## Read order for sealed Pack A

1. `standard.md`
2. the R1 baseline artifacts when needed to verify inherited ownership
3. the frozen R2 direction and evidence note when needed to detect regression
4. the three exact R3 candidate artifacts

Do not read `runs/g24-r2-architecture-council-001/`, `judge-history/`, another specialist's file, builder commentary, founder prediction or chat history during the sealed pass.

## Frozen R3 submission

| Artifact | SHA-256 |
|---|---|
| `project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` |
| `project-documentation/ctrl-evolution/g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` |
| `project-documentation/ctrl-evolution/g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` |

**Review standard SHA-256:** `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`

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
