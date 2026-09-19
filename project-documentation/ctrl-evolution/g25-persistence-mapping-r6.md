# G25 persistence mapping, R6

Status: `blocked_pending_scope_dependency_and_purpose_repairs`

Machine record: [g25-persistence-mapping-r6.json](g25-persistence-mapping-r6.json)

Input: [G25 receipt-store state machine R5](g25-receipt-store-state-machine-r5.md)

Verification: [G25 persistence mapping R6 QA](g25-persistence-mapping-r6-qa-record.md)

## Verdict

R5 is a useful lifecycle model, but it is not yet safe to translate into a Supabase migration. The mapping review found five material gaps that need local contract repair first.

This is not a rejection of the prepared-intelligence architecture. It prevents a plausible-looking schema from creating a second Brain or widening access quietly.

## Five blockers

### 1. Workspace is missing

The live Brain is workspace-scoped because one person may participate in personal, company and project contexts. R5 binds owner and subject but not `workspace_id`. Persistence must include workspace in every receipt, event, dependency, projection, encryption context and read.

### 2. The audience vocabularies diverge

R2 through R5 use `customer_private` and `operator_private`. The live Brain uses `person_private` and `delivery_team_private`. The database must have one vocabulary. Friendly presentation labels may map at the adapter, but storage and policy use the canonical Brain terms.

### 3. Purpose is stored but not enforced in current Brain reads

`brain_audience_grants` stores a purpose and describes itself as purpose-bound. The current SELECT policies compare workspace, user and audience, but do not compare the grant purpose to the content row's purpose. A prepared-intelligence store cannot rely on that boundary until exact purpose mismatch is proven to fail.

This is a canary finding, not authority to alter production RLS.

### 4. Dependencies are opaque

Strings such as `brain:decision-14` are useful local fixtures, not durable correction authority. Persistence needs typed, version-bound references to the exact Brain item version, decision case, decision claim or external source receipt that affected selection.

### 5. Encryption context has no prepared-receipt kind

The strict Brain cipher correctly binds supported record and field kinds. It currently has no `prepared_receipt` and `payload` context. Calling a receipt a generic source would weaken semantics; storing it unbound would weaken cryptographic custody.

## Preferred future shape after repair

Extend the canonical Brain substrate rather than creating an intelligence database beside it:

- a Brain-owned receipt envelope with encrypted content and exact scope;
- typed dependency rows with real foreign keys wherever the target table is known;
- payload-free append-only events;
- an optional disposable prepared-object cache bound to exact receipt IDs;
- existing read, audio, email and export organs as delivery modes only.

The write boundary should be one short `security invoker` transaction callable only by a narrowly granted backend role. External research, model work and encryption happen before the transaction. Exact replay converges; conflicting replay rolls back completely.

The read boundary must use a non-anonymous user-scoped client and prove active membership plus exact audience and purpose before server-side decryption. Browser roles receive no write grant.

## Supabase checks applied

Current Supabase guidance reinforces four parts of the proposal:

- new public-schema tables require explicit grants for Data API exposure, separately from RLS;
- multi-tenant tables need enabled and forced RLS plus indexed policy columns;
- database functions are executable by `PUBLIC` by default unless revoked;
- `security invoker` is preferred, with short transactions and no external calls while locks are held.

References: [Supabase changelog](https://supabase.com/changelog?types=breaking-change), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Functions](https://supabase.com/docs/guides/database/functions), [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

## Rejected shortcuts

- **Put receipts in `brain_sources`:** currently loses semantic precision and inherits incomplete purpose enforcement.
- **Treat `briefings` as canonical:** confuses a delivered artifact with the truth that produced it.
- **Build an independent store:** duplicates Brain tenancy, correction, retention and erasure policy.
- **Let service role reads define access:** bypasses the user-scoped RLS boundary the G17 contract deliberately required.

## Next gate

Repair the local contracts before writing any SQL:

1. add workspace to every R5 scope and test cross-workspace denial;
2. translate presentation audiences to the canonical Brain vocabulary at one adapter boundary;
3. replace opaque correction strings with typed, version-bound dependency receipts;
4. specify an exact-purpose RLS canary;
5. extend and test the encryption context only after the receipt record shape is accepted.

No migration file, branch, database write or deployment is authorised.
