# G24 R93 seven-role panel verdict

Status: `VETO`

Reviewed commit: `804c69f1a1c282f3ba17daf529f6ce0e55a3a007`

Reviewed tree: `170af78c1794a9e9414cfc03de584c2006ee6a7a`

Parent: `af8d5f3c6b25b090d3e9d4e702076e0eec6a8cf8`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Exact frozen evidence

- Contract blob: `f0f73fac834ffdb977674ffa0f55010037c22451`
- Manifest blob: `ba90bc2f9e1b685e87ca93a8db1aa78de3224ec5`
- Effective-contract blob: `12e90a3663d763d818357ca534b4a5b3b9973c3a`
- Checker blob: `4b59a9e4ec29e7b3d0e72b13dedc63ccf63ad949`
- Materializer blob: `dbfc9b5abbbecbedf1fd02f4293e75fa9f806032`
- Effective-contract SHA-256: `b043b8707f29f29f9d4329cd67464cad4366c7aff2d3a1b2d040402a367c44f2`
- Manifest bundle fingerprint: `d20b03e415c00d6146b36c3ac28a9a68c147186ed4eb5d45f1b4aca85347e03e`
- Authority bundle fingerprint: `a77e914b92aa83c55e5930878d081d4e58b16f5acee3c6d011d369c145ea82c1`

The official R93 suite passed seven source modules, all thirteen predicate/final paths, 212 executable vectors and 301 generated totality probes. The R92 subscription defect and two-owner/two-answer guidance defect are genuinely closed. Fresh exact-byte review nevertheless found that the recovery projection is not total over admitted decision states and its declared schema is not exact.

## Role verdicts

| Durable role | Verdict | Decisive reason |
|---|---|---|
| Human Agency | VETO | A person who owns several missing answers is told to choose one, concealing the remaining actions needed to regain review. |
| Human Comprehension and Access | VETO | Valid same-owner states render grammatically and operationally false guidance such as “Krish must each choose one.” |
| Consequential Leader Value | VETO | The sole next-step projection fails on larger admitted decisions, exactly where decisive recovery guidance matters most. |
| Epistemic Integrity | VETO | The authoritative message contradicts the correctly computed global count and discards per-owner cardinality. |
| Lifecycle, Security and Privacy | PASS | Unique subscription records, independently idempotent handles, copy-safe status returns, blocking, replay and reset boundaries held. |
| Implementation Correctness | VETO | Coverage exercises only the favourable one-answer-per-owner case; repeated obligations per owner fail, and the runtime status has undeclared extra fields. |
| Architecture and Integration Reality | VETO | The contract declares only `status` and `message` while valid runtime output also requires count and owner data, so an exact downstream consumer must reject it. |

## Counterexample 1: repeated obligations are collapsed

`open_preparation` is a valid accepted decision with three Krish-owned answer heads. Withdrawing all three produces:

```json
{
  "status": "replacement_required",
  "message": "3 answers need replacing. Krish must each choose one, then review all changes with Krish.",
  "required_replacements": 3,
  "responsible_humans": ["krish"]
}
```

The structured total is three, but the only human instruction says the one owner should choose one. The same defect exists for two same-owner heads and for larger states where Krish and the leader each own several missing answers. Safety remains intact—review stays unavailable—but the action projection is not truthful or sufficient.

## Counterexample 2: the public status schema is not closed

The correction contract declares:

```json
"current_status_projection_required": ["status", "message"]
```

The valid `replacement_required` runtime value contains four fields. A downstream consumer that correctly enforces the declared exact schema therefore rejects a valid status. Conversely, the checker has no discriminated exact-key contract for replacement versus review/current/not-found states and no executable missing, extra or wrong-type attacks for the richer projection.

## Retained R93 gains

- Listener registrations own unique records and closure-local active flags.
- Registering the same callback twice delivers twice and yields independent idempotent unsubscribe handles.
- Two different owners with one missing answer each receive a correct total and owner list.
- Replacement-first blocking, signed review, replay, reset and later reblocking remain intact.
- Returned status mutation does not mutate internal state.

## Mandatory R94 repair

R94 must repair forward without weakening any retained guarantee:

1. Declare a closed discriminated status schema. `replacement_required` must require exact count, canonical humans and typed per-human obligations; all other variants must have their own exact fields.
2. Group every non-current head by `named_human_id`, preserve each person's exact remaining count and render that distribution plainly.
3. Validate the projection itself, including missing, extra, wrong-type, duplicate-owner, unsorted-owner and mismatched-total attacks.
4. Execute every admitted transition with answer heads, including repeated owners, through zero, partial and complete replacement in forward and reverse order classes.
5. Prove review remains unavailable until every required answer exists, becomes available only then and later reblocks after a subsequent valid change.
6. Keep the R93 listener ownership fix and all earlier causal, identity, baseline, replay and privacy guarantees unchanged.

R75 and the active R77 founder lock remain unchanged. R93 opens no runtime, database, UI, deployment, merge, release or external authority.
