import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, getDefaultSender } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sends a small "delivery is working" test email to the user's configured
 * Edge delivery address so they can verify Resend wiring without having to
 * generate a real artifact.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const recipient: string = (body?.email ?? "").trim() || user.email || "";

    if (!recipient) {
      return new Response(
        JSON.stringify({ error: "No email address available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color:#0f172a;">
        <h2 style="margin: 0 0 12px; font-size: 18px;">Mindmaker delivery is working ✅</h2>
        <p style="font-size: 14px; line-height: 1.5; color:#334155;">
          You're all set. Edge artifacts (memos, strategy docs, briefings) will
          arrive at <strong>${recipient}</strong> when you generate them.
        </p>
        <p style="font-size: 12px; color:#64748b; margin-top: 24px;">
          You can change this address any time in Settings → Edge Pro.
        </p>
      </div>
    `;

    const result = await sendEmail({
      from: getDefaultSender("notification"),
      to: recipient,
      subject: "✅ Mindmaker delivery test",
      html,
      emailType: "edge_test",
      metadata: { user_id: user.id },
      tags: [{ name: "email_type", value: "edge_test" }],
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error ?? "Email failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id, sent_to: recipient }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-edge-test-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
