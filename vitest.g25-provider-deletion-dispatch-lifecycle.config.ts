import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/provider-deletion-dispatch-lifecycle.r71.test.ts"],
  },
});
