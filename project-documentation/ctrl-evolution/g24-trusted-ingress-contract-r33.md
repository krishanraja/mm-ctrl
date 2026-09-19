# G24 trusted canonical ingress R33

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R33 JSON contract

## What R33 repairs

R33 removes the final receipt fingerprint from every committed result. A server-derived receipt reference and precommit fingerprint are computed only from request, target, proof and authority inputs. The committed result binds that precommit identity. The final receipt fingerprint is computed only after the result triple exists. One explicit dependency graph covers committed and held issuance and is rejected if any fingerprint dependency cycles.

Session hold evidence is stored before its content-addressed hold-row reference is computed. The result then binds the evidence and hold-row reference, and only afterward may the final hold fingerprint bind the result. The complete effective contract rejects reverse evidence-to-result wording that could contradict this order.

Replay now treats one registry row as the sole authority for operation, branch, result and historical response. Held replay additionally resolves the exact hold row. Payload and envelope fields may only copy the canonical ref, byte-hash and fingerprint triples selected by that registry authority. The checker rejects cross-row result, history or hold splicing.

All seventy-five held outcomes bind one server-held timestamp across precommit material, result, final hold row, held registry and replay. The issuer and evaluator nonce rows remain exact, separate projections of the selected dual-proof bundle and resolve through the same receipt evidence, read set and consuming-hold evidence.

## Boundary

R33 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
