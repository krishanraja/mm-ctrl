import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/provider-deletion-handle-db-authority.r68.test.ts"],
  },
});
