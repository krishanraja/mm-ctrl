# G25 prepared-intelligence caller inventory, R34

R34 establishes that there is no live application caller to cut over.

The prepared-intelligence implementation is still correctly dormant. Its producer, receipt, authority, custody and encryption modules live under `_shared`; its database objects live under `supabase/candidates`; and its executable evidence lives in local harnesses. No browser source or Edge Function entrypoint imports those modules or calls either the old or new database functions. No migration contains the candidate objects.

## Why this matters

“Switch the callers” implies that a runtime path already exists. It does not. Pretending otherwise would encourage an accidental half-integration or a browser-level RPC call before the server authentication, purpose, consent, encryption-key and observability boundary is designed.

The right eventual move is one new server-owned adapter against only the four final capabilities: custody create, both-generation correction, both-generation erasure and unified current read.

## Executable drift guard

The R34 checker scans browser source and every Edge Function entrypoint for all seven old and new database function names. It separately scans for imports of seven dormant prepared-intelligence modules and scans every committed migration for candidate objects. Any new reference fails the gate until a separately reviewed runtime-integration decision updates this contract.

The checker also pins every dormant module by hash. This stops a caller-free inventory from masking unreviewed changes inside the machinery itself.

## Boundary

R34 proves absence of application integration in the current tree. It does not prove that an external caller does not exist, create an adapter, author a migration, execute a concurrent transaction, establish Supabase parity or authorise runtime use.
