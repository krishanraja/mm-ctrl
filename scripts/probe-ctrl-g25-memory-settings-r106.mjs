const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userA = process.env.CTRL_PROBE_USER_A_ID;
const userB = process.env.CTRL_PROBE_USER_B_ID;
if (!url || !publishableKey || !password || !suffix || !userA || !userB) {
  console.error("Set the isolated URL, publishable key and transient fixture identity.");
  process.exit(2);
}

const people = [
  { label: "A", id: userA, email: `r106-a-${suffix}@example.com` },
  { label: "B", id: userB, email: `r106-b-${suffix}@example.com` },
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
    throw new Error(`sign_in_${person.label}:${response.status}:${body?.error_code ?? body?.code ?? "unknown"}`);
  }
  return body.access_token;
}

async function invoke(token, { method = "GET", body, contentType = "application/json" } = {}) {
  const response = await fetch(`${url}/functions/v1/memory-settings`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined && contentType ? { "Content-Type": contentType } : {}),
    },
    body: body === undefined ? undefined : (contentType === "application/json" ? JSON.stringify(body) : String(body)),
  });
  return { response, body: await json(response) };
}

async function readRows(token, query = "") {
  const response = await fetch(`${url}/rest/v1/user_memory_settings?select=user_id,store_memory_enabled,store_voice_transcripts,auto_summarize_enabled,retention_days${query}`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
  });
  const body = await json(response);
  if (!response.ok || !Array.isArray(body)) throw new Error(`read_rows:${response.status}`);
  return body;
}

const tokenA = await signIn(people[0]);
const tokenB = await signIn(people[1]);

const anonymous = await invoke(null);
const emptyA = await invoke(tokenA);
const emptyB = await invoke(tokenB);
const rowsBefore = await readRows(tokenA);
const writeA = await invoke(tokenA, {
  method: "PUT",
  body: {
    store_memory_enabled: false,
    store_voice_transcripts: false,
    auto_summarize_enabled: false,
    retention_days: 30,
  },
});
const retryA = await invoke(tokenA, { method: "PUT", body: { retention_days: 30 } });
const writeB = await invoke(tokenB, { method: "PUT", body: { retention_days: 90 } });
const readA = await invoke(tokenA);
const readB = await invoke(tokenB);
const rowsA = await readRows(tokenA);
const crossRowsA = await readRows(tokenA, `&user_id=eq.${userB}`);
const rowsB = await readRows(tokenB);
const invalidBoolean = await invoke(tokenA, { method: "PUT", body: { store_memory_enabled: "false" } });
const invalidExtra = await invoke(tokenA, { method: "PUT", body: { retention_days: 30, target_user_id: userB } });
const invalidRetention = await invoke(tokenA, { method: "PUT", body: { retention_days: 365 } });
const wrongMedia = await invoke(tokenA, { method: "PUT", body: "not-json", contentType: "text/plain" });
const wrongMethod = await invoke(tokenA, { method: "DELETE" });
const cacheAction = await invoke(tokenA, { method: "POST", body: { action: "clear_local_cache" } });
const oversized = await invoke(tokenA, { method: "PUT", body: { store_memory_enabled: false, padding: "x".repeat(5_000) } });

console.log(JSON.stringify({
  anonymous_status: anonymous.response.status,
  empty_a_status: emptyA.response.status,
  empty_a_persisted: emptyA.body?.settings?.persisted ?? null,
  empty_b_status: emptyB.response.status,
  empty_b_persisted: emptyB.body?.settings?.persisted ?? null,
  row_count_before_write: rowsBefore.length,
  write_a_status: writeA.response.status,
  write_a_settings: writeA.body?.settings ?? null,
  retry_a_status: retryA.response.status,
  write_b_status: writeB.response.status,
  read_a_status: readA.response.status,
  read_a_settings: readA.body?.settings ?? null,
  read_b_status: readB.response.status,
  read_b_settings: readB.body?.settings ?? null,
  owner_a_visible_rows: rowsA.length,
  owner_b_visible_rows: rowsB.length,
  owner_a_cross_subject_rows: crossRowsA.length,
  invalid_boolean_status: invalidBoolean.response.status,
  invalid_extra_status: invalidExtra.response.status,
  invalid_retention_status: invalidRetention.response.status,
  wrong_media_status: wrongMedia.response.status,
  wrong_method_status: wrongMethod.response.status,
  cache_action_status: cacheAction.response.status,
  cache_action: cacheAction.body?.action ?? null,
  cache_key_count: Array.isArray(cacheAction.body?.keys_to_clear) ? cacheAction.body.keys_to_clear.length : null,
  oversized_status: oversized.response.status,
}));
