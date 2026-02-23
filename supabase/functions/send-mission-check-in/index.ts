import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, getDefaultSender, createEmailTemplate, createEmailButton, getAppUrl } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find missions due for check-in (check_in_date <= today, status = active)
    const today = new Date().toISOString().split("T")[0];

    const { data: dueMissions, error: fetchError } = await supabase
      .from("leader_missions")
      .select(`
        id,
        leader_id,
        mission_text,
        check_in_date,
        status,
        created_at,
        leaders!inner (
          email,
          name
        )
      `)
      .eq("status", "active")
      .lte("check_in_date", today);

    if (fetchError) {
      console.error("Error fetching due missions:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dueMissions || dueMissions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No missions due for check-in", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appUrl = getAppUrl();
    let sentCount = 0;

    for (const mission of dueMissions) {
      const leader = (mission as any).leaders;
      if (!leader?.email) continue;

      const firstName = leader.name?.split(" ")[0] || "there";
      const completeUrl = `${appUrl}/mission-check-in?missionId=${mission.id}&action=complete`;
      const extendUrl = `${appUrl}/mission-check-in?missionId=${mission.id}&action=extend`;
      const helpUrl = `${appUrl}/booking?source=mission-help&missionId=${mission.id}&email=${encodeURIComponent(leader.email)}`;

      const emailContent = `
        <p>Hey ${firstName},</p>
        <p>Your mission check-in is here. Here's what you committed to:</p>
        <blockquote style="border-left: 3px solid #10b981; padding-left: 12px; margin: 16px 0; color: #374151; font-style: italic;">
          ${mission.mission_text}
        </blockquote>
        <p><strong>How did it go?</strong></p>
        <div style="margin: 20px 0;">
          ${createEmailButton(completeUrl, "✅ I Did It", "#10b981")}
          ${createEmailButton(extendUrl, "⏰ Need More Time", "#3b82f6")}
          ${createEmailButton(helpUrl, "💬 I Need Help", "#6b7280")}
        </div>
        <p style="font-size: 13px; color: #6b7280;">
          This takes 30 seconds. Your response helps us personalize your next mission.
        </p>
      `;

      const result = await sendEmail({
        from: getDefaultSender("reminder"),
        to: leader.email,
        subject: `Mission check-in: How did it go?`,
        html: createEmailTemplate(emailContent, "Mission Check-in"),
        emailType: "reminder",
        metadata: {
          mission_id: mission.id,
          leader_id: mission.leader_id,
        },
        tags: [
          { name: "email_type", value: "mission_check_in" },
        ],
      });

      if (result.success) sentCount++;
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${sentCount} mission check-in emails`,
        sent: sentCount,
        total: dueMissions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-mission-check-in:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
