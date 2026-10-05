import { describe, expect, it } from "vitest";
import {
  contentHashInput,
  hostOf,
  normalizeUrl,
  perOriginCounts,
  publishedAtOrNull,
  sha256Hex,
  toGatherRow,
} from "./trend-memory.ts";
import type { RawArticle } from "./news-cluster.ts";

// These are the identity rules for the whole trend record. They matter more
// than they look: the same normalisation runs in content-engine's
// apps/control-plane/api/_observations.ts against a different Supabase
// project, and the two records are meant to be joinable on these hashes. A
// drift between them would not throw, it would quietly split one story into
// two and understate every corroboration count for as long as nobody noticed.

const article = (over: Partial<RawArticle> = {}): RawArticle => ({
  title: "OpenAI ships a thing",
  url: "https://www.example.com/a?utm_source=x&b=2&a=1",
  description: "A description",
  source: "example.com",
  publishedIso: "2026-09-22T08:00:00.000Z",
  engagement: 12,
  sourceTier: 2,
  origin: "rss",
  ...over,
});

describe("normalizeUrl", () => {
  it("strips tracking parameters, www, fragment and trailing slash", () => {
    expect(normalizeUrl("https://www.Example.com/a/?utm_source=x&utm_medium=y#frag"))
      .toBe("https://example.com/a");
  });

  it("keeps a query string that is part of the article", () => {
    // Plenty of publishers address an article by query string. Dropping the
    // whole query would merge genuinely different pages into one.
    expect(normalizeUrl("https://example.com/view?id=99")).toBe("https://example.com/view?id=99");
  });

  it("sorts parameters so ordering is not an identity", () => {
    expect(normalizeUrl("https://example.com/a?b=2&a=1"))
      .toBe(normalizeUrl("https://example.com/a?a=1&b=2"));
  });

  it("upgrades http to https so a scheme change is not a new story", () => {
    expect(normalizeUrl("http://example.com/a")).toBe("https://example.com/a");
  });

  it("returns null for anything that is not an http(s) URL", () => {
    expect(normalizeUrl("mailto:someone@example.com")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl("")).toBeNull();
  });
});

describe("hostOf", () => {
  it("returns the bare lowercased host", () => {
    expect(hostOf("https://WWW.Example.com/a")).toBe("example.com");
  });
  it("is null when the URL is unusable", () => {
    expect(hostOf("nonsense")).toBeNull();
  });
});

describe("contentHashInput", () => {
  it("ignores case and whitespace reflow", () => {
    expect(contentHashInput("A  Title", "Some   text"))
      .toBe(contentHashInput("a title", "some text"));
  });

  it("separates title from description so the boundary cannot be forged", () => {
    // Without the separator, ("ab", "c") and ("a", "bc") would collide.
    expect(contentHashInput("ab", "c")).not.toBe(contentHashInput("a", "bc"));
  });

  it("treats a missing description as empty", () => {
    expect(contentHashInput("t", null)).toBe(contentHashInput("t", ""));
    expect(contentHashInput("t", undefined)).toBe(contentHashInput("t", ""));
  });

  it("agrees with content-engine on a fixed input", async () => {
    // The cross-repo anchor. content-engine pins this same literal in
    // tests/observations.test.ts, computed through Node's crypto rather than
    // Web Crypto. If either side changes its separator, its casing or its
    // whitespace rule, this digest moves and one of the two suites fails,
    // which is the only thing standing between a silent identity drift and
    // months of understated corroboration counts.
    await expect(sha256Hex(contentHashInput("OpenAI ships a thing", "A description")))
      .resolves.toBe("bc1e47d2d24a96d77213dc469431783ddd3b2f0ca263d7699064cb0c2a65bcc1");
  });
});

describe("sha256Hex", () => {
  it("matches the known digest of the empty string", () => {
    // Pinned against the standard SHA-256 of "", so a change of algorithm or
    // encoding here fails loudly rather than silently re-keying the table.
    return expect(sha256Hex("")).resolves.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});

describe("publishedAtOrNull", () => {
  it("normalises a valid date to ISO", () => {
    expect(publishedAtOrNull("2026-09-22T08:00:00Z")).toBe("2026-09-22T08:00:00.000Z");
  });

  it("is null rather than now() when the source is silent or unparseable", () => {
    // The whole point of the column: a missing publication date is a fact
    // about the source, and substituting the time we looked would make every
    // undated article appear to have been published at gather time.
    expect(publishedAtOrNull(null)).toBeNull();
    expect(publishedAtOrNull("")).toBeNull();
    expect(publishedAtOrNull("not a date")).toBeNull();
  });
});

describe("perOriginCounts", () => {
  it("counts per source so a dead source reads as a zero beside its neighbours", () => {
    const counts = perOriginCounts([
      article({ origin: "rss" }),
      article({ origin: "rss" }),
      article({ origin: "gdelt" }),
    ]);
    expect(counts).toEqual({ rss: 2, gdelt: 1 });
  });
});

describe("toGatherRow", () => {
  it("carries the verdict and the absolute publication time", async () => {
    const row = await toGatherRow("2026-09-22", "11111111-1111-1111-1111-111111111111", {
      article: article(),
      aiNative: true,
      selected: false,
      dropReason: "below_trust_floor",
      clusterKey: "https://example.com/a",
      clusterSize: 1,
      category: "model",
    });
    expect(row.gather_day).toBe("2026-09-22");
    expect(row.selected).toBe(false);
    expect(row.drop_reason).toBe("below_trust_floor");
    expect(row.published_at).toBe("2026-09-22T08:00:00.000Z");
    expect(row.source_host).toBe("example.com");
    expect(row.url).toBe("https://example.com/a?a=1&b=2");
    expect(typeof row.content_hash).toBe("string");
    expect((row.content_hash as string).length).toBe(64);
  });

  it("clears the drop reason on a selected article", async () => {
    // A selected row with a drop reason would fail the record's own meaning,
    // so the shaping enforces it rather than trusting the caller.
    const row = await toGatherRow("2026-09-22", "11111111-1111-1111-1111-111111111111", {
      article: article(),
      aiNative: true,
      selected: true,
      dropReason: "lane_full",
    });
    expect(row.drop_reason).toBeNull();
  });

  it("keeps the whole article in raw, including anything this schema omits", async () => {
    const row = await toGatherRow("2026-09-22", "11111111-1111-1111-1111-111111111111", {
      article: article(),
      aiNative: true,
      selected: true,
      dropReason: null,
    });
    expect((row.raw as { article: RawArticle }).article.engagement).toBe(12);
  });

  it("leaves url_hash null when there is no usable URL, so it dedupes on text", async () => {
    const row = await toGatherRow("2026-09-22", "11111111-1111-1111-1111-111111111111", {
      article: article({ url: "" }),
      aiNative: false,
      selected: false,
      dropReason: "not_ai_native",
    });
    expect(row.url_hash).toBeNull();
    expect(row.content_hash).toBeTruthy();
  });
});
