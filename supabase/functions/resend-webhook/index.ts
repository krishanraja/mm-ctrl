import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Validate we're using the correct database
    const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
    if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      const error = `Database validation failed: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Current: ${supabaseUrl}`;
      console.error('❌', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`✅ Database validated: Using Mindmaker AI (${EXPECTED_PROJECT_ID})`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse Resend webhook payload
    const payload = await req.json();
    const eventType = payload.type; // 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained'

    console.log(`📧 Received Resend webhook: ${eventType}`, {
      emailId: payload.data?.email_id,
      recipient: payload.data?.to,
    });

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.unsubscribed': 'unsubscribed',
    };

    const mappedEventType = eventTypeMap[eventType] || eventType.replace('email.', '');

    // Extract email data from payload
    const emailData = payload.data || {};
    const emailId = emailData.email_id || emailData.id;
    const recipientEmail = Array.isArray(emailData.to) ? emailData.to[0] : emailData.to;
    const subject = emailData.subject;

    if (!emailId || !recipientEmail) {
      console.warn('⚠️ Missing required fields in webhook payload:', { emailId, recipientEmail });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract metadata (user_id, session_id, assessment_id, email_type) from tags or metadata
    const tags = emailData.tags || [];
    const metadata = emailData.metadata || {};
    const emailType = metadata.email_type || tags.find((t: any) => t.name === 'email_type')?.value || 'notification';
    
    // Try to find user by email
    let userId: string | null = null;
    if (recipientEmail) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === recipientEmail);
      userId = user?.id || null;
    }

    // Prepare analytics record
    const analyticsRecord: any = {
      email_id: emailId,
      recipient_email: recipientEmail,
      email_type: emailType,
      subject: subject,
      event_type: mappedEventType,
      event_timestamp: emailData.created_at || new Date().toISOString(),
      metadata: {
        ...metadata,
        tags: tags,
        original_event: eventType,
      },
      user_id: userId || metadata.user_id || null,
      session_id: metadata.session_id || null,
      assessment_id: metadata.assessment_id || null,
    };

    // Add event-specific data
    if (mappedEventType === 'clicked') {
      analyticsRecord.click_url = emailData.link || metadata.click_url || null;
    }

    if (mappedEventType === 'bounced') {
      analyticsRecord.bounce_type = emailData.bounce_type || metadata.bounce_type || null;
      analyticsRecord.bounce_reason = emailData.bounce_reason || metadata.bounce_reason || null;
    }

    if (mappedEventType === 'complained') {
      analyticsRecord.complaint_reason = emailData.complaint_reason || metadata.complaint_reason || null;
    }

    // Insert analytics record
    const { error: insertError } = await supabase
      .from('email_analytics')
      .insert(analyticsRecord);

    if (insertError) {
      console.error('❌ Error inserting email analytics:', insertError);
      // Don't fail the webhook - log and continue
    } else {
      console.log(`✅ Email analytics recorded: ${mappedEventType} for ${emailId}`);
    }

    // Return success to Resend
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});







