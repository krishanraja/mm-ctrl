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

    let status: "ok" | "drifting" | "stale" = "ok";
    let message = "You're staying engaged with AI decision-making.";

    if (totalActivity === 0) {
      status = "stale";
      message = "You haven't checked in or captured a decision in 3+ weeks. The best time to build the habit is now.";
    } else if (totalActivity < 2) {
      status = "drifting";
      message = "You're drifting. Your last few decisions didn't use AI as a thinking partner. Here's one thing to try this week.";
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
