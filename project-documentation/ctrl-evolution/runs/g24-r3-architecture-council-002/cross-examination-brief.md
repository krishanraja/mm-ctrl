# G24 R3 history-aware cross-examination brief

**Stage:** Pack B historical calibration and Pack C adversarial challenge

**Precondition:** Seven Pack A verdicts are frozen in `sealed-verdicts.json` before this file is used.

**Authority:** Local review records only. Do not edit the frozen standard, submission, specialist verdicts or judge histories. Do not implement a repair or take an external action.

## Fixed inputs

- `standard.md` at `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`
- `sealed-verdicts.json` at `e79e4353d85387710ddf8b239ca68a150fbdc155fae68ca4f692fffddd19ee87`
- the three R3 submission hashes recorded in both files
- all seven specialist verdicts at the hashes in `sealed-verdicts.json`
- the seven durable judge histories at the hashes below
- the prior R2 adjudication only to test whether R3 actually repaired the previously narrowed defects

## Frozen historical calibration

| History | SHA-256 |
|---|---|
| `judge-history/human-agency.md` | `84e1f9d750b5dff7b144e18f019275a047eae0597eca470675c14f6a9088cd2b` |
| `judge-history/epistemic-integrity.md` | `78e81bcc8090baab9569950ec1639ce2568513f6023268ee994d787005538d3c` |
| `judge-history/subject-audience-lifecycle-safety.md` | `fc1baa3f5277fba7b3de6e047456445179aad2dee0cf0d0c2d1f1c3e570d9a21` |
| `judge-history/consequential-usefulness.md` | `02e5d12ea6c4d05066a89f305a267e2f5c789e078e1de04c7b10d1fb465f1c9e` |
| `judge-history/living-brain-integrity.md` | `25e4c84a3352ede838e326a499cafe9e75a4ff037c0c10c2d432e62adf119573` |
| `judge-history/human-comprehension-and-access.md` | `a674845dc23be23538a8e8c9ba4b3864282955006d64a03ceba962ccbe11ec79` |
| `judge-history/behavioural-and-implementation-reality.md` | `5d55b9e87a8437999e5ee81af02ac7ce453b310a4ea2c4876d53da2e253f1c06` |

**Prior R2 adjudication SHA-256:** `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b`

## Standards Prosecution

Cross-examine every specialist result. Try to reproduce each veto from the exact artifact, challenge each pass at its strongest boundary and detect inconsistent gate scope, locators, failure paths, resolving tests or history. Collapse overlapping findings to root causes. Do not turn an important later proof need into an architecture veto. Recommend `CLEAR`, `REPAIR` or `STOP`, with the smallest sufficient repair set.

Write only `standards-prosecution.md`.

## Independent Veto Defense

Argue the strongest honest case that each veto is already resolved, outside G24.A, redundant with R1 or too broad. Also attack whether any pass overlooked a real current-gate defect. Preserve valid vetoes that survive the defense and narrow them to the smallest semantic repair. Recommend `CLEAR`, `REPAIR` or `STOP`.

Write only `veto-defense.md`.

## Final adjudication after both freeze

The adjudicator must validate hashes and locators, compare the two adversarial cases against the standard and issue one result: `CLEAR_FOR_FOUNDER_LOCK`, `BLOCKED_PENDING_REPAIR` or `STOP_RETHINK`. No majority vote can defeat a valid veto. A block must state the smallest sufficient repair, protected strengths and identical recheck tests. A clear result cannot claim implementation, usability or efficacy proof.

