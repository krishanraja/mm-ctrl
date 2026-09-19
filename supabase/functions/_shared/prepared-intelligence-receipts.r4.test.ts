import { describe, expect, it } from "vitest";
import type { RawArticle } from "./news-cluster";
import { adaptLegacyDecisionWatch, adaptLegacyQualifiedNews } from "./prepared-intelligence-producer-adapters.r3";
import { prepareIntelligence } from "./prepared-intelligence.r1";
import {
  createDecisionObservationReceipt,
  createQualifiedNewsReceipt,
  type DecisionObservationReceiptInput,
  type QualifiedNewsReceiptInput,
} from "./prepared-intelligence-receipts.r4";

const generatedAt = "2026-09-17T09:30:00+01:00";

const article = (overrides: Partial<RawArticle> = {}): RawArticle => ({
  title: "Competitor launches AI agent workflow for marketing research",
  url: "https://reuters.com/competitor-agent-workflow",
  description: "The workflow connects audience signals to campaign testing.",
  source: "Reuters",
  publishedIso: "2026-09-16T11:00:00Z",
  engagement: 0,
  sourceTier: 3,
  origin: "newsapi",
  ...overrides,
});

const newsInput = (overrides: Partial<QualifiedNewsReceiptInput> = {}): QualifiedNewsReceiptInput => ({
  id: "live-2026-09-17-1",
  subject_id: "leader-1",
  audience: "customer_private",
  headline: "A competitor moved category research to an agent workflow",
  summary: "The operating model reduced the distance between audience signals and campaign tests.",
  why_it_matters: "It changes what the current marketing redesign should prove before a full rebuild.",
  category: "orchestration",
  user_relevance: 0.84,
  matched_context: { ref: "brain:decision-14", label: "your active marketing operating-model decision" },
  feedback_fingerprint: "feedback-news-live-1-v1",
  topic_keys: ["orchestration", "marketing"],
  cluster_members: [
    article(),
    article({
      title: "AI agent workflow launches for competitor marketing research",
      url: "https://ft.com/competitor-agent-workflow",
      source: "Financial Times",
      publishedIso: "2026-09-16T13:00:00Z",
    }),
  ],
  ...overrides,
});

const decisionInput = (overrides: Partial<DecisionObservationReceiptInput> = {}): DecisionObservationReceiptInput => ({
  alert_id: "alert-14",
  user_id: "leader-1",
  audience: "customer_private",
  decision_case_id: "decision-14",
  decision_statement: "Whether to rebuild marketing around AI now",
  claim_id: "claim-7",
  kind: "assumption_broke",
  headline: "The quality-transfer assumption has moved",
  detail: "The pilot now contests the assumption that tool access was the binding constraint.",
  decision_effect: "The full rebuild should wait until the team can reproduce the leader's quality signals.",
  status: "open",
  observed_at: "2026-09-17T08:00:00+01:00",
  prior: { verdict: "supported", confidence: 0.78 },
  current: { verdict: "contested", confidence: 0.3 },
  verification_evidence: [
    {
      source_url: "https://example.com/pilot-evaluation",
      source_title: "Pilot evaluation",
      excerpt: "Quality transfer remains inconsistent.",
      stance: "refutes",
      retriever: "memory",
    },
  ],
  feedback_fingerprint: "feedback-alert-14-v1",
  ...overrides,
});

describe("prepared intelligence receipt creators R4", () => {
  it("creates a deterministic qualified-news receipt from lossless cluster members", () => {
    const first = createQualifiedNewsReceipt(newsInput());
    const reversed = createQualifiedNewsReceipt(newsInput({ cluster_members: [...newsInput().cluster_members].reverse() }));
    expect(first).toEqual(reversed);
    expect(first.status).toBe("created");
    if (first.status !== "created") return;
    expect(first.receipt.source_count).toBe(2);
    expect(first.receipt.source_evidence?.map((evidence) => evidence.source_name)).toEqual(["Financial Times", "Reuters"]);
  });

  it("retains a reputable single source without inventing corroboration", () => {
    const result = createQualifiedNewsReceipt(newsInput({ cluster_members: [article()] }));
    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.receipt.source_count).toBe(1);
    expect(result.receipt.source_evidence?.[0].source_tier).toBe(3);
  });

  it("holds a weak single-source cluster", () => {
    expect(createQualifiedNewsReceipt(newsInput({ cluster_members: [article({ sourceTier: 1 })] }))).toEqual({
      status: "held",
      reasons: ["news_cluster_unqualified"],
    });
  });

  it("holds a supposed cluster member that does not describe the same story", () => {
    const unrelated = article({
      title: "Hospital tests a new surgical robot",
      url: "https://ft.com/surgical-robot",
      source: "Financial Times",
    });
    expect(createQualifiedNewsReceipt(newsInput({ cluster_members: [article(), unrelated] }))).toEqual({
      status: "held",
      reasons: ["news_member_not_in_cluster"],
    });
  });

  it("holds news when exact publication evidence is unavailable", () => {
    expect(createQualifiedNewsReceipt(newsInput({ cluster_members: [article({ publishedIso: null })] }))).toEqual({
      status: "held",
      reasons: ["news_member_publication_missing"],
    });
  });

  it("does not issue a news receipt across an unknown runtime audience", () => {
    const input = newsInput() as QualifiedNewsReceiptInput & { audience: string };
    input.audience = "public";
    expect(createQualifiedNewsReceipt(input as QualifiedNewsReceiptInput)).toEqual({
      status: "held",
      reasons: ["news_receipt_audience_invalid"],
    });
  });

  it("creates a deterministic decision-observation receipt from verifier evidence", () => {
    const secondEvidence = {
      source_url: "https://example.org/customer-observation",
      source_title: "Customer observation",
      excerpt: "The bottleneck remained quality judgement.",
      stance: "refutes" as const,
      retriever: "memory",
    };
    const first = createDecisionObservationReceipt(decisionInput({
      verification_evidence: [...decisionInput().verification_evidence, secondEvidence],
    }));
    const reversed = createDecisionObservationReceipt(decisionInput({
      verification_evidence: [secondEvidence, ...decisionInput().verification_evidence],
    }));
    expect(first).toEqual(reversed);
    expect(first.status).toBe("created");
  });

  it("holds a decision update that does not meet its claimed trigger", () => {
    expect(createDecisionObservationReceipt(decisionInput({ current: { verdict: "supported", confidence: 0.75 } }))).toEqual({
      status: "held",
      reasons: ["decision_change_not_load_bearing"],
    });
  });

  it("holds a verifier result with no inspectable source URL", () => {
    const evidence = [{
      source_url: null,
      source_title: "Unlinked claim",
      excerpt: "No receipt.",
      stance: "refutes" as const,
      retriever: "memory",
    }];
    expect(createDecisionObservationReceipt(decisionInput({ verification_evidence: evidence }))).toEqual({
      status: "held",
      reasons: ["decision_verification_evidence_unusable", "decision_verification_source_missing"],
    });
  });

  it("holds a generic decision update with no specific effect on the call", () => {
    expect(createDecisionObservationReceipt(decisionInput({ decision_effect: "" }))).toEqual({
      status: "held",
      reasons: ["decision_effect_missing"],
    });
  });

  it("does not issue a decision receipt for malformed confidence", () => {
    expect(createDecisionObservationReceipt(decisionInput({
      current: { verdict: "contested", confidence: 4 },
    }))).toEqual({
      status: "held",
      reasons: ["decision_confidence_invalid"],
    });
  });

  it("flows both receipts through adapters into one governed prepared object", () => {
    const newsReceipt = createQualifiedNewsReceipt(newsInput());
    const decisionReceipt = createDecisionObservationReceipt(decisionInput());
    expect(newsReceipt.status).toBe("created");
    expect(decisionReceipt.status).toBe("created");
    if (newsReceipt.status !== "created" || decisionReceipt.status !== "created") return;

    const newsSignal = adaptLegacyQualifiedNews(newsReceipt.receipt, generatedAt);
    const decisionSignal = adaptLegacyDecisionWatch(decisionReceipt.receipt);
    expect(newsSignal.status).toBe("adapted");
    expect(decisionSignal.status).toBe("adapted");
    if (newsSignal.status !== "adapted" || decisionSignal.status !== "adapted") return;

    const prepared = prepareIntelligence({
      subject_id: "leader-1",
      audience: "customer_private",
      purpose: "prepared_intelligence",
      context_version: "brain-v14",
      selector_version: "selector-v1",
      generated_at: generatedAt,
      candidates: [newsSignal.signal, decisionSignal.signal],
    });
    expect(prepared.status).toBe("prepared");
    if (prepared.status !== "prepared") return;
    expect(prepared.object.read_projection.block_ids).toEqual(prepared.object.audio_projection.block_ids);
    expect(prepared.object.selection_receipts).toHaveLength(2);
  });
});
