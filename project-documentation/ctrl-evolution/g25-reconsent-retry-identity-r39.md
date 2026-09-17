# G25 reconsent retry identity correction, R39

R39 records and fixes a defect found while composing the future server adapter.

R36 originally treated the complete consent projection as retry identity. That projection included the future workspace ID, future custody ID and event time. R37 correctly generates those values on the server, but it generates them again after a browser or network retry. The same human action could therefore appear different to R36 and reserve more than one future Brain.

That was wrong because network behavior is not human intent.

The authoritative retry key is now the previous erased workspace, stable subject and the authenticated request fingerprint produced from the signed-in user, previous workspace, fixed decision, statement version and statement content. A retry may arrive later with wholly new transport-generated IDs. It converges on the first reservation and returns its IDs.

The complete consent fingerprint is still retained as receipt evidence. It simply no longer decides whether two HTTP attempts represent two human choices.

The executable R36 proof now changes the consent ID, reserved workspace ID, reserved custody ID, tenant key and timestamp on retry and still observes exactly one reservation. R38 remains one-consent-one-scope.

This is a local candidate correction. Real concurrent retry races still require a PostgreSQL connection pool and Supabase-local rehearsal.
