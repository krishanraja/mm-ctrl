import { describe, expect, it } from "vitest";
import { matchesExpectedSupabaseProject } from "./project-binding";

describe("project binding", () => {
  const ref = "abcdefghijklmnopqrst";

  it("accepts only the exact configured Supabase host", () => {
    expect(matchesExpectedSupabaseProject(`https://${ref}.supabase.co`, ref)).toBe(true);
    expect(matchesExpectedSupabaseProject(`https://${ref}.supabase.co/rest/v1`, ref)).toBe(true);
  });

  it("rejects suffix tricks, malformed references and missing configuration", () => {
    expect(matchesExpectedSupabaseProject(`https://${ref}.supabase.co.attacker.invalid`, ref)).toBe(false);
    expect(matchesExpectedSupabaseProject(`https://attacker.invalid/${ref}.supabase.co`, ref)).toBe(false);
    expect(matchesExpectedSupabaseProject(`https://${ref}.supabase.co`, "")).toBe(false);
    expect(matchesExpectedSupabaseProject("not a url", ref)).toBe(false);
  });
});
