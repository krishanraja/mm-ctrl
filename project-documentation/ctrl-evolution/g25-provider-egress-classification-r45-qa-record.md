# G25 provider egress classification R45 QA record

- Scope: read-only classification of every R44 provider-signature file
- Runtime provider calls: none
- Live provider routing changes: none
- Live deletion changes: none
- Expected provider families: 15
- Acceptance: every provider-file association resolves to one purpose family and one or more controlled data classes
- Conservative rule: classification represents potential egress until payload-level proof narrows it
- Required check: `npm run brain:g25:provider-egress-r45-check`
- Remaining gate: current official retention and deletion research, followed by a provider-receipt persistence candidate
