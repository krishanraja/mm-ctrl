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
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('📦 Parsing request body...');
    const requestBody = await req.json();
    const sessionId = requestBody.sessionId || 'anonymous';
    console.log('✅ Parsed body, sessionId:', sessionId);
    
    // Skip rate limiting for now - can be re-enabled later
    console.log('⏭️ Skipping rate limiting for now');
    
    console.log(`✅ Using Supabase URL: ${supabaseUrl?.substring(0, 50)}...`);

    // Create service role client for database operations
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

    console.log('📋 ContactData received:', JSON.stringify(contactData || {}));

    // Handle empty/invalid email: generate pseudo-email for anonymous users
    let leaderEmail = contactData?.email?.trim() || '';
    if (!leaderEmail || !leaderEmail.includes('@')) {
      leaderEmail = `anon+${sessionId}@anon.local`;
    }

    console.log('🔐 Creating assessment for email:', leaderEmail);

    // Fix #6: Create or get leader record with race condition protection
    // Use upsert to handle concurrent requests atomically
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
        ignoreDuplicates: false // Update existing record
      })
      .select()
      .single();

    let leaderId: string;
    
    if (leaderError || !leader) {
      // If upsert fails, try to get existing leader as fallback
      const { data: existingLeader } = await supabase
        .from('leaders')
        .select('*')
        .eq('email', leaderEmail)
        .single();
      
      if (existingLeader) {
        // Update existing leader
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
        throw new Error('Failed to create or retrieve leader record: ' + leaderError?.message);
      }
    } else {
      leaderId = leader.id;
    }

    console.log('✅ Leader record ready:', leaderId);

    // Step 2: Create leader_assessment record (bypasses RLS with service role)
    // Fix #10: Include schema version for future compatibility
    // Fix RLS: Set owner_user_id for proper access control (when available)
    const insertData: Record<string, any> = {
      leader_id: leaderId,
      source,
      benchmark_score: benchmarkScore,
      benchmark_tier: benchmarkTier,
      learning_style: assessmentData?.learningStyle || null,
      has_deep_profile: !!deepProfileData,
      has_full_diagnostic: false,
      session_id: sessionId, // Keep for backward compatibility
      schema_version: '1.0', // Fix #10: Current schema version
    };
    
    // Skip owner_user_id for anonymous users - can be claimed later
    // insertData.owner_user_id = null;
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .insert(insertData)
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
