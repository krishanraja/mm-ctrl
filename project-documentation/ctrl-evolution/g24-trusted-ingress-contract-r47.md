# G24 trusted canonical ingress R47

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R47 JSON contract

## What R47 repairs

R47 makes persisted identity authority singular. The committed target row and committed receipt each use one active R47 formula, and a closed 13-row identity index points every persisted identity kind to its one active authority. The four restart fixtures use those exact formulas. A stale R45 domain, a duplicate identity kind or a parallel active authority is rejected.

R47 also fixes semantic generation order. Every non-derived semantic authority, including schema-change, envelope, hash, resource, specification and identity controls, is finalized before one owned immutable snapshot is captured. The reference registry is then independently regenerated from that snapshot, the owner graph is derived from those exact rows, and only then are content, dependency, transitive, graph and envelope hashes issued. The final registry contains 6,449 exact occurrences across the 220-row authority manifest.

The manifest itself is an independently declared derived target. It cannot appear or disappear from the registry because of object-construction timing, and no semantic source may change after snapshot capture.

## Boundary

R47 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
