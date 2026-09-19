const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userAId = process.env.CTRL_PROBE_USER_A_ID;
const userBId = process.env.CTRL_PROBE_USER_B_ID;
if (!url || !publishableKey || !password || !suffix || !userAId || !userBId) {
  console.error("Set the isolated URL, publishable key and transient fixture identity.");
  process.exit(2);
}

const people = [
  { label: "A", id: userAId, email: `r105-a-${suffix}@example.com`, marker: `R105_SOURCE_${suffix}` },
  { label: "B", id: userBId, email: `r105-b-${suffix}@example.com`, marker: `R105_TARGET_GUARD_${suffix}` },
];

const json = async (response) => {
  const value = await response.text();
  try { return JSON.parse(value); } catch { return value; }
};

async function signIn(person) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: person.email, password }),
  });
  const body = await json(response);
  if (!response.ok || !body?.access_token) {
    throw new Error(`sign_in_${person.label}:${response.status}:${body?.error_code ?? body?.code ?? "unknown"}:${body?.msg ?? body?.message ?? "unknown"}`);
  }
  return body.access_token;
}

async function rest(path, token, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  return { response, body: await json(response) };
}

async function insertRows(table, token, rows) {
  const result = await rest(`${table}?select=*`, token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!result.response.ok || !Array.isArray(result.body)) throw new Error(`insert_${table}:${result.response.status}`);
  return result.body;
}

async function invoke(route, token, body, { method = "POST", contentType = "application/json" } = {}) {
  const response = await fetch(`${url}/functions/v1/${route}`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body: method === "POST" ? (contentType === "application/json" ? JSON.stringify(body) : String(body)) : undefined,
  });
  return { response, body: await json(response) };
}

const userA = people[0].id;
const userB = people[1].id;
{
  const tokenA = await signIn(people[0]);
  const tokenB = await signIn(people[1]);

  const [factA] = await insertRows("user_memory", tokenA, [{
    user_id: userA,
    fact_key: `r105_source_${suffix}`,
    fact_category: "preference",
    fact_label: "Quality rule",
    fact_value: people[0].marker,
    fact_context: "Synthetic portable round-trip proof.",
    confidence_score: 0.94,
    is_high_stakes: true,
    temperature: "hot",
    importance: 9,
    verification_status: "verified",
    source_type: "voice",
    tags: ["r105", "portable"],
    fact_subtype: "work_style",
  }]);
  await insertRows("user_patterns", tokenA, [{
    user_id: userA,
    pattern_type: "strength",
    pattern_text: `Pattern ${people[0].marker}`,
    confidence: 0.88,
    evidence_count: 4,
    status: "confirmed",
    explanation: "Synthetic confirmed source pattern.",
  }]);
  await insertRows("user_decisions", tokenA, [{
    user_id: userA,
    decision_text: `Decision ${people[0].marker}`,
    rationale: "Synthetic source rationale.",
    context_snapshot: { proof: "r105" },
    status: "active",
    source: "voice",
  }]);
  await insertRows("user_memory", tokenB, [{
    user_id: userB,
    fact_key: `r105_guard_${suffix}`,
    fact_category: "identity",
    fact_label: "Target guard",
    fact_value: people[1].marker,
    confidence_score: 1,
    temperature: "hot",
    importance: 10,
    verification_status: "verified",
    source_type: "manual",
  }]);

  const anonymousExport = await invoke("brain-portable-export", null, {});
  const firstExport = await invoke("brain-portable-export", tokenA, {});
  const secondExport = await invoke("brain-portable-export", tokenA, {});
  if (!firstExport.response.ok || !firstExport.body?.package) throw new Error(`portable_export:${firstExport.response.status}`);

  const tamperedPackage = JSON.parse(JSON.stringify(firstExport.body.package));
  tamperedPackage.records.facts[0].data.fact_value = "TAMPERED";
  const tamperedImport = await invoke("brain-portable-import", tokenB, { package: tamperedPackage });
  const wrongMedia = await invoke("brain-portable-import", tokenB, "not-json", { contentType: "text/plain" });
  const wrongMethod = await invoke("brain-portable-import", tokenB, null, { method: "GET" });
  const firstImport = await invoke("brain-portable-import", tokenB, { package: firstExport.body.package });
  const secondImport = await invoke("brain-portable-import", tokenB, { package: firstExport.body.package });

  const targetFacts = await rest(`user_memory?user_id=eq.${userB}&select=fact_value,verification_status,source_type,tags,reference_count`, tokenB);
  const sourceFacts = await rest(`user_memory?user_id=eq.${userA}&select=fact_value,verification_status,reference_count`, tokenA);
  const targetPatterns = await rest(`user_patterns?user_id=eq.${userB}&select=pattern_text,status,confidence,evidence_count`, tokenB);
  const targetDecisions = await rest(`user_decisions?user_id=eq.${userB}&select=decision_text,source,context_snapshot`, tokenB);
  const targetReceipts = await rest(`portable_brain_imports?user_id=eq.${userB}&select=package_fingerprint,database_fingerprint,imported_counts`, tokenB);
  const sourceReceipts = await rest(`portable_brain_imports?user_id=eq.${userA}&select=id`, tokenA);

  const importedFact = targetFacts.body.find((row) => row.fact_value === people[0].marker);
  const importedPattern = targetPatterns.body.find((row) => row.pattern_text.includes(people[0].marker));
  const importedDecision = targetDecisions.body.find((row) => row.decision_text.includes(people[0].marker));
  const sourceFact = sourceFacts.body.find((row) => row.fact_value === people[0].marker);

  const result = {
    anonymous_export_status: anonymousExport.response.status,
    export_status: firstExport.response.status,
    export_repeat_status: secondExport.response.status,
    stable_package_fingerprint: firstExport.body.package_fingerprint === secondExport.body.package_fingerprint,
    stable_package_bytes: JSON.stringify(firstExport.body.package) === JSON.stringify(secondExport.body.package),
    package_counts: firstExport.body.package.manifest.counts,
    package_contains_source_user_id: JSON.stringify(firstExport.body.package).includes(userA),
    tampered_import_status: tamperedImport.response.status,
    wrong_media_status: wrongMedia.response.status,
    wrong_method_status: wrongMethod.response.status,
    first_import_status: firstImport.response.status,
    first_import_already_imported: firstImport.body?.already_imported ?? null,
    first_import_counts: firstImport.body?.imported_counts ?? null,
    second_import_status: secondImport.response.status,
    second_import_already_imported: secondImport.body?.already_imported ?? null,
    second_import_counts: secondImport.body?.imported_counts ?? null,
    target_fact_count: targetFacts.body.length,
    target_guard_preserved: targetFacts.body.some((row) => row.fact_value === people[1].marker),
    imported_fact_present: Boolean(importedFact),
    imported_fact_standing: importedFact?.verification_status ?? null,
    imported_fact_source: importedFact?.source_type ?? null,
    imported_fact_portable_tags: importedFact?.tags?.filter((tag) => tag.startsWith("portable-")) ?? [],
    imported_pattern_present: Boolean(importedPattern),
    imported_pattern_standing: importedPattern?.status ?? null,
    imported_pattern_confidence: importedPattern ? Number(importedPattern.confidence) : null,
    imported_pattern_evidence_count: importedPattern?.evidence_count ?? null,
    imported_decision_present: Boolean(importedDecision),
    imported_decision_source: importedDecision?.source ?? null,
    imported_decision_receipt_present: Boolean(importedDecision?.context_snapshot?.portable_import?.record_key),
    source_fact_count: sourceFacts.body.length,
    source_fact_unchanged: sourceFact?.verification_status === "verified",
    source_reliance_count: sourceFact?.reference_count ?? null,
    target_receipt_count: targetReceipts.body.length,
    source_receipt_count: sourceReceipts.body.length,
    source_fact_id_present: Boolean(factA?.id),
  };
  console.log(JSON.stringify(result));
}
