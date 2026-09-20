import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/provider-deletion-dispatch-postgres.r73.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
