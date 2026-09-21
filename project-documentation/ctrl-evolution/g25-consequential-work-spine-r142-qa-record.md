# G25 consequential-work spine, R142 QA

## Executed proof

- Disposable PostgreSQL 18.3 canary completed successfully.
- Fourteen new record families rolled back to zero residue.
- All foreign-key leading columns have supporting indexes.
- One complete decision advanced from version one to version two. Across both versions, six routes, eight decision-changing questions and twenty-four evidence links resolved to fifteen immutable content-addressed evidence atoms, including separately sourced human prior, answer, owned-call and outcome records; the predecessor became superseded; two exact seal events, one replacement event, one authorised owned-call event, two case-opening events, one answer event and one outcome event remained.
- Ordinary authenticated raw table access and seal execution remained unavailable.

## Causal mutation controls

The same test was rerun against ninety-three deliberately weakened candidates. Every weakened candidate failed for the intended reason:

1. exact route-count check removed;
2. question-evidence requirement removed;
3. authority-expiry check removed;
4. freshness check removed;
5. authority-to-snapshot binding removed;
6. replay watermark binding removed;
7. replay idempotency binding removed;
8. predecessor scope reduced to a bare version ID;
9. answer ciphertext guard removed;
10. owned-call authority guard removed;
11. sealed-version requirement for an owned call removed;
12. raw service-role audit-event insertion restored;
13. current-first human-prior insertion removed;
14. current-first owned-call insertion removed;
15. call-before-authority chronology check removed;
16. future-dated call check removed; and
17. both pre-sealed-insert defences removed;
18. current-predecessor requirement removed;
19. sequential-version requirement removed; and
20. atomic predecessor-supersession transition removed; and
21. durable exact replay after supersession removed;
22. analysis-to-authority chronology removed;
23. human-prior-before-analysis-generation gate removed;
24. route-to-authority chronology removed;
25. question-to-authority chronology removed; and
26. evidence-link-to-authority chronology removed;
27. snapshot timestamp canonicalisation removed; and
28. owned-call timestamp canonicalisation removed;
29. case-opening receipt producer removed;
30. answer receipt producer removed;
31. outcome receipt producer removed;
32. case-opening chronology guard removed;
33. current sealed-analysis requirement for answers removed;
34. answer-after-question chronology guard removed;
35. future-dated answer guard removed;
36. outcome-after-call chronology guard removed;
37. outcome-observed-before-recorded chronology guard removed; and
38. future-dated outcome guard removed; and
39. event-type idempotency namespace removed;
40. revocation-actor guard removed;
41. revocation-after-authority chronology guard removed;
42. future-dated revocation guard removed;
43. late-backdated revocation of a used seal authority allowed;
44. late-backdated revocation of a used owned-call authority allowed;
45. owned-call authority-to-analysis-seal chronology guard removed; and
46. answer-to-analysis-seal chronology guard removed;
47. predecessor sealed-snapshot binding removed; and
48. successor-authority-after-predecessor-seal chronology removed; and
49. exact-one working-recommendation requirement removed;
50. leader-answerable question-kind requirement removed;
51. operator-research answer-mode refusal removed; and
52. asked-question state requirement removed;
53. prior-decision self-reference refusal removed;
54. exact accepted prior-version requirement removed;
55. frozen evidence-atom digest removed from the decision snapshot;
56. referenced-assertion immutability removed;
57. referenced-source immutability removed;
58. legitimate unreferenced-assertion update pass-through removed; and
59. legitimate unreferenced-source update pass-through removed;
60. the human prior's frozen source atom removed from the sealed snapshot;
61. the owned call's frozen source atom removed from the authority digest;
62. the answer's frozen source atom removed from its receipt;
63. the outcome's frozen source atom removed from its receipt;
64. human-prior assertion-reference protection removed;
65. answer assertion-reference protection removed;
66. owned-call assertion-reference protection removed;
67. outcome assertion-reference protection removed;
68. human-prior source-reference protection removed;
69. answer source-reference protection removed;
70. owned-call source-reference protection removed; and
71. outcome source-reference protection removed;
72. future source-capture refusal removed;
73. future source-recording refusal removed;
74. future assertion-recording refusal removed;
75. evidence-atom causal timestamps removed from the atom digest;
76. human-prior source chronology removed;
77. evidence-link source chronology removed;
78. answer source chronology removed;
79. owned-call source chronology removed;
80. outcome source chronology removed;
81. seal authority after evidence provenance removed; and
82. seal authority after active-prior provenance removed; and
83. compatible source/assertion snapshot locks replaced by deadlock-prone exclusive locks;
84. stable content-identity conflict reuse removed; and
85. exact JSON collision validation removed from conflict reuse;
86. locked source/assertion row-version stability removed;
87. expected pre-wait source/assertion row-version binding removed from materialisation; and
88. the answer's pre-version-wait provenance binding removed; and
89. the human prior's pre-version-wait provenance binding removed; and
90. universal fail-fast provenance locking removed; and
91. universal fail-fast atom-identity locking removed;
92. universal fail-fast governing-version admission removed; and
93. foreign-key-compatible authority locking replaced by a lock mode that can block PostgreSQL's own key-existence check; and
94. the owned-call pre-FK governing-version `FOR SHARE NOWAIT` boundary replaced by a blocking shared lock.

The canary also proves that the first version's exact seal request still replays after version two supersedes it. Every evidence link materialises the exact encrypted assertion and source provenance into an immutable atom, and the snapshot binds both the atom identity and digest. After sealing, direct service-role attempts to rewrite or delete the referenced assertion and its source all fail, the frozen atom still exposes the exact authorised bytes, and exact replay remains valid. That first seal deliberately uses the exact internal key needed by the later supersession event; version two still seals because receipt identity is namespaced by event type. It removes the sole recommendation from an otherwise complete three-route analysis, binds authority to those exact bytes and proves the seal is refused until exactly one route is recommended. It directly stages a supposed starting view after analysis generation and proves the seal is refused until the active human prior genuinely predates or coincides with generation. It tries to cite the current decision as its own precedent and separately cites a draft version of another decision; both are refused. A prior-decision question now carries the exact prior version, and the current snapshot includes that version ID and its sealed digest. A dedicated causal fixture creates successor authority while its predecessor remains draft, seals the predecessor, proves the successor digest changed because it binds the predecessor's sealed snapshot and then rejects both the premature authority and a fresh valid-digest authority backdated one microsecond before the predecessor seal. UTC and Pacific/Auckland produce the same snapshot and owned-call digests, and authority created under UTC seals successfully under America/New_York. Case, answer and outcome writes produce exact independently recomputed receipt hashes while raw application-role event writes remain denied. It independently rejects authority that predates the analysis, routes, questions or evidence links. It separately refuses a subject answer to a Brain-research question, a leader-kind question routed to operator research, a proposed question and a suppressed question; only the exact asked leader question produces an answer receipt. It directly rejects an expired authority event, a revocation by the operator, a revocation before its authority, a future-dated revocation, late backdating against a committed seal, late backdating against a committed owned call, a changed replay, cross-decision lineage, a successor of a draft predecessor, a skipped version, a call against a draft analysis, a prior born superseded, a call born challenged, owned-call authority before the analysis seal, a call before the analysis seal, a call before its authority, a future-dated call, a future-opened case, an answer against a superseded analysis, an answer before the analysis seal, an answer before its question, a future-dated answer, an outcome observed before its call, an outcome recorded before observation, a future-dated outcome, an outcome recorded by the operator rather than the subject, a fabricated raw audit event, a raw service-role seal update, post-seal mutation, authority-history mutation, case-identity mutation and plain-text answer storage.

The same post-seal proof updates one unreferenced assertion and source and requires both changes to persist. Four dedicated assertions, used only by the human prior, answer, owned call and outcome respectively, each refuse both update and deletion; their four sources do the same. The shared immutability guard therefore protects consequential provenance without silently disabling legitimate legacy updates elsewhere.

The causal-provenance proof independently refuses a future source capture, future source recording and future assertion recording; proves changing atom materialisation or watermark bytes changes its digest; rejects backdated human prior, evidence link, answer, owned call and outcome records; and corrupts legacy fixtures inside rollback-only savepoints to prove the seal still rejects authority before either evidence or active-prior provenance. The final positive canary counts remain unchanged.

## Security interpretation

This proves relational and transition integrity for the bounded storage design. It does not claim that a syntactically valid envelope was cryptographically produced by the intended key, nor that a service-role insertion proves the named human acted. Those claims require the future encryption producer and narrow authenticated writer gates.

## Blind adjudication

The review chronology below records each repair as it stood when found. Its sixteenth-review blocking ordinary-path design was superseded by a seventeenth exact-byte review: inverse ordinary multi-atom batches—X then Y against Y then X—proved that transaction-scoped blocking advisory locks could deadlock across identities. An eighteenth exact-byte review then used four distinct assertions across two versions and proved that blocking governing-version locks could deadlock V1→V2 against V2→V1 even after every provenance and atom identity was unique. A nineteenth review then showed that owned-call admission still read the governing version only in an after-insert guard: PostgreSQL could satisfy its foreign-key wait after a successor committed without re-evaluating the stale standing read. The final rule is universal fail-fast acquisition at provenance, atom identity and every governing-version boundary, including a before-insert owned-call gate. Authority rows use `FOR NO KEY UPDATE NOWAIT`, retaining mutual exclusion without blocking PostgreSQL's foreign-key `KEY SHARE`. Controls 90 through 94 pin these boundaries. The expanded [R143 concurrency proof](g25-consequential-concurrency-r143-qa-record.md) exercises twenty-two schedules, including both owned-call/successor orderings. Fresh blind re-adjudication remains required.

The first fresh adversarial review found a two-session standing-check race that the one-connection PGlite canary could not exercise. The candidate locked the governing version row before draft-child and answer standing checks. A second exact-byte review then found that a service-role caller could consume authority, later insert a revocation and backdate it to before that committed use. The candidate now locks the same authority row for revocation, sealing and owned-call admission and rejects a revocation effective at or before an existing use. A third review found that authority for a successor could be recorded while its predecessor was still draft. The successor digest now binds the exact predecessor seal, and successor authority must follow that seal. A fourth review found that the unique recommended-route index enforced at most one recommendation but sealing did not require one. Seal admission now requires exactly one recommended route, and the direct zero-recommendation test plus its mutation control prove the rule is causal. A fifth review found that a human prior recorded after analysis generation could still be presented as the leader's starting view. Seal admission now requires the active prior to exist no later than generation, and a direct post-generation-prior attack plus its mutation control prove the rule is causal. The older authority-after-prior predicate was removed because the stronger causal order makes it redundant: prior precedes generation, and authority follows generation. A sixth review found that any question, including Brain/operator research or an unasked question, could be falsely receipted as a human answer. Answer admission now independently binds human-answerable kind, non-research mode and asked state. Four direct attacks and three mutation controls prove the repair without collapsing those meanings into one opaque predicate. A seventh review found that a first-version prior-decision match could cite its own bare case without an accepted prior version. The question now binds an exact version and its sealed digest; seal admission rejects self-reference, draft or challenged precedent and any version accepted after current analysis generation. Two direct attacks and two mutation controls prove those distinct gates. An eighth review rewrote a referenced assertion after sealing and proved the old snapshot still validated because it bound only the assertion ID. Every link now creates an immutable evidence atom containing exact encrypted assertion content and source provenance, the snapshot binds the atom digest, the application role cannot forge atoms, and referenced source or assertion rows cannot be rewritten or deleted in place. Four direct post-seal rewrite/delete attacks and three new causal mutations prove that repair. A ninth review then performed the same rewrite against the human prior and exposed bare mutable assertion IDs in the prior, answer, call and outcome families. Each family now resolves a frozen atom under source/assertion locks; the prior seal, call authority, answer receipt and outcome receipt bind its ID and digest; and all four families participate in the shared immutability guards. Sixteen direct family-specific rewrite/delete attacks and twelve new causal mutations prove the extension. A tenth review showed that exact immutable bytes could still be causally impossible when a source carried a future capture time. Atom materialisation now rejects future source/assertion timestamps, atom identity binds its own materialisation and causal watermark, and every consequential consumer plus both authority paths must follow that watermark. Three direct future-timestamp attacks, one exact hash-binding check, seven consumer/authority controls and eleven new mutations prove the repair locally. An eleventh review reproduced concurrent duplicate atom creation and the resulting unusable valid call authority. Exclusive source-then-assertion locks initially closed that race. A twelfth review then proved those exclusive locks created a supported cross-assertion deadlock when one service transaction legitimately updated an unreferenced assertion B before materialising it while another held the shared source and later materialised B. The repair restores compatible snapshot locks, adds a stable unique content identity, uses conflict-safe reuse under an explicit `READ COMMITTED` boundary, and validates both digests and exact JSON before returning the committed winner. A thirteenth review then showed that a waiter could read provenance updated after its statement began and still stamp those bytes with the older statement timestamp; answers could wait on the version before their atom trigger even performed its first provenance read. That repair bound materialisation to exact raw source/assertion row versions and moved answer provenance preflight ahead of the version wait. A fourteenth review found the same ordering hole in human-prior admission because its generic draft guard still locked the version before provenance was first inspected. Human priors now use a dedicated admission guard that preflights provenance, locks and verifies the draft version, then materialises only against the exact expected row versions. A fifteenth review inverted the repaired ordering and found that a prior could hold the governing version while waiting on provenance whose updater later needed that version for a valid evidence link. Expected-version materialisation now uses compatible `FOR SHARE NOWAIT` locks and returns an explicit retry signal; ordinary materialisation retains blocking compatible locks for exact convergence. A sixteenth review found that a prior could pass those row checks yet still wait on an uncommitted duplicate atom identity while holding the version. A seventeenth review then proved that retaining a blocking ordinary identity path merely moved deadlock to reverse multi-atom batches, so every identity path now try-locks. An eighteenth review proved that blocking governing-version locks could still form the same cycle across two versions despite four distinct evidence identities. All governing version acquisition is now fail-fast, and authority acquisition uses fail-fast `NO KEY UPDATE` so foreign-key validation remains compatible. Controls 83 through 93 pin stable identity, exact collision checks, all three row-version boundaries and every fail-fast or compatibility boundary. The expanded [R143 concurrency proof](g25-consequential-concurrency-r143-qa-record.md) passed all twenty schedules against the repaired exact bytes on isolated PostgreSQL 17.6, including both reverse-order batch classes. An independent readback returned every candidate object and fixture to zero. Fresh blind re-adjudication remains required.

The nineteenth review supersedes the final state described at the end of the preceding chronology: owned calls now acquire `FOR SHARE NOWAIT` on their governing version in a before-insert trigger, before foreign-key checks can wait. The dedicated mutation control and both call/successor race directions pin that boundary.

## Operational boundary

R142 did not create a persistent migration. R143 transiently applied its exact candidate and fixtures to isolated target `cgkcplcamsijghalintq`, passed twenty-two two-session schedules and removed all candidate state. Production `bkyuxvschuwngtcdhsyg` remained closed.
