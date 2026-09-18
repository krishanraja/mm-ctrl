// Branded one-click share-card generator. Renders a 1200x630 PNG for an in-app
// "win" a leader wants to share (a sharpened decision, a calibration streak,
// "my agents now read my live context"). Powers both the downloadable share image
// and the OG image when a leader shares the link. Server-side PNG via resvg-wasm.
//
// GET /share-card?t=<headline>&s=<stat>&l=<sub>   (all url-encoded; text is sanitized)
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { consumeRequestRateLimit } from "../_shared/service-request.ts";
import { publicClientIdentity } from "../_shared/public-request-guard.ts";
import { securityHeaders } from "../_shared/security-headers.ts";

const cors = { "Access-Control-Allow-Origin": "*" };
const W = 1200, H = 630;

let wasmReady: Promise<void> | null = null;
let fontBuf: Uint8Array | null = null;
async function ready() {
  if (!wasmReady) {
    wasmReady = initWasm(fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm"));
  }
  await wasmReady;
  if (!fontBuf) {
    // A bold sans for the card text (resvg has no system fonts in the sandbox).
    const r = await fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf");
    fontBuf = new Uint8Array(await r.arrayBuffer());
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// crude word-wrap for the headline so long wins don't overflow the card
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function svg(t: string, s: string, l: string): string {
  const headlines = wrap(t || "Clarity for leaders", 22);
  const startY = 300 - (headlines.length - 1) * 38;
  const headlineTspans = headlines
    .map((ln, i) => `<text x="80" y="${startY + i * 76}" font-size="64" font-weight="700" fill="#f1f5f4">${esc(ln)}</text>`)
    .join("");
  const stat = s ? `<text x="80" y="160" font-size="92" font-weight="700" fill="#00D9B6">${esc(s)}</text>` : "";
  const sub = l ? `<text x="80" y="${startY + headlines.length * 76 + 24}" font-size="30" font-weight="400" fill="#8a93a3">${esc(l)}</text>` : "";
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial, sans-serif">
    <rect width="${W}" height="${H}" fill="#0a0e12"/>
    <ellipse cx="${W / 2}" cy="-80" rx="640" ry="420" fill="#0d261f"/>
    <ellipse cx="${W / 2}" cy="-80" rx="380" ry="240" fill="#0f3429"/>
    ${stat}
    ${headlineTspans}
    ${sub}
    <text x="80" y="560" font-size="26" font-weight="600" fill="#5b6373">CTRL · makeyourmindup.ai</text>
    <rect x="1040" y="528" width="80" height="6" rx="3" fill="#00D9B6"/>
  </svg>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });
  try {
    if (req.url.length > 2_048) return new Response("Request is too large", { status: 413, headers: cors });
    const identity = publicClientIdentity(req.headers);
    const retryAfter = consumeRequestRateLimit(`share-card:${identity}`, Date.now(), 120, 60_000);
    if (retryAfter > 0) {
      return new Response("Too many requests", {
        status: 429,
        headers: { ...cors, ...securityHeaders, "Retry-After": String(retryAfter) },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response("Service temporarily unavailable", { status: 503, headers: { ...cors, ...securityHeaders } });
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: limitData, error: limitError } = await admin.rpc("check_rate_limit", {
      p_rate_limit_key: `share-card:ip:${identity}`,
      p_max_requests: 600,
      p_window_seconds: 3_600,
    });
    const distributedLimit = Array.isArray(limitData) ? limitData[0] : limitData;
    if (limitError || typeof distributedLimit?.allowed !== "boolean") {
      return new Response("Service temporarily unavailable", { status: 503, headers: { ...cors, ...securityHeaders } });
    }
    if (!distributedLimit.allowed) {
      return new Response("Too many requests", { status: 429, headers: { ...cors, ...securityHeaders } });
    }
    const u = new URL(req.url);
    const t = (u.searchParams.get("t") ?? "").slice(0, 180);
    const s = (u.searchParams.get("s") ?? "").slice(0, 32);
    const l = (u.searchParams.get("l") ?? "").slice(0, 180);
    await ready();
    const resvg = new Resvg(svg(t, s, l), {
      font: { fontBuffers: [fontBuf!], defaultFontFamily: "Inter", loadSystemFonts: false },
    });
    const png = resvg.render().asPng();
    return new Response(png, {
      headers: { ...cors, ...securityHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    return new Response(`share-card error: ${e instanceof Error ? e.message : e}`, { status: 500, headers: cors });
  }
});
