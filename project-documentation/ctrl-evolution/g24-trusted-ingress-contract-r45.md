# G24 trusted canonical ingress R45

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R45 JSON contract

## What R45 repairs

R45 closes the remaining restart identity gaps in R44. Fingerprints are derived from the selected schema and actual payload, never from caller-supplied fingerprint metadata. The payload's native fingerprint, persisted artifact fingerprint, wrapper parsed-content fingerprint and declared derivation evidence must all agree.

The committed path now keeps three different identities separate. The submitted target intent remains a content-addressed input. The server-materialized target row carries server time, authority order, a row-version identity and its own fingerprint. The final committed receipt is a distinct authoritative row, backed by the ordinary proof's nonce-consumption receipt and bound to the result, proof, partition head and authority order.

Forty-seven artifacts across four restart classes are stored under exact branch role sets. Seventy-eight selected-lineage references must each resolve exactly once, including their companion byte hashes and fingerprints. Two hundred and thirty-four correlation rows bind the same evidence across restart and replay.

## Boundary

R45 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
