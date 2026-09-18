# G25 portable Brain round trip R105 QA record

## Pure package tests

- Stable package construction across input order: pass
- Intact package validation: pass
- Hidden-field rejection: pass
- Changed-record rejection: pass
- Duplicate-record-key rejection: pass
- Shared package tests: 4 passed
- Shared request-guard tests: 6 passed

## Database authority

- Migration applied only to the isolated target: yes
- Receipt-table RLS enabled: yes
- Authenticated direct receipt insert: denied
- Authenticated owner receipt select: allowed through RLS
- Authenticated import function execute: allowed
- Anonymous import function execute: denied
- Function uses `auth.uid()` and no target-user argument: yes
- Receipt rows after cleanup: zero

## Hosted functions

- `brain-portable-export`: ACTIVE, version 1, gateway JWT enabled
- `brain-portable-import`: ACTIVE, version 1, gateway JWT enabled
- Export bundle SHA-256: `b8f1d725b5db9b3613caa6006076058e062505ab667d4765102270c30b4c9286`
- Import bundle SHA-256: `cb5bb40e27a87d8d9905f975f7b2716bf8c341c9affaae10f93391fb8313eebf`

## Hosted behavior

- Anonymous export: 401
- Owner export: 200
- Repeat package byte equality: yes
- Package content: one fact, one pattern, one decision
- Source user ID included: no
- Tampered import: 400
- Wrong media: 415
- Wrong method: 405
- First import: 200, three rows created
- Repeat import: 200, zero rows created
- Existing destination fact preserved: yes
- Imported fact standing: inferred, manual source
- Imported pattern standing: emerging, 0.5 confidence, one evidence unit
- Imported decision standing: active, manual source, receipt present
- Source receipt count: zero
- Destination receipt count: one before cleanup

## Cleanup and authority

- Auth users: zero
- Auth identities: zero
- Profiles: zero
- Facts: zero
- Patterns: zero
- Decisions: zero
- Import receipts: zero
- Production writes: zero
- Raw secret values emitted or persisted: no
- Email, payment or model-spend route opened: no

## Verdict

`ISOLATED_CURRENT_BRAIN_PORTABLE_ROUNDTRIP_PASS_COMPLETE_ARCHIVE_OPEN`
