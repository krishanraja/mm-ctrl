# G25 held-out measurement authority R113 QA

- Isolated project: `cgkcplcamsijghalintq` (`legibility`)
- Production project: untouched
- Migration recorded: `20260918183000 measure_standard_owner_authority`
- Hosted function: `measure-standard`, version 1, ACTIVE, JWT verified
- Hosted bundle SHA-256: `469c3cf3ebd872a66752ba7a7d5231e347abfe086bbc70798d83bb5333aa7983`
- Route SHA-256: `06f3526a4cbfb9377256ccf80abee9de9fc3e716edeffcd0c7ffebe070b0fa2b`
- Migration SHA-256: `7cb7bdac0a82862058512aeff561bd7610c43dd17b65b849006f6445964af60c`
- Probe SHA-256: `dccfb92cd3af6543eebc8d8794b487bce859a955ce074c381288bd8140bf72bf`
- Containment manifest SHA-256: `caf2c5634e37e3321a8d9ea4661ede331ad53479aa4c5abf00ee5d05f9dc0bea`
- Function config SHA-256: `d694cdc16d1f7814adf2b7169d2ae4604997b82dad1b24c80c2e981094a0ecce`
- Environment inspector SHA-256: `825452ecc8a345647aad776e0233d84f764348391c4d23a11ea48b04a673eea4`
- Focused measurement and confusion tests: 32 passed
- Trust containment: 59 contracts passed
- Typecheck: current 94, baseline 94, new 0

Hosted proof facts:

- request boundary statuses: 401, 405, 415, 413 and 400;
- direct private RPC: 403;
- ten unfamiliar items fixed before labels were joined;
- ten paid item calls and ten usage receipts;
- matrix: TP 5, FP 0, FN 0, TN 5;
- precision 1.00, recall 1.00, TNR 1.00;
- exact retry returned the same run;
- changed request identity returned 409;
- cross-tenant measurement visibility: zero;
- run and recorded-spend ceilings returned 429;
- stale source returned `source_changed_retry` and created zero measurements; and
- transient users, runs, measurements and usage rows after cleanup: zero.

This proves the hidden-label authority path on synthetic work. It does not prove that the same threshold is commercially calibrated, that every leader grades consistently or that the customer-facing experience is complete.

