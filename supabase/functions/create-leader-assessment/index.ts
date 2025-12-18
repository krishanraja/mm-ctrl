import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 create-leader-assessment invoked');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const requestBody = await req.json();
    const sessionId = requestBody.sessionId || 'anonymous';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const {
      contactData = {},
      assessmentData = {},
      deepProfileData,
      source = 'quiz',
      benchmarkScore,
      benchmarkTier,
    } = requestBody;

    // Handle empty/invalid email: generate pseudo-email for anonymous users
    let leaderEmail = contactData?.email?.trim() || '';
    if (!leaderEmail || !leaderEmail.includes('@')) {
      leaderEmail = `anon+${sessionId}@anon.local`;
    }

    console.log('🔐 Creating assessment for email:', leaderEmail);

    // Create or get leader record with upsert for race condition protection
    const { data: leader, error: leaderError } = await supabase
      .from('leaders')
      .upsert({
        email: leaderEmail,
        name: contactData.fullName,
        role: contactData.roleTitle,
        company: contactData.companyName,
        company_size_band: contactData.companySize,
        primary_focus: contactData.primaryFocus,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    let leaderId: string;
    
    if (leaderError || !leader) {
      // Fallback: try to get existing leader
      const { data: existingLeader, error: selectError } = await supabase
        .from('leaders')
        .select('*')
        .eq('email', leaderEmail)
        .single();
      
      if (existingLeader) {
        const { error: updateError } = await supabase
          .from('leaders')
          .update({
            name: contactData.fullName,
            role: contactData.roleTitle,
            company: contactData.companyName,
            company_size_band: contactData.companySize,
            primary_focus: contactData.primaryFocus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLeader.id);
        
        if (updateError) {
          throw new Error('Failed to update leader record: ' + updateError.message);
        }
        
        leaderId = existingLeader.id;
      } else {
        throw new Error('LEADER_UPSERT_FAILED: ' + JSON.stringify({
          upsertError: leaderError?.message,
          upsertCode: leaderError?.code,
          selectError: selectError?.message,
          email: leaderEmail
        }));
      }
    } else {
      leaderId = leader.id;
    }

    console.log('✅ Leader record ready:', leaderId);

    // Create leader_assessment record
    const insertData: Record<string, any> = {
      leader_id: leaderId,
      source,
      benchmark_score: benchmarkScore,
      benchmark_tier: benchmarkTier,
      learning_style: assessmentData?.learningStyle || null,
      has_deep_profile: !!deepProfileData,
      has_full_diagnostic: false,
      session_id: sessionId,
    };
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .insert(insertData)
      .select()
      .single();

    if (assessmentError || !assessment) {
      console.error('❌ Assessment creation error:', assessmentError);
      throw new Error('ASSESSMENT_INSERT_FAILED: ' + JSON.stringify({
        message: assessmentError?.message,
        code: assessmentError?.code,
        details: assessmentError?.details,
        hint: assessmentError?.hint,
        insertData: insertData
      }));
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
