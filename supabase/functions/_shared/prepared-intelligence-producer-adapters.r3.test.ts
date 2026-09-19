import { describe, expect, it } from "vitest";
import { prepareIntelligence } from "./prepared-intelligence.r1";
import {
  adaptLegacyDecisionWatch,
  adaptLegacyQualifiedNews,
  type LegacyDecisionWatchAlert,
  type LegacyQualifiedNewsPoolItem,
} from "./prepared-intelligence-producer-adapters.r3";

const generatedAt = "2026-09-17T09:20:00+01:00";

const newsItem = (overrides: Partial<LegacyQualifiedNewsPoolItem> = {}): LegacyQualifiedNewsPoolItem => ({
  id: "live-2026-09-17-1",
  subject_id: "leader-1",
  audience: "customer_private",
  headline: "A competitor moved category research to an agent workflow",
  summary: "The operating model reduced the distance between audience signals and campaign tests.",
  why_it_matters: "It changes what the current marketing redesign should prove before committing to a full rebuild.",
  category: "orchestration",
  source_count: 2,
  user_relevance: 0.84,
  matched_context: {
    ref: "brain:decision-14",
    label: "your active marketing operating-model decision",
  },
  feedback_fingerprint: "feedback-news-live-1-v1",
  topic_keys: ["marketing", "orchestration"],
  source_evidence: [
    {
      evidence_id: "news-ev-1",
      source_name: "Reuters",
      url: "https://reuters.com/example-agent-workflow",
      published_at: "2026-09-16T11:00:00Z",
      source_tier: 3,
    },
    {
      evidence_id: "news-ev-2",
      source_name: "Financial Times",
      url: "https://ft.com/example-agent-workflow",
      published_at: "2026-09-16T13:00:00Z",
      source_tier: 3,
    },
  ],
  ...overrides,
});

const decisionAlert = (overrides: Partial<LegacyDecisionWatchAlert> = {}): LegacyDecisionWatchAlert => ({
  id: "alert-14",
  user_id: "leader-1",
  audience: "customer_private",
  decision_case_id: "decision-14",
  decision_statement: "Whether to rebuild marketing around AI now",
  claim_id: "claim-7",
  kind: "evidence_shifted",
  headline: "The quality-transfer assumption has moved",
  detail: "The pilot now shows that access to tools is not the binding constraint.",
  decision_effect: "The full rebuild should wait until the team can reproduce the leader's quality signals without final-mile rescue.",
  status: "open",
  feedback_fingerprint: "feedback-alert-14-v1",
  evidence_snapshot: [
    {
      evidence_id: "decision-ev-1",
      source_name: "Pilot evaluation",
      url: "https://example.com/decision-14/pilot-evaluation",
      observed_at: "2026-09-17T07:30:00+01:00",
    },
  ],
  ...overrides,
});

describe("prepared intelligence legacy producer adapters R3", () => {
  it("maps corroborated legacy news into a governed prepared signal", () => {
    const adapted = adaptLegacyQualifiedNews(newsItem(), generatedAt);
    expect(adapted.status).toBe("adapted");
    if (adapted.status !== "adapted") return;
    expect(adapted.signal.source_count).toBe(2);
    expect(adapted.signal.evidence.every((source) => source.standing === "corroborated")).toBe(true);
    expect(adapted.signal.context_refs).toEqual(["brain:decision-14"]);
    expect(adapted.signal.selection_reason).toContain("active marketing operating-model decision");
  });

  it("keeps an honestly qualified reputable single source", () => {
    const item = newsItem({
      source_count: 1,
      source_evidence: [{
        evidence_id: "news-ev-1",
        source_name: "Reuters",
        url: "https://reuters.com/example-agent-workflow",
        published_at: "2026-09-16T11:00:00Z",
        source_tier: 3,
      }],
    });
    const adapted = adaptLegacyQualifiedNews(item, generatedAt);
    expect(adapted.status).toBe("adapted");
    if (adapted.status !== "adapted") return;
    expect(adapted.signal.evidence[0].standing).toBe("reputable_single");
  });

  it("holds the current display-card shape because it lost source evidence", () => {
    const adapted = adaptLegacyQualifiedNews(newsItem({ source_evidence: undefined }), generatedAt);
    expect(adapted).toEqual({ status: "held", reasons: ["news_source_count_mismatch", "news_source_evidence_missing"] });
  });

  it("does not infer qualification for a weak single source", () => {
    const item = newsItem({
      source_count: 1,
      source_evidence: [{
        evidence_id: "news-ev-weak",
        source_name: "Unknown blog",
        url: "https://unknown.example/story",
        published_at: "2026-09-16T11:00:00Z",
        source_tier: 1,
      }],
    });
    expect(adaptLegacyQualifiedNews(item, generatedAt)).toEqual({
      status: "held",
      reasons: ["news_single_source_unqualified"],
    });
  });

  it("holds a source-count claim that the source receipts do not prove", () => {
    expect(adaptLegacyQualifiedNews(newsItem({ source_count: 3 }), generatedAt)).toEqual({
      status: "held",
      reasons: ["news_source_count_mismatch"],
    });
  });

  it("holds stale news rather than quietly recycling it as live intelligence", () => {
    const source_evidence = newsItem().source_evidence!.map((source) => ({
      ...source,
      published_at: "2026-08-01T11:00:00Z",
    }));
    expect(adaptLegacyQualifiedNews(newsItem({ source_evidence }), generatedAt)).toEqual({
      status: "held",
      reasons: ["news_stale_for_live_pool"],
    });
  });

  it("maps a fully evidenced open decision alert into a decision return", () => {
    const adapted = adaptLegacyDecisionWatch(decisionAlert());
    expect(adapted.status).toBe("adapted");
    if (adapted.status !== "adapted") return;
    expect(adapted.signal.context_refs).toEqual(["brain:claim:claim-7", "brain:decision:decision-14"]);
    expect(adapted.signal.evidence[0].standing).toBe("decision_observation");
    expect(adapted.signal.why_it_matters).toContain("full rebuild should wait");
  });

  it("holds the current alert-row shape because verification evidence was dropped", () => {
    expect(adaptLegacyDecisionWatch(decisionAlert({ evidence_snapshot: undefined }))).toEqual({
      status: "held",
      reasons: ["decision_evidence_snapshot_missing"],
    });
  });

  it("holds a decision alert that cannot state its effect on the live call", () => {
    expect(adaptLegacyDecisionWatch(decisionAlert({ decision_effect: undefined }))).toEqual({
      status: "held",
      reasons: ["decision_effect_missing"],
    });
  });

  it("does not resurface acknowledged or resolved alerts", () => {
    expect(adaptLegacyDecisionWatch(decisionAlert({ status: "resolved" }))).toEqual({
      status: "held",
      reasons: ["decision_alert_not_open"],
    });
  });

  it("rejects an unknown decision-alert kind at the runtime boundary", () => {
    const alert = decisionAlert() as LegacyDecisionWatchAlert & { kind: string };
    alert.kind = "generic_update";
    expect(adaptLegacyDecisionWatch(alert as LegacyDecisionWatchAlert)).toEqual({
      status: "held",
      reasons: ["decision_alert_kind_invalid"],
    });
  });

  it("composes both adapted legacy producers through one read and audio object", () => {
    const adaptedNews = adaptLegacyQualifiedNews(newsItem(), generatedAt);
    const adaptedDecision = adaptLegacyDecisionWatch(decisionAlert());
    expect(adaptedNews.status).toBe("adapted");
    expect(adaptedDecision.status).toBe("adapted");
    if (adaptedNews.status !== "adapted" || adaptedDecision.status !== "adapted") return;

    const prepared = prepareIntelligence({
      subject_id: "leader-1",
      audience: "customer_private",
      purpose: "prepared_intelligence",
      context_version: "brain-v14",
      selector_version: "selector-v1",
      generated_at: generatedAt,
      candidates: [adaptedNews.signal, adaptedDecision.signal],
    });
    expect(prepared.status).toBe("prepared");
    if (prepared.status !== "prepared") return;
    expect(prepared.object.signals.map((signal) => signal.kind)).toEqual(["decision_return", "news_signal"]);
    expect(prepared.object.read_projection.block_ids).toEqual(prepared.object.audio_projection.block_ids);
    expect(prepared.object.provenance).toHaveLength(3);
  });
});
