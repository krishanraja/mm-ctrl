import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/functions/_shared/prepared-research-postgres.r56.test.ts"],
  },
});
