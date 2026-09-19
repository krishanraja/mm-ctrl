# G25 persistence mapping R6 QA

Date: 17 September 2026

Verdict: `BLOCKED_PENDING_CONTRACT_REPAIR`

## Evidence inspected

- G16 live Brain workspace and audience canary migration;
- strict Brain AES-GCM helper and ingest replay contract;
- G17 atomic service-adapter contract;
- G24 product and storage architecture;
- current deployment and shared-Supabase boundaries;
- current Supabase changelog, RLS, function and Data API guidance;
- Supabase Postgres guidance for RLS performance, least privilege, constraints, foreign-key indexes, partial indexes and short transactions.

## Confirmed strengths

- The live Brain already has workspace, role, audience, encrypted source, version and evidence structures worth reusing.
- Strict encryption and canonical payload fingerprint helpers exist locally.
- Browser writes are already absent from the dormant G16 substrate.
- R5 correctly separates payload-free history, erasable content, current truth and delivery.

## Valid blockers

- missing workspace in R5 scope;
- divergent audience vocabulary;
- purpose stored but not matched in current read policies;
- opaque rather than typed and versioned dependencies;
- no authenticated-encryption context for prepared-receipt content.

## Bounded claim

A preferred persistence route is now identified, along with the exact reasons it is not migration-ready. No SQL migration, database branch, database call, external write or runtime integration was created.
