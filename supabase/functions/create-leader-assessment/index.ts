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
    // Rate limiting: 3 assessments per hour per session
    const requestBody = await req.json();
    const sessionId = requestBody.sessionId || 'anonymous';
    
    // Simple rate limiting check (in-memory)
    // For production, consider using Supabase KV or Redis
    const rateLimitKey = `assessment:${sessionId}`;
    const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 3;
    
    const entry = rateLimitStore.get(rateLimitKey);
    if (entry && entry.resetAt > now) {
      if (entry.count >= maxRequests) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Rate limit exceeded. Maximum ${maxRequests} assessments per hour. Please try again later.`
          }),
          { 
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000))
            } 
          }
        );
      }
      entry.count++;
    } else {
      rateLimitStore.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate we're using the correct database (Mindmaker AI, ID: bkyuxvschuwngtcdhsyg)
    const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
    if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      const error = `Database validation failed: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Current: ${supabaseUrl}`;
      console.error('❌', error);
      throw new Error(error);
    }
    console.log(`✅ Database validated: Using Mindmaker AI (${EXPECTED_PROJECT_ID})`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const {
      contactData,
      assessmentData,
      deepProfileData,
      source = 'quiz',
      benchmarkScore,
      benchmarkTier,
    } = requestBody;

    console.log('🔐 Creating assessment with service role for:', contactData.email);

    // Fix #6: Create or get leader record with race condition protection
    // Use upsert to handle concurrent requests atomically
    const { data: leader, error: leaderError } = await supabase
      .from('leaders')
      .upsert({
        email: contactData.email,
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

    if (leaderError || !leader) {
      // If upsert fails, try to get existing leader as fallback
      const { data: existingLeader } = await supabase
        .from('leaders')
        .select('*')
        .eq('email', contactData.email)
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
        
        var leaderId = existingLeader.id;
      } else {
        throw new Error('Failed to create or retrieve leader record: ' + leaderError?.message);
      }
    } else {
      var leaderId = leader.id;
    }

    console.log('✅ Leader record ready:', leaderId);

    // Step 2: Create leader_assessment record (bypasses RLS with service role)
    // Fix #10: Include schema version for future compatibility
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
        schema_version: '1.0', // Fix #10: Current schema version
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
