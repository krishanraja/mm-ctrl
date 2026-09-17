import { describe, expect, it } from "vitest";
import type { CompiledProviderDeletionRuntimeTopology } from "./provider-deletion-runtime-topology.r69";
import {
  compileProviderDeletionPersistenceAuthority,
  PROVIDER_DELETION_PERSISTENCE_AUTHORITY_SCHEMA,
  type ProviderDeletionPersistenceAuthorityInput,
} from "./provider-deletion-persistence-authority.r72";

const topology: CompiledProviderDeletionRuntimeTopology = {
  schema_version: "ctrl.provider-deletion-runtime-topology.r69",
  topology_id: "mindmake.provider-deletion.production-v1",
  topology_sha256: "a".repeat(64),
  cells: [
    {
      kind: "authority_issuer", deployment_boundary_id: "issuer-service", secret_domain_id: "issuer-secrets",
      operations: ["issue_authority"], authority_signing_key_ref: "PROVIDER_AUTHORITY_SIGNING_KEY",
      database_credential_ref: null, encrypt_capability_ref: null, decrypt_capability_ref: null,
      provider_deletion_credential_ref: null,
    },
    {
      kind: "crypto_writer", deployment_boundary_id: "writer-service", secret_domain_id: "writer-secrets",
      operations: ["register"], authority_signing_key_ref: null,
      database_credential_ref: "PROVIDER_HANDLE_WRITER_DATABASE_URL",
      encrypt_capability_ref: "PROVIDER_ENCRYPT_ONLY_CAPABILITY", decrypt_capability_ref: null,
      provider_deletion_credential_ref: null,
    },
    {
      kind: "deletion_worker", deployment_boundary_id: "worker-service", secret_domain_id: "worker-secrets",
      operations: ["destroy", "lease", "provider_delete"], authority_signing_key_ref: null,
      database_credential_ref: "PROVIDER_DELETION_WORKER_DATABASE_URL", encrypt_capability_ref: null,
      decrypt_capability_ref: "PROVIDER_DECRYPT_ONLY_CAPABILITY",
      provider_deletion_credential_ref: "PROVIDER_DELETION_API_CREDENTIAL",
    },
  ],
};
const valid: ProviderDeletionPersistenceAuthorityInput = {
  schema_version: PROVIDER_DELETION_PERSISTENCE_AUTHORITY_SCHEMA,
  topology_sha256: topology.topology_sha256,
  grants: [
    {
      principal: "authority_issuer", auth_mode: "custom_database_login",
      credential_ref: "PROVIDER_DISPATCH_ISSUER_DATABASE_URL",
      functions: ["record_dispatch", "append_issuer_event"],
    },
    {
      principal: "crypto_writer", auth_mode: "custom_database_login",
      credential_ref: "PROVIDER_HANDLE_WRITER_DATABASE_URL",
      functions: ["verified_register_handle", "append_target_event"],
    },
    {
      principal: "deletion_worker", auth_mode: "custom_database_login",
      credential_ref: "PROVIDER_DELETION_WORKER_DATABASE_URL",
      functions: ["verified_lease_handle", "verified_destroy_handle", "append_target_event"],
    },
    {
      principal: "operator", auth_mode: "human_session", credential_ref: null,
      functions: ["append_operator_recovery_event"],
    },
  ],
};

describe("provider deletion persistence authority R72", () => {
  it("accepts a narrow persistence overlay without widening custody", async () => {
    const result = await compileProviderDeletionPersistenceAuthority({ topology, input: valid });
    expect(result.status).toBe("accepted");
    if (result.status === "accepted") expect(result.authority.authority_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable across grant and function ordering", async () => {
    const first = await compileProviderDeletionPersistenceAuthority({ topology, input: valid });
    const reordered = { ...valid, grants: [...valid.grants].reverse().map((grant) => ({ ...grant, functions: [...grant.functions].reverse() })) };
    const second = await compileProviderDeletionPersistenceAuthority({ topology, input: reordered });
    expect(first.status).toBe("accepted");
    expect(second.status).toBe("accepted");
    if (first.status === "accepted" && second.status === "accepted") {
      expect(second.authority.authority_sha256).toBe(first.authority.authority_sha256);
    }
  });

  it("rejects giving the issuer custody functions", async () => {
    const input = structuredClone(valid);
    input.grants[0].functions.push("verified_destroy_handle");
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["authority_issuer_persistence_functions_invalid"]),
    });
  });

  it("rejects giving a machine credential to the operator", async () => {
    const input = structuredClone(valid);
    input.grants[3].auth_mode = "custom_database_login";
    input.grants[3].credential_ref = "PROVIDER_OPERATOR_DATABASE_URL";
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["operator_persistence_identity_invalid"]),
    });
  });

  it("rejects a generic service credential", async () => {
    const input = structuredClone(valid);
    input.grants[0].credential_ref = "SUPABASE_SERVICE_ROLE_KEY";
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["generic_privileged_credential_forbidden"]),
    });
  });

  it("rejects credential reuse between issuer and worker", async () => {
    const input = structuredClone(valid);
    input.grants[0].credential_ref = input.grants[2].credential_ref;
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["persistence_credential_reused"]),
    });
  });

  it("requires writer and worker credentials to match their R69 cells", async () => {
    const input = structuredClone(valid);
    input.grants[1].credential_ref = "PROVIDER_DIFFERENT_WRITER_DATABASE_URL";
    input.grants[2].credential_ref = "PROVIDER_DIFFERENT_WORKER_DATABASE_URL";
    const result = await compileProviderDeletionPersistenceAuthority({ topology, input });
    expect(result.status).toBe("held");
    if (result.status === "held") {
      expect(result.reasons).toContain("writer_credential_topology_mismatch");
      expect(result.reasons).toContain("worker_credential_topology_mismatch");
    }
  });

  it("rejects a stale topology fingerprint", async () => {
    const input = { ...valid, topology_sha256: "b".repeat(64) };
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["persistence_topology_mismatch"]),
    });
  });

  it("rejects duplicate principals", async () => {
    const input = structuredClone(valid);
    input.grants[3] = structuredClone(input.grants[2]);
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["persistence_principal_duplicate", "persistence_principal_operator_missing"]),
    });
  });

  it("rejects unexpected grant fields", async () => {
    const input = structuredClone(valid) as ProviderDeletionPersistenceAuthorityInput & { grants: Array<Record<string, unknown>> };
    input.grants[0].password = "must-not-exist";
    await expect(compileProviderDeletionPersistenceAuthority({ topology, input })).resolves.toMatchObject({
      status: "held", reasons: expect.arrayContaining(["persistence_grant_shape_invalid"]),
    });
  });
});

