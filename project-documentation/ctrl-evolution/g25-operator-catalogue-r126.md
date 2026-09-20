# G25 isolated operator catalogue, R126

Status: `isolated_catalogue_read_smallest_identity_cut_confirmed`

R126 reads the exact isolated Supabase catalogue without a database write. It confirms that the existing authority spine is already present: workspaces carry lifecycle, workspace roles carry grant time, audience grants carry expiry, review packets are live, and the R123 owner-private queue RPC is live.

It also confirms the exact missing slice. The isolated project has no stable operator-principal table, no operator auth-link table, no general Brain access receipt, no operator-projection binding on review packets and no operator review RPC.

The smallest additive identity cut is therefore the two exact tables already designed and locally proved in R23:

- `private.brain_operator_principals`
- `private.brain_operator_auth_links`

No custody assignment, historical principal, subject principal or second workspace permission system is needed for this read path. The later migration must preserve the R23 names and semantics so the wider custody architecture can adopt the same identities rather than fork them.

R126 inspected schema through Supabase-generated TypeScript for `public,private`, validated the linked project ref before the read and retained only a catalogue hash plus boolean findings. It did not store or expose database credentials or schema contents in the repository.

R127 may now create one additive migration containing the two stable operator tables, the four in-place review projection bindings, the one general access receipt table and the read-only operator RPC. It may be rehearsed on the isolated project with disposable identities only. Production, customer data, main merge, release and legacy retirement remain closed.
