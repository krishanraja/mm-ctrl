import { sha256Identifier } from "./public-request-guard.ts";

export const PORTABLE_BRAIN_SCHEMA = "ctrl.portable-brain.v1";
export const PORTABLE_BRAIN_SCOPE = "current_brain";
export const PORTABLE_BRAIN_MAX_BYTES = 1_048_576;

const limits = Object.freeze({ facts: 500, patterns: 250, decisions: 250 });
const factCategories = new Set(["identity", "business", "objective", "blocker", "preference"]);
const temperatures = new Set(["hot", "warm", "cold"]);
const verificationStatuses = new Set(["inferred", "verified", "corrected", "rejected", "disputed"]);
const sourceTypes = new Set(["voice", "form", "linkedin", "calendar", "enrichment", "manual", "kit", "capsule"]);
const patternTypes = new Set(["preference", "anti_preference", "behavior", "blindspot", "strength"]);
const patternStatuses = new Set(["emerging", "confirmed"]);
const decisionStatuses = new Set(["active"]);
const decisionSources = new Set(["manual", "voice", "check_in", "mission", "assessment"]);

type JsonObject = Record<string, unknown>;

export interface PortableBrainInput {
  facts: JsonObject[];
  patterns: JsonObject[];
  decisions: JsonObject[];
}

export interface PortableBrainRecord {
  record_key: string;
  data: JsonObject;
}

export interface PortableBrainPackage {
  schema_version: typeof PORTABLE_BRAIN_SCHEMA;
  scope: typeof PORTABLE_BRAIN_SCOPE;
  records: {
    facts: PortableBrainRecord[];
    patterns: PortableBrainRecord[];
    decisions: PortableBrainRecord[];
  };
  manifest: {
    content_sha256: string;
    counts: { facts: number; patterns: number; decisions: number; total: number };
  };
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: JsonObject, keys: string[], path: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${path}_keys_invalid`);
}

function text(value: unknown, path: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") throw new Error(`${path}_invalid`);
  const normalized = value.trim();
  if ((!allowEmpty && !normalized) || normalized.length > max) throw new Error(`${path}_invalid`);
  return normalized;
}

function optionalText(value: unknown, path: string, max: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  return text(value, path, max);
}

function enumText(value: unknown, allowed: Set<string>, path: string): string {
  const result = text(value, path, 80);
  if (!allowed.has(result)) throw new Error(`${path}_invalid`);
  return result;
}

function numberInRange(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${path}_invalid`);
  }
  return value;
}

function integerInRange(value: unknown, path: string, min: number, max: number): number {
  const result = numberInRange(value, path, min, max);
  if (!Number.isInteger(result)) throw new Error(`${path}_invalid`);
  return result;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${path}_invalid`);
  return value;
}

function timestamp(value: unknown, path: string): string {
  const result = text(value, path, 64);
  if (!Number.isFinite(Date.parse(result))) throw new Error(`${path}_invalid`);
  return new Date(result).toISOString();
}

function tags(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length > 40) throw new Error(`${path}_invalid`);
  const result = value.map((item, index) => text(item, `${path}_${index}`, 100));
  if (new Set(result).size !== result.length) throw new Error(`${path}_duplicate`);
  return result.sort((left, right) => left.localeCompare(right));
}

function jsonValue(value: unknown, path: string, maxBytes: number): unknown {
  if (value === undefined) return {};
  const encoded = JSON.stringify(value);
  if (encoded === undefined || new TextEncoder().encode(encoded).byteLength > maxBytes) throw new Error(`${path}_invalid`);
  return JSON.parse(encoded);
}

function normalizeFact(value: JsonObject, path: string): JsonObject {
  exactKeys(value, [
    "fact_key", "fact_category", "fact_label", "fact_value", "fact_context", "confidence_score",
    "is_high_stakes", "verification_status", "source_type", "temperature", "tags", "fact_subtype",
    "importance", "created_at",
  ], path);
  return {
    fact_key: text(value.fact_key, `${path}_fact_key`, 300),
    fact_category: enumText(value.fact_category, factCategories, `${path}_fact_category`),
    fact_label: text(value.fact_label, `${path}_fact_label`, 300),
    fact_value: text(value.fact_value, `${path}_fact_value`, 20_000),
    fact_context: optionalText(value.fact_context, `${path}_fact_context`, 20_000),
    confidence_score: numberInRange(value.confidence_score, `${path}_confidence_score`, 0, 1),
    is_high_stakes: booleanValue(value.is_high_stakes, `${path}_is_high_stakes`),
    verification_status: enumText(value.verification_status, verificationStatuses, `${path}_verification_status`),
    source_type: enumText(value.source_type, sourceTypes, `${path}_source_type`),
    temperature: enumText(value.temperature, temperatures, `${path}_temperature`),
    tags: tags(value.tags, `${path}_tags`),
    fact_subtype: optionalText(value.fact_subtype, `${path}_fact_subtype`, 120),
    importance: value.importance === null ? null : integerInRange(value.importance, `${path}_importance`, 1, 10),
    created_at: timestamp(value.created_at, `${path}_created_at`),
  };
}

function normalizePattern(value: JsonObject, path: string): JsonObject {
  exactKeys(value, [
    "pattern_type", "pattern_text", "confidence", "evidence_count", "status", "explanation", "created_at",
  ], path);
  return {
    pattern_type: enumText(value.pattern_type, patternTypes, `${path}_pattern_type`),
    pattern_text: text(value.pattern_text, `${path}_pattern_text`, 20_000),
    confidence: numberInRange(value.confidence, `${path}_confidence`, 0, 1),
    evidence_count: integerInRange(value.evidence_count, `${path}_evidence_count`, 0, 1_000_000),
    status: enumText(value.status, patternStatuses, `${path}_status`),
    explanation: optionalText(value.explanation, `${path}_explanation`, 20_000),
    created_at: timestamp(value.created_at, `${path}_created_at`),
  };
}

function normalizeDecision(value: JsonObject, path: string): JsonObject {
  exactKeys(value, ["decision_text", "rationale", "context_snapshot", "status", "source", "created_at"], path);
  return {
    decision_text: text(value.decision_text, `${path}_decision_text`, 20_000),
    rationale: optionalText(value.rationale, `${path}_rationale`, 20_000),
    context_snapshot: jsonValue(value.context_snapshot, `${path}_context_snapshot`, 50_000),
    status: enumText(value.status, decisionStatuses, `${path}_status`),
    source: enumText(value.source, decisionSources, `${path}_source`),
    created_at: timestamp(value.created_at, `${path}_created_at`),
  };
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const object = value as JsonObject;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
}

async function record(kind: string, data: JsonObject): Promise<PortableBrainRecord> {
  return { record_key: await sha256Identifier(`${kind}\n${stableStringify(data)}`), data };
}

async function records(kind: string, values: JsonObject[], normalize: (value: JsonObject, path: string) => JsonObject): Promise<PortableBrainRecord[]> {
  const normalized = await Promise.all(values.map((value, index) => record(kind, normalize(value, `${kind}_${index}`))));
  return normalized.sort((left, right) => left.record_key.localeCompare(right.record_key));
}

export async function createPortableBrainPackage(input: PortableBrainInput): Promise<PortableBrainPackage> {
  if (input.facts.length > limits.facts || input.patterns.length > limits.patterns || input.decisions.length > limits.decisions) {
    throw new Error("portable_brain_record_limit");
  }
  const normalizedRecords = {
    facts: await records("fact", input.facts, normalizeFact),
    patterns: await records("pattern", input.patterns, normalizePattern),
    decisions: await records("decision", input.decisions, normalizeDecision),
  };
  const core = { schema_version: PORTABLE_BRAIN_SCHEMA, scope: PORTABLE_BRAIN_SCOPE, records: normalizedRecords };
  const contentSha256 = await sha256Identifier(stableStringify(core));
  return {
    ...core,
    manifest: {
      content_sha256: contentSha256,
      counts: {
        facts: normalizedRecords.facts.length,
        patterns: normalizedRecords.patterns.length,
        decisions: normalizedRecords.decisions.length,
        total: normalizedRecords.facts.length + normalizedRecords.patterns.length + normalizedRecords.decisions.length,
      },
    },
  };
}

export async function validatePortableBrainPackage(value: unknown): Promise<PortableBrainPackage> {
  if (!isObject(value)) throw new Error("portable_brain_invalid");
  exactKeys(value, ["schema_version", "scope", "records", "manifest"], "package");
  if (value.schema_version !== PORTABLE_BRAIN_SCHEMA || value.scope !== PORTABLE_BRAIN_SCOPE) {
    throw new Error("portable_brain_version_unsupported");
  }
  if (!isObject(value.records) || !isObject(value.manifest)) throw new Error("portable_brain_invalid");
  exactKeys(value.records, ["facts", "patterns", "decisions"], "records");
  exactKeys(value.manifest, ["content_sha256", "counts"], "manifest");
  if (!Array.isArray(value.records.facts) || !Array.isArray(value.records.patterns) || !Array.isArray(value.records.decisions)) {
    throw new Error("portable_brain_invalid");
  }
  if (!isObject(value.manifest.counts)) throw new Error("portable_brain_invalid");
  exactKeys(value.manifest.counts, ["facts", "patterns", "decisions", "total"], "manifest_counts");

  const extract = (kind: string, values: unknown[], normalize: (item: JsonObject, path: string) => JsonObject): PortableBrainRecord[] => {
    if (values.length > limits[`${kind}s` as keyof typeof limits]) throw new Error("portable_brain_record_limit");
    return values.map((item, index) => {
      if (!isObject(item)) throw new Error(`${kind}_${index}_invalid`);
      exactKeys(item, ["record_key", "data"], `${kind}_${index}`);
      if (!/^[0-9a-f]{64}$/.test(text(item.record_key, `${kind}_${index}_record_key`, 64))) throw new Error(`${kind}_${index}_record_key_invalid`);
      if (!isObject(item.data)) throw new Error(`${kind}_${index}_data_invalid`);
      return { record_key: item.record_key as string, data: normalize(item.data, `${kind}_${index}`) };
    }).sort((left, right) => left.record_key.localeCompare(right.record_key));
  };

  const normalizedRecords = {
    facts: extract("fact", value.records.facts, normalizeFact),
    patterns: extract("pattern", value.records.patterns, normalizePattern),
    decisions: extract("decision", value.records.decisions, normalizeDecision),
  };
  const allKeys = Object.values(normalizedRecords).flat().map((item) => item.record_key);
  if (new Set(allKeys).size !== allKeys.length) throw new Error("portable_brain_duplicate_record_key");

  for (const [kind, values] of Object.entries(normalizedRecords)) {
    for (const item of values) {
      const expected = await record(kind.slice(0, -1), item.data);
      if (expected.record_key !== item.record_key) throw new Error("portable_brain_record_integrity_failed");
    }
  }
  const core = { schema_version: PORTABLE_BRAIN_SCHEMA, scope: PORTABLE_BRAIN_SCOPE, records: normalizedRecords };
  const contentSha256 = await sha256Identifier(stableStringify(core));
  if (value.manifest.content_sha256 !== contentSha256) throw new Error("portable_brain_manifest_integrity_failed");

  const counts = {
    facts: normalizedRecords.facts.length,
    patterns: normalizedRecords.patterns.length,
    decisions: normalizedRecords.decisions.length,
    total: allKeys.length,
  };
  if (JSON.stringify(value.manifest.counts) !== JSON.stringify(counts)) throw new Error("portable_brain_counts_invalid");
  return { ...core, manifest: { content_sha256: contentSha256, counts } };
}
