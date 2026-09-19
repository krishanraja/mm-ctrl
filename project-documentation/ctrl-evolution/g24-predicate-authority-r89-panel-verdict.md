# G24 predicate authority R89 panel verdict

Status: `VETO`

Date: 2026-09-16

Frozen commit: `828b9fe5042ebd580ddc66ee0dbd3b495c152c44`

Frozen tree: `96caea92f325bb309d155f997b5292b258cee617`

Parent: `f78fb2ab130d26b665c785d4d5934fa27954c4bb`

Effective-contract blob: `2309526d698cea982690b1f9d14f6f6f116a2ccc`

Manifest blob: `e83e9d2edb6f8d8a126e0edce2dde35e21776202`

Contract blob: `d8d296b99ec02d67a2c4bb8efb1cdc75b481f3fc`

Effective-contract SHA-256: `ae5b594cc61a7ad628491d012acc30cf3948cc7c1bc164cde3b8665872e770da`

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Seven-role verdict

| Role | Verdict | Decisive reason |
|---|---|---|
| Correctness and totality | VETO | Withdrawal could emit a revalidation request before any reanswer. |
| Security and adversarial authority | VETO | Valid signatures could authorize an impossible semantic state because signatures substituted for the missing current-answer precondition. |
| Privacy and provenance | VETO | A withdrawn, resolver-missing head was labelled as current and could become durable release provenance. |
| Human agency and accountability | VETO | The machine could ask humans to sign a false recovery claim rather than requiring the decision-bearing replacement answer. |
| Leader value and decision usefulness | VETO | Recovery could become administrative ceremony and reopen work without the information needed to own the call. |
| Humane UX and language truth | VETO | “Using your current answer” was emitted while the authoritative resolver returned `missing`. |
| Systems architecture and integration | VETO | The withdrawal gate was bypassable and the watched dependency baseline did not advance after revalidation, so self-healing worked for only one change cycle. |

## Decisive frozen-byte counterexample

The official R89 suite passed 13/13 paths, 212 vectors and 301 generated probes. A fresh exact-commit probe then executed:

```text
accept final A
→ signed withdrawal of A
→ no reanswer
```

The authoritative head had `standing = withdrawn`; answer resolution was `missing`; the successor correctly returned `predecessor_challenged`. Despite that, `unsignedRevalidationEvents` emitted two complete signable events. Both called the withdrawn fingerprint a current answer head and said work could move again using the current answer. The validator checked exact fingerprints and signatures but never required a current standing or post-withdraw lineage. Trusted humans signing the system-produced payload could therefore close the block without the contractually mandatory reanswer.

## Second-cycle defect

The answer-change listener watched only head fingerprints in the immutable original accepted record. After A was corrected to B and B was revalidated, the original accepted record correctly remained immutable, but no separate active dependency-baseline record made B the newly watched head. A later B to C correction or withdrawal could therefore escape a fresh challenge and block.

## Genuine R89 repairs retained

R89 genuinely repaired the other R88 defects:

- invalid signed append is atomic and emits no listener effect;
- accepted-final records stay byte-identical;
- challenge, block, repair and revalidation records are append-only;
- first-cycle answer correction blocks an actual successor;
- exact accepted retry and revalidation retry are idempotent;
- changed accepted bytes collide;
- duplicate caller receipt IDs cannot alias durable accepted/history IDs;
- withdrawal plus reanswer plus review works on the tested happy path;
- malformed revalidation inputs reject without throwing; and
- all claimed vector groups, including answer-state vectors, execute.

## R90 repair rule

R90 must:

1. bind every challenge directly to route and question;
2. emit no revalidation request unless every challenged dependency resolves to a signed authoritative head with `standing = current`;
3. require a withdrawal challenge to resolve to a strictly post-withdraw current head;
4. repeat those checks independently inside event validation and revalidation consumption;
5. bind head ID, version, sequence, fingerprint and standing into signed revalidation events and resolution records;
6. append a new dependency-baseline record after successful revalidation without mutating the accepted result;
7. watch the latest revalidated baseline so B to C creates a new challenge and block;
8. execute a correctly signed pre-reanswer negative case and a complete two-cycle correction/revalidation sequence;
9. derive accepted request identity from a canonical structured tuple rather than delimiter concatenation; and
10. expose one truthful current human-status projection derived from authoritative state.

Only a unanimous seven-role pass on one exact frozen R90 commit may create a founder-ready receipt. Runtime, database, UI, deployment, merge, release and external authority remain closed.
