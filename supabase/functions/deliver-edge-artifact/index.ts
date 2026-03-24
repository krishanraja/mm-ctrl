import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, getDefaultSender } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAPABILITY_EMOJI: Record<string, string> = {
  board_memo: "📋",
  strategy_doc: "🎯",
  email: "✉️",
  meeting_agenda: "📅",
  framework: "🏗️",
  teaching_doc: "📖",
};

const CAPABILITY_LABEL: Record<string, string> = {
  board_memo: "Board Memo",
  strategy_doc: "Strategy Document",
  email: "Email Draft",
  meeting_agenda: "Meeting Agenda",
  framework: "Framework",
  teaching_doc: "Teaching Document",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { actionId, email } = await req.json();
    if (!actionId || !email) {
      return new Response(
        JSON.stringify({ error: "actionId and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch the action
    const { data: action, error: fetchError } = await serviceClient
      .from("edge_actions")
      .select("*")
      .eq("id", actionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !action) {
      return new Response(
        JSON.stringify({ error: "Action not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Convert markdown content to HTML
    const htmlContent = markdownToHtml(action.output_content || "");
    const emoji = CAPABILITY_EMOJI[action.capability_key] || "📄";
    const label = CAPABILITY_LABEL[action.capability_key] || "Document";
    const subjectTitle = extractFirstHeading(action.output_content || "") || label;

    // Build email HTML
    const emailHtml = buildArtifactEmail(htmlContent, label, emoji);

    // Send email
    const result = await sendEmail({
      from: getDefaultSender("notification"),
      to: email,
      subject: `${emoji} ${subjectTitle} — Draft from Mindmaker`,
      html: emailHtml,
      emailType: "edge_artifact",
      metadata: {
        user_id: user.id,
        action_id: actionId,
        capability: action.capability_key,
      },
      tags: [
        { name: "email_type", value: "edge_artifact" },
        { name: "capability", value: action.capability_key },
      ],
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update action record with delivery info
    await serviceClient
      .from("edge_actions")
      .update({
        delivered_via: action.delivered_via === "app" ? "both" : "email",
        delivered_to_email: email,
      })
      .eq("id", actionId);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("deliver-edge-artifact error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/**
 * Convert basic markdown to HTML for email rendering
 */
function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 20px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 24px 0 10px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 16px;">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #0f172a;">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li style="margin: 4px 0; color: #475569;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="padding-left: 20px; margin: 8px 0;">${match}</ul>`)
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="margin: 4px 0; color: #475569;">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hulo]|<li|<hr)(.+)$/gm, '<p style="margin: 8px 0; color: #475569; line-height: 1.6;">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '');
}

/**
 * Extract the first heading from markdown for email subject
 */
function extractFirstHeading(md: string): string | null {
  const match = md.match(/^#+\s+(.+)$/m);
  return match ? match[1].replace(/\*\*/g, '').trim() : null;
}

/**
 * Build the full artifact email HTML
 */
function buildArtifactEmail(contentHtml: string, label: string, emoji: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${label} — Mindmaker</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 640px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #0f172a, #1e293b); padding: 8px 20px; border-radius: 100px;">
        <span style="color: #00D9B6; font-weight: 600; font-size: 14px;">Mindmaker</span>
      </div>
    </div>

    <!-- Artifact type badge -->
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background: #f1f5f9; padding: 6px 16px; border-radius: 100px; font-size: 13px; color: #64748b;">
        ${emoji} ${label}
      </span>
    </div>

    <!-- Content card -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      ${contentHtml}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0 0 8px;">Generated by your Edge profile in Mindmaker.</p>
      <p style="margin: 0;">This is a draft — review and edit before sharing.</p>
    </div>
  </div>
</body>
</html>`;
}
