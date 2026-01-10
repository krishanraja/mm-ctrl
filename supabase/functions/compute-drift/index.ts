import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const EXPECTED_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
    if (!supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      throw new Error("Database configuration error (unexpected project).");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Check recent check-ins (last 3 weeks)
    const { data: recentCheckins } = await supabase
      .from("leader_checkins" as never)
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", threeWeeksAgo.toISOString())
      .order("created_at", { ascending: false });

    // Check recent decision captures (last 3 weeks)
    const { data: recentCaptures } = await supabase
      .from("leader_decision_captures" as never)
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", threeWeeksAgo.toISOString())
      .order("created_at", { ascending: false });

    const checkinCount = recentCheckins?.length ?? 0;
    const captureCount = recentCaptures?.length ?? 0;
    const totalActivity = checkinCount + captureCount;

    // Fix Issue 2: Check user's first assessment date for 7-day grace period
    const { data: firstAssessment } = await supabase
      .from("leader_assessments" as never)
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const firstActivityDate = firstAssessment?.created_at 
      ? new Date(firstAssessment.created_at)
      : null;
    const daysSinceFirstActivity = firstActivityDate
      ? Math.floor((now.getTime() - firstActivityDate.getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    const isNewUser = daysSinceFirstActivity < 7;

    let status: "ok" | "drifting" | "stale" = "ok";
    let message = "You're staying engaged with AI decision-making.";

    // Only show drift warning if user has been active for > 7 days
    if (!isNewUser) {
      if (totalActivity === 0) {
        status = "stale";
        message = "You haven't checked in or captured a decision in 3+ weeks. The best time to build the habit is now.";
      } else if (totalActivity < 2) {
        status = "drifting";
        message = "You're drifting. Your last few decisions didn't use AI as a thinking partner. Here's one thing to try this week.";
      }
    }

    // Upsert drift flag (replace any existing for this user)
    const { error: upsertErr } = await supabase
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

    if (upsertErr) {
      console.warn("drift flag upsert failed (non-blocking):", upsertErr);
    }

    // Send drift notification email if status is drifting or stale
    if (status !== "ok") {
      const userEmail = userData?.user?.email;
      if (userEmail) {
        try {
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
            console.log("✅ Drift notification email sent to:", userEmail);
          }
        } catch (emailErr) {
          console.warn("Drift email failed (non-blocking):", emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        message,
        checkin_count: checkinCount,
        capture_count: captureCount,
        computed_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("compute-drift error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
