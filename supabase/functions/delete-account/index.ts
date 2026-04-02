/**
 * Delete Account Edge Function
 *
 * Server-side account deletion for GDPR Art. 17 (Right to Erasure).
 * Performs cascading deletion of all user data with full audit trail.
 *
 * Requires authenticated user JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user-scoped client to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Verify confirmation email matches (extra safety)
    const body = await req.json().catch(() => ({}));
    if (body.confirmEmail && body.confirmEmail.toLowerCase() !== userEmail?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email confirmation does not match' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for deletions (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Log deletion request to security audit
    await supabaseAdmin.from('security_audit_log').insert({
      action: 'ACCOUNT_DELETION_REQUESTED',
      resource_type: 'user',
      resource_id: userId,
      user_id: userId,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      details: { email: userEmail, timestamp: new Date().toISOString() },
    }).catch(() => {});

    const deletionErrors: string[] = [];

    // 1. Delete assessment-related data (respecting FK constraints)
    const { data: assessments } = await supabaseAdmin
      .from('leader_assessments')
      .select('id')
      .eq('owner_user_id', userId);

    if (assessments?.length) {
      const assessmentIds = assessments.map((a: { id: string }) => a.id);

      const childDeletes = await Promise.allSettled([
        supabaseAdmin.from('leader_dimension_scores').delete().in('assessment_id', assessmentIds),
        supabaseAdmin.from('leader_risk_signals').delete().in('assessment_id', assessmentIds),
        supabaseAdmin.from('leader_tensions').delete().in('assessment_id', assessmentIds),
        supabaseAdmin.from('leader_org_scenarios').delete().in('assessment_id', assessmentIds),
        supabaseAdmin.from('leader_first_moves').delete().in('assessment_id', assessmentIds),
        supabaseAdmin.from('leader_prompt_sets').delete().in('assessment_id', assessmentIds),
      ]);

      childDeletes.forEach((result, i) => {
        if (result.status === 'rejected') {
          deletionErrors.push(`assessment_child_${i}: ${result.reason}`);
        }
      });

      const { error: assessmentError } = await supabaseAdmin
        .from('leader_assessments')
        .delete()
        .eq('owner_user_id', userId);
      if (assessmentError) deletionErrors.push(`leader_assessments: ${assessmentError.message}`);
    }

    // 2. Delete user data tables
    const userDataDeletes = await Promise.allSettled([
      supabaseAdmin.from('user_memory').delete().eq('user_id', userId),
      supabaseAdmin.from('user_memory_settings').delete().eq('user_id', userId),
      supabaseAdmin.from('user_patterns').delete().eq('user_id', userId),
      supabaseAdmin.from('user_decisions').delete().eq('user_id', userId),
      supabaseAdmin.from('weekly_checkins').delete().eq('user_id', userId),
      supabaseAdmin.from('ai_conversations').delete().eq('user_id', userId),
      supabaseAdmin.from('conversation_sessions').delete().eq('user_id', userId),
      supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId),
      supabaseAdmin.from('leader_missions').delete().eq('user_id', userId),
      supabaseAdmin.from('briefings').delete().eq('user_id', userId),
    ]);

    userDataDeletes.forEach((result, i) => {
      if (result.status === 'rejected') {
        deletionErrors.push(`user_data_${i}: ${result.reason}`);
      }
    });

    // 3. Delete profile last (FK parent)
    const { error: profileError } = await supabaseAdmin
      .from('leaders')
      .delete()
      .eq('user_id', userId);
    if (profileError) deletionErrors.push(`leaders: ${profileError.message}`);

    // 4. Log successful deletion to audit
    await supabaseAdmin.from('data_audit_log').insert({
      user_id: userId,
      action_type: 'DELETE',
      table_name: 'ALL_USER_DATA',
      metadata: {
        email: userEmail,
        deletion_errors: deletionErrors.length > 0 ? deletionErrors : null,
        completed_at: new Date().toISOString(),
      },
    }).catch(() => {});

    // Log completion to security audit
    await supabaseAdmin.from('security_audit_log').insert({
      action: 'ACCOUNT_DELETION_COMPLETED',
      resource_type: 'user',
      resource_id: userId,
      user_id: userId,
      details: {
        email: userEmail,
        errors: deletionErrors.length > 0 ? deletionErrors : null,
        completed_at: new Date().toISOString(),
      },
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account and all associated data have been deleted',
        errors: deletionErrors.length > 0 ? deletionErrors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete account. Please contact support.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
