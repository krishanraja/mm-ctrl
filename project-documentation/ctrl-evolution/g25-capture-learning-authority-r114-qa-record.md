# G25 capture and learning authority R114 QA

- Isolated project: `cgkcplcamsijghalintq` (`legibility`)
- Production project: untouched
- Migration recorded: `20260918190000 capture_week_owner_authority`
- Hosted function: `capture-week`, version 7, ACTIVE, gateway JWT disabled with exact machine authentication
- Hosted bundle SHA-256: `8c4d77626d7cab3c62f48d57ab511d5d84769457261049bb142aba66a7fd4a98`
- Route SHA-256: `68c7cd2fe87e9bf6c37962a8748c928b0888530a2b4021979e5c47ec9a476096`
- Core SHA-256: `67ca74b15347d6d95f5d8b05f11dab6a32a7537a56125149fb7d5fd3338b272d`
- Migration SHA-256: `c578d1fa0ec06bc7ac6a1db241dff3a501e271d95653c1679d898ef2c78e7ffa`
- Probe SHA-256: `439035b0425fd415ea4c5b1345ae740d9a729e2bed62395593bcf8a8f798dfca`
- Repository function manifest SHA-256: `c44ba7ae89d8a63854513a6f8d798bae6e2fde010842c1e5b7555583968e8eaa`
- Environment manifest SHA-256: `fbd182c62f5c98d51c3c246f4d2d9132562bcb97b010e2fd447f375b11a941d0`
- Containment manifest SHA-256: `34922f1cbbadf2cb114175615f68fdc61ce8b24506937767f15a78cc38923f82`
- Focused capture tests: 40 passed
- Trust containment: 59 contracts passed
- Typecheck: current 94, baseline 94, new 0

Hosted proof facts:

- request boundary statuses: 403, 405, 415, 413 and 400;
- two proposals from one exact source snapshot;
- one append-only capture run and exact idempotent replay;
- raw review quotes copied to durable proposals: no;
- cross-tenant proposal visibility: zero;
- direct proposal updates and cross-owner decisions: denied;
- owner policy update: one row, cross-owner policy update: zero rows;
- a new week inside cadence returned `not_due`;
- acceptance applied a criteria change: no;
- criteria bytes after acceptance: unchanged;
- same evidence reopened as a new proposal: zero;
- stale-source publication: denied; and
- synthetic users, capture runs and proposals after cleanup: zero.

The replacement project now has thirteen bounded active functions. A scheduled capture job, real-leader learning validity, the customer proposal surface, production cutover and old-project deletion remain separate gates.

