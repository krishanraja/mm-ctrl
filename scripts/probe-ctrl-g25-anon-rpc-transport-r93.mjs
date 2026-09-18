const url = process.env.CTRL_PROBE_SUPABASE_URL;
const key = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Set CTRL_PROBE_SUPABASE_URL and CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY for the isolated target.");
  process.exit(2);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const absentId = "00000000-0000-4000-8000-000000009999";
const tests = [
  ["share_public", "get_share_card", { p_id: absentId }],
  ["intake_public", "get_intake_for_registration", { intake_uuid: absentId }],
  ["role_helper_not_public_api", "has_role", { _user_id: absentId, _role: "facilitator" }],
  ["pending_denied", "get_pending_verifications", { p_user_id: absentId }],
  ["verify_denied", "verify_memory_fact", { p_fact_id: absentId, p_new_value: null, p_is_correct: true }],
  ["pin_denied", "pin_decision", { p_case_id: absentId }],
];

const results = [];
for (const [name, functionName, body] of tests) {
  try {
    const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    results.push({
      name,
      status: response.status,
      ok: response.ok,
      code: parsed && !Array.isArray(parsed) ? parsed.code ?? null : null,
      result_shape: Array.isArray(parsed) ? `array:${parsed.length}` : typeof parsed,
    });
  } catch (error) {
    results.push({ name, transport_error: String(error) });
  }
}

console.log(JSON.stringify(results));
