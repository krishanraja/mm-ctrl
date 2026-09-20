import { describe, expect, it } from "vitest";
import {
  isJsonRequest,
  publicClientIdentity,
  readJsonWithLimit,
  readTextWithLimit,
  sha256Identifier,
} from "./public-request-guard";

describe("public request guard", () => {
  it("uses the first forwarded address without treating it as authentication", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(publicClientIdentity(headers)).toBe("203.0.113.10");
    expect(publicClientIdentity(new Headers())).toBe("unknown");
  });

  it("accepts JSON media types only", () => {
    expect(isJsonRequest(new Headers({ "content-type": "application/json; charset=utf-8" }))).toBe(true);
    expect(isJsonRequest(new Headers({ "content-type": "text/plain" }))).toBe(false);
  });

  it("rejects a body that crosses the byte budget even without Content-Length", async () => {
    const request = new Request("https://example.invalid", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "too long" }),
    });
    await expect(readJsonWithLimit(request, 5)).rejects.toThrow("request_too_large");
  });

  it("parses an in-budget JSON body", async () => {
    const request = new Request("https://example.invalid", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });
    await expect(readJsonWithLimit(request, 64)).resolves.toEqual({ ok: true });
  });

  it("preserves an in-budget signed text payload exactly", async () => {
    const payload = "{\"signed\":true}";
    const request = new Request("https://example.invalid", { method: "POST", body: payload });
    await expect(readTextWithLimit(request, 64)).resolves.toBe(payload);
  });

  it("makes stable non-plaintext rate-limit identifiers", async () => {
    const first = await sha256Identifier("person@example.com");
    const second = await sha256Identifier("person@example.com");
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain("person");
  });
});
