import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Batch drift detection for all users
 * Designed to be called via cron job (e.g., weekly on Mondays)
 * 
 * Checks all users who:
 * - Have completed at least one assessment
 * - Haven't had any activity (checkins or captures) in 3 weeks
 * - Haven't been notified about drift in the last 7 days
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const EXPECTED_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
    if (!supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      throw new Error("Database configuration error (unexpected project).");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const now = new Date();
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get users with assessments (they've engaged with the tool)
    const { data: assessments, error: assessmentsErr } = await supabase
      .from("leader_assessments")
      .select("owner_user_id")
      .not("owner_user_id", "is", null);

    if (assessmentsErr) {
      throw new Error(`Failed to fetch assessments: ${assessmentsErr.message}`);
    }

    // Get unique user IDs
    const userIds = [...new Set(assessments?.map(a => a.owner_user_id).filter(Boolean) || [])];
    console.log(`📊 Checking drift for ${userIds.length} users`);

    const driftingUsers: string[] = [];
    const staleUsers: string[] = [];
    const emailsSent: string[] = [];

    for (const userId of userIds) {
      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;

      if (!userEmail) continue;

      // Check recent check-ins (last 3 weeks)
      const { data: recentCheckins } = await supabase
        .from("leader_checkins" as never)
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", threeWeeksAgo.toISOString());

      // Check recent decision captures (last 3 weeks)
      const { data: recentCaptures } = await supabase
        .from("leader_decision_captures" as never)
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", threeWeeksAgo.toISOString());

      const checkinCount = recentCheckins?.length ?? 0;
      const captureCount = recentCaptures?.length ?? 0;
      const totalActivity = checkinCount + captureCount;

      let status: "ok" | "drifting" | "stale" = "ok";
      let message = "You're staying engaged with AI decision-making.";

      if (totalActivity === 0) {
        status = "stale";
        message = "You haven't checked in or captured a decision in 3+ weeks. The best time to build the habit is now.";
        staleUsers.push(userEmail);
      } else if (totalActivity < 2) {
        status = "drifting";
        message = "You're drifting. Your last few decisions didn't use AI as a thinking partner.";
        driftingUsers.push(userEmail);
      }

      if (status !== "ok") {
        // Check if we already notified recently
        const { data: recentFlag } = await supabase
          .from("leader_drift_flags" as never)
          .select("computed_at")
          .eq("user_id", userId)
          .single();

        const lastNotified = recentFlag?.computed_at ? new Date(recentFlag.computed_at) : null;
        const shouldNotify = !lastNotified || lastNotified < oneWeekAgo;

        if (shouldNotify) {
          // Upsert drift flag
          await supabase
            .from("leader_drift_flags" as never)
            .upsert({
              user_id: userId,
              status,
              message: message.slice(0, 1000),
              computed_at: now.toISOString(),
            } as never, {
              onConflict: "user_id",
              ignoreDuplicates: false,
            } as never);

          // Send email
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            const origin = Deno.env.get("PUBLIC_SITE_URL") || "https://themindmaker.ai";
            const checkinLink = `${origin.replace(/\/$/, "")}/checkin`;

            const emailHtml = `
              <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f8fafc; padding:24px;">
                <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                  <h2 style="margin:0 0 12px; color:#0f172a; font-size:18px;">You're drifting 📉</h2>
                  <p style="margin:0 0 16px; color:#475569; line-height:1.5;">
                    ${message}
                  </p>
                  <p style="margin:0 0 16px; color:#475569; line-height:1.5;">
                    <strong>This week:</strong> Before your next meeting with data or AI, ask: "What would we do differently if we had 10x the data?" Note what happens.
                  </p>
                  <a href="${checkinLink}" style="display:inline-block; background:#0f172a; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
                    Do a 30s check-in
                  </a>
                  <p style="margin:16px 0 0; color:#94a3b8; font-size:12px;">
                    This is what a good advisor would do. It's uncomfortable but valuable.
                  </p>
                </div>
              </div>
            `;

            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "MindMaker <no-reply@themindmaker.ai>",
                  to: [userEmail],
                  subject: status === "stale" ? "You've gone quiet on AI 📉" : "You're drifting 📉",
                  html: emailHtml,
                }),
              });
              emailsSent.push(userEmail);
            } catch (emailErr) {
              console.warn(`Email failed for ${userEmail}:`, emailErr);
            }
          }
        }
      }
    }

    console.log(`✅ Batch drift check complete: ${driftingUsers.length} drifting, ${staleUsers.length} stale, ${emailsSent.length} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        total_users: userIds.length,
        drifting_count: driftingUsers.length,
        stale_count: staleUsers.length,
        emails_sent: emailsSent.length,
        computed_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("batch-compute-drift error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


