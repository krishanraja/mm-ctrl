import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "supabase/functions/memory-settings/index.ts"), "utf8");

describe("memory settings route contract", () => {
  it("uses the authenticated user client and never the service role", () => {
    expect(source).toContain("auth.getUser(");
    expect(source).toContain('.eq("user_id", user.id)');
    expect(source).toContain("user_id: user.id");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("target_user_id");
  });

  it("bounds every mutating request and exposes only closed controls", () => {
    expect(source).toContain("readJsonWithLimit(req, 4_096)");
    expect(source).toContain("settings_keys_invalid");
    expect(source).toContain('action !== "clear_local_cache"');
  });

  it("keeps an empty GET read-only", () => {
    expect(source).toContain("persisted: false");
    expect(source).not.toContain("get_or_create_memory_settings");
  });
});
