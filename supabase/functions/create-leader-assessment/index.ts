import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const {
      contactData,
      assessmentData,
      deepProfileData,
      sessionId,
      source = 'quiz',
      benchmarkScore,
      benchmarkTier,
    } = await req.json();

    console.log('🔐 Creating assessment with service role for:', contactData.email);

    // Step 1: Create or get leader record
    const { data: existingLeader } = await supabase
      .from('leaders')
      .select('*')
      .eq('email', contactData.email)
      .single();

    let leaderId: string;

    if (existingLeader) {
      leaderId = existingLeader.id;
      
      // Update leader details
      await supabase
        .from('leaders')
        .update({
          name: contactData.fullName,
          role: contactData.roleTitle,
          company: contactData.companyName,
          company_size_band: contactData.companySize,
          primary_focus: contactData.primaryFocus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaderId);
    } else {
      const { data: newLeader, error: leaderError } = await supabase
        .from('leaders')
        .insert({
          email: contactData.email,
          name: contactData.fullName,
          role: contactData.roleTitle,
          company: contactData.companyName,
          company_size_band: contactData.companySize,
          primary_focus: contactData.primaryFocus,
        })
        .select()
        .single();

      if (leaderError || !newLeader) {
        throw new Error('Failed to create leader record: ' + leaderError?.message);
      }

      leaderId = newLeader.id;
    }

    console.log('✅ Leader record ready:', leaderId);

    // Step 2: Create leader_assessment record (bypasses RLS with service role)
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .insert({
        leader_id: leaderId,
        source,
        benchmark_score: benchmarkScore,
        benchmark_tier: benchmarkTier,
        learning_style: assessmentData.learningStyle || null,
        has_deep_profile: !!deepProfileData,
        has_full_diagnostic: false,
        session_id: sessionId,
      })
      .select()
      .single();

    if (assessmentError || !assessment) {
      console.error('❌ Assessment creation error:', assessmentError);
      throw new Error('Failed to create assessment: ' + assessmentError?.message);
    }

    console.log('✅ Assessment created with ID:', assessment.id);

    return new Response(
      JSON.stringify({
        success: true,
        assessmentId: assessment.id,
        leaderId: leaderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in create-leader-assessment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
