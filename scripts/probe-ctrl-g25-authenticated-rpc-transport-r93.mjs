const url = process.env.CTRL_PROBE_SUPABASE_URL;
const key = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;

if (!url || !key || !password) {
  console.error("Set the isolated project URL, publishable key and transient fixture password.");
  process.exit(2);
}

const userA = {
  id: "00000000-0000-4000-8000-000000000293",
  email: "r93-http-a@example.invalid",
};
const userB = {
  id: "00000000-0000-4000-8000-000000000294",
  email: "r93-http-b@example.invalid",
};
const factA = "00000000-0000-4000-8000-000000000493";
const factB = "00000000-0000-4000-8000-000000000494";
const caseA = "00000000-0000-4000-8000-000000000593";
const caseB = "00000000-0000-4000-8000-000000000594";
const absentId = "00000000-0000-4000-8000-000000009999";

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) {
    return {
      status: response.status,
      code: body?.error_code ?? body?.code ?? null,
      token: null,
    };
  }
  return { status: response.status, code: null, token: body.access_token };
}

async function rpc(token, name, functionName, body) {
  try {
    const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return {
      name,
      status: response.status,
      ok: response.ok,
      code: parsed && !Array.isArray(parsed) ? parsed.code ?? null : null,
      result_shape: Array.isArray(parsed) ? `array:${parsed.length}` : typeof parsed,
      scalar: ["boolean", "number"].includes(typeof parsed) ? parsed : null,
    };
  } catch (error) {
    return { name, transport_error: String(error) };
  }
}

const loginA = await signIn(userA.email);
const loginB = await signIn(userB.email);
const results = [
  { name: "login_a", status: loginA.status, ok: Boolean(loginA.token), code: loginA.code },
  { name: "login_b", status: loginB.status, ok: Boolean(loginB.token), code: loginB.code },
];

if (loginA.token && loginB.token) {
  results.push(
    await rpc(loginA.token, "pending_owned", "get_pending_verifications", { p_user_id: userA.id }),
    await rpc(loginA.token, "pending_cross_subject_denied", "get_pending_verifications", { p_user_id: userB.id }),
    await rpc(loginA.token, "track_record_owned", "get_track_record", { p_user_id: userA.id }),
    await rpc(loginA.token, "track_record_cross_subject_denied", "get_track_record", { p_user_id: userB.id }),
    await rpc(loginA.token, "mcp_tokens_owned", "list_mcp_tokens", {}),
    await rpc(loginA.token, "verify_owned", "verify_memory_fact", {
      p_fact_id: factA,
      p_new_value: null,
      p_is_correct: true,
    }),
    await rpc(loginA.token, "verify_cross_subject_safe", "verify_memory_fact", {
      p_fact_id: factB,
      p_new_value: null,
      p_is_correct: true,
    }),
    await rpc(loginA.token, "verify_absent_safe", "verify_memory_fact", {
      p_fact_id: absentId,
      p_new_value: null,
      p_is_correct: true,
    }),
    await rpc(loginA.token, "pin_owned", "pin_decision", { p_case_id: caseA }),
    await rpc(loginA.token, "pin_cross_subject_denied", "pin_decision", { p_case_id: caseB }),
    await rpc(loginA.token, "pin_absent_denied", "pin_decision", { p_case_id: absentId }),
  );
}

console.log(JSON.stringify(results));
