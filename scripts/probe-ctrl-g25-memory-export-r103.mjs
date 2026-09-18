import { randomBytes, randomUUID } from "node:crypto";

const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.CTRL_PROBE_SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) {
  console.error("Set the isolated project URL plus transient publishable and secret keys.");
  process.exit(2);
}

const suffix = randomUUID();
const password = `R103-${randomBytes(24).toString("base64url")}`;
const people = [
  { label: "A", email: `r103-a-${suffix}@example.invalid`, marker: `R103_OWNER_A_${suffix}` },
  { label: "B", email: `r103-b-${suffix}@example.invalid`, marker: `R103_OWNER_B_${suffix}` },
];
const createdUsers = [];
const createdFacts = [];

const json = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
};

async function createUser(person) {
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: person.email, password, email_confirm: true }),
  });
  const body = await json(response);
  if (!response.ok || !body?.id) throw new Error(`create_user_${person.label}:${response.status}`);
  createdUsers.push(body.id);
  return body.id;
}

async function signIn(person) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: person.email, password }),
  });
  const body = await json(response);
  if (!response.ok || !body?.access_token) throw new Error(`sign_in_${person.label}:${response.status}`);
  return body.access_token;
}

async function insertFact(userId, token, person) {
  const response = await fetch(`${url}/rest/v1/user_memory?select=id`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      fact_key: `r103_${person.label.toLowerCase()}_${suffix}`,
      fact_category: "identity",
      fact_label: "Name",
      fact_value: person.marker,
      temperature: "hot",
      importance: 9,
      verification_status: "verified",
      source_type: "manual",
    }),
  });
  const body = await json(response);
  if (!response.ok || !Array.isArray(body) || !body[0]?.id) throw new Error(`insert_fact_${person.label}:${response.status}`);
  createdFacts.push(body[0].id);
  return body[0].id;
}

async function invoke(token, body, method = "POST") {
  const response = await fetch(`${url}/functions/v1/memory-export`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  return { response, body: await json(response) };
}

async function readReliance(token, factId) {
  const response = await fetch(`${url}/rest/v1/user_memory?id=eq.${factId}&select=reference_count,last_referenced_at`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
  });
  const body = await json(response);
  if (!response.ok || !Array.isArray(body) || !body[0]) throw new Error(`read_reliance:${response.status}`);
  return body[0];
}

async function cleanup() {
  if (createdFacts.length) {
    await fetch(`${url}/rest/v1/user_memory?id=in.(${createdFacts.join(",")})`, {
      method: "DELETE",
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
    });
  }
  for (const userId of createdUsers) {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
    });
  }
}

let result;
try {
  const userA = await createUser(people[0]);
  const userB = await createUser(people[1]);
  const tokenA = await signIn(people[0]);
  const tokenB = await signIn(people[1]);
  const factA = await insertFact(userA, tokenA, people[0]);
  await insertFact(userB, tokenB, people[1]);

  const anonymous = await invoke(null, { format: "markdown" });
  const owner = await invoke(tokenA, { format: "markdown", useCase: "general", maxTokens: 4000 });
  const invalidFormat = await invoke(tokenA, { format: "raw" });
  const invalidBudget = await invoke(tokenA, { format: "markdown", maxTokens: 50_000 });
  const wrongMethod = await invoke(tokenA, {}, "GET");
  const reliance = await readReliance(tokenA, factA);

  result = {
    anonymous_status: anonymous.response.status,
    owner_status: owner.response.status,
    owner_fact_count: owner.body?.factCount ?? null,
    owner_pattern_count: owner.body?.patternCount ?? null,
    owner_decision_count: owner.body?.decisionCount ?? null,
    owner_marker_present: typeof owner.body?.context === "string" && owner.body.context.includes(people[0].marker),
    cross_subject_marker_absent: typeof owner.body?.context === "string" && !owner.body.context.includes(people[1].marker),
    touched_fact_count: Array.isArray(owner.body?.touchedFactIds) ? owner.body.touchedFactIds.length : null,
    primary_filename_present: typeof owner.body?.primary_filename === "string" && owner.body.primary_filename.length > 0,
    invalid_format_status: invalidFormat.response.status,
    invalid_budget_status: invalidBudget.response.status,
    wrong_method_status: wrongMethod.response.status,
    reliance_reference_count: reliance.reference_count,
    reliance_timestamp_present: typeof reliance.last_referenced_at === "string",
  };
} finally {
  await cleanup();
}

console.log(JSON.stringify(result));
