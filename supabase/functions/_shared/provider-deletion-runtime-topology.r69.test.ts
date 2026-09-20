import { describe, expect, it } from "vitest";
import {
  compileProviderDeletionRuntimeTopology,
  PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA,
  type ProviderDeletionRuntimeTopologyInput,
} from "./provider-deletion-runtime-topology.r69";

const valid: ProviderDeletionRuntimeTopologyInput = {
  schema_version: PROVIDER_DELETION_RUNTIME_TOPOLOGY_SCHEMA,
  topology_id: "mindmake.provider-deletion.production-v1",
  cells: [
    {
      kind: "authority_issuer",
      deployment_boundary_id: "provider-authority-issuer-service",
      secret_domain_id: "provider-authority-issuer-secrets",
      operations: ["issue_authority"],
      authority_signing_key_ref: "PROVIDER_AUTHORITY_ISSUER_SIGNING_KEY",
      database_credential_ref: null,
      encrypt_capability_ref: null,
      decrypt_capability_ref: null,
      provider_deletion_credential_ref: null,
    },
    {
      kind: "crypto_writer",
      deployment_boundary_id: "provider-handle-writer-service",
      secret_domain_id: "provider-handle-writer-secrets",
      operations: ["register"],
      authority_signing_key_ref: null,
      database_credential_ref: "PROVIDER_HANDLE_WRITER_DATABASE_URL",
      encrypt_capability_ref: "PROVIDER_HANDLE_ENCRYPT_ONLY_CAPABILITY",
      decrypt_capability_ref: null,
      provider_deletion_credential_ref: null,
    },
    {
      kind: "deletion_worker",
      deployment_boundary_id: "provider-deletion-worker-service",
      secret_domain_id: "provider-deletion-worker-secrets",
      operations: ["lease", "destroy", "provider_delete"],
      authority_signing_key_ref: null,
      database_credential_ref: "PROVIDER_DELETION_WORKER_DATABASE_URL",
      encrypt_capability_ref: null,
      decrypt_capability_ref: "PROVIDER_HANDLE_DECRYPT_ONLY_CAPABILITY",
      provider_deletion_credential_ref: "PROVIDER_DELETION_API_CREDENTIAL",
    },
  ],
};

describe("provider deletion runtime topology R69", () => {
  it("accepts three isolated least-privilege runtime cells", async () => {
    const result = await compileProviderDeletionRuntimeTopology(valid);
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.topology.topology_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable when cells and operations arrive in another order", async () => {
    const first = await compileProviderDeletionRuntimeTopology(valid);
    const reordered: ProviderDeletionRuntimeTopologyInput = {
      ...valid,
      cells: [
        { ...valid.cells[2], operations: ["provider_delete", "destroy", "lease"] },
        valid.cells[0],
        valid.cells[1],
      ],
    };
    const second = await compileProviderDeletionRuntimeTopology(reordered);
    expect(first.status).toBe("accepted");
    expect(second.status).toBe("accepted");
    if (first.status === "accepted" && second.status === "accepted") {
      expect(second.topology.topology_sha256).toBe(first.topology.topology_sha256);
    }
  });

  it("rejects a shared deployment boundary", async () => {
    const cells = structuredClone(valid.cells);
    cells[2].deployment_boundary_id = cells[1].deployment_boundary_id;
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["deployment_boundary_not_isolated"]) });
  });

  it("rejects a shared secret domain", async () => {
    const cells = structuredClone(valid.cells);
    cells[2].secret_domain_id = cells[1].secret_domain_id;
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["secret_domain_not_isolated"]) });
  });

  it("rejects reusing one secret reference across cells", async () => {
    const cells = structuredClone(valid.cells);
    cells[2].database_credential_ref = cells[1].database_credential_ref;
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["secret_reference_reused_across_cells"]) });
  });

  it.each(["SUPABASE_DB_URL", "SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"])(
    "rejects generic privileged credential %s",
    async (credential) => {
      const cells = structuredClone(valid.cells);
      cells[1].database_credential_ref = credential;
      const result = await compileProviderDeletionRuntimeTopology({ ...valid, cells });
      expect(result.status).toBe("held");
      if (result.status === "held") expect(result.reasons).toContain("generic_privileged_credential_forbidden");
    },
  );

  it("rejects giving the signing key to a worker", async () => {
    const cells = structuredClone(valid.cells);
    cells[2].authority_signing_key_ref = "PROVIDER_WORKER_SIGNING_KEY";
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["deletion_worker_secret_boundary_invalid"]) });
  });

  it("rejects giving decryption to the writer", async () => {
    const cells = structuredClone(valid.cells);
    cells[1].decrypt_capability_ref = "PROVIDER_HANDLE_WRITER_DECRYPT_CAPABILITY";
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["crypto_writer_secret_boundary_invalid"]) });
  });

  it("rejects giving provider deletion credentials to the issuer", async () => {
    const cells = structuredClone(valid.cells);
    cells[0].provider_deletion_credential_ref = "PROVIDER_ISSUER_DELETE_CREDENTIAL";
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["authority_issuer_secret_boundary_invalid"]) });
  });

  it("rejects operation escalation in any cell", async () => {
    const cells = structuredClone(valid.cells);
    cells[1].operations.push("destroy");
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells }))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["crypto_writer_operations_invalid"]) });
  });

  it("rejects unexpected manifest fields", async () => {
    const cells = structuredClone(valid.cells) as Array<Record<string, unknown>>;
    cells[0].raw_secret = "must-not-exist";
    await expect(compileProviderDeletionRuntimeTopology({ ...valid, cells } as ProviderDeletionRuntimeTopologyInput))
      .resolves.toMatchObject({ status: "held", reasons: expect.arrayContaining(["runtime_cell_shape_invalid"]) });
  });
});

