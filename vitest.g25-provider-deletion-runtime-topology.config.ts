import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/provider-deletion-runtime-topology.r69.test.ts"],
  },
});
