import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/provider-deletion-handle-authority-postgres.r67.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
