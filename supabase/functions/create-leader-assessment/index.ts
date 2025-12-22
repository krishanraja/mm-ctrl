import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Initialize Supabase client with service role for rate limiting
    const supabaseForRateLimit = createClient(supabaseUrl, supabaseServiceKey);
    
    // Rate limiting: 3 assessments per hour per session
    const requestBody = await req.json();
    const sessionId = requestBody.sessionId || 'anonymous';
    
    // Database-backed rate limiting
    const rateLimitResult = await checkRateLimit(
      RATE_LIMITS.ASSESSMENT_CREATE,
      sessionId,
      supabaseForRateLimit
    );
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimitResult.error || `Rate limit exceeded. Maximum ${RATE_LIMITS.ASSESSMENT_CREATE.maxRequests} assessments per hour. Please try again later.`
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000))
          } 
        }
      );
    }
    
    // Validate we're using the correct database (Mindmaker AI, ID: bkyuxvschuwngtcdhsyg)
    const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
    if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      const error = `Database validation failed: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Current: ${supabaseUrl}`;
      console.error('❌', error);
      throw new Error(error);
    }
    console.log(`✅ Database validated: Using Mindmaker AI (${EXPECTED_PROJECT_ID})`);
    
    // Create client with user auth to get auth.uid()
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
      auth: { persistSession: false }
    });

    // Get authenticated user ID (works for anonymous + logged-in)
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    const ownerUserId = userData?.user?.id ?? null;
    
    if (userErr || !ownerUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Please ensure you are authenticated (including anonymous sign-in).'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create service role client for database operations
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

    // Handle empty/invalid email: generate pseudo-email for anonymous users
    let leaderEmail = contactData?.email?.trim() || '';
    if (!leaderEmail || !leaderEmail.includes('@')) {
      leaderEmail = `anon+${ownerUserId}@anon.local`;
    }

    console.log('🔐 Creating assessment with service role for user_id:', ownerUserId, 'email:', leaderEmail);

    // P0-2 FIX: Look up leader by user_id (not email) to prevent cross-user overwrites
    // First, try to find existing leader by user_id
    let leaderId: string;
    
    const { data: existingLeaderByUserId } = await supabase
      .from('leaders')
      .select('id')
      .eq('user_id', ownerUserId)
      .single();

    if (existingLeaderByUserId) {
      // User already has a leader record - update it
      const { error: updateError } = await supabase
        .from('leaders')
        .update({
          name: contactData?.fullName || null,
          email: leaderEmail,
          role: contactData?.roleTitle || null,
          company: contactData?.companyName || null,
          company_size_band: contactData?.companySize || null,
          primary_focus: contactData?.primaryFocus || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLeaderByUserId.id);

      if (updateError) {
        console.error('❌ Failed to update leader:', updateError);
        throw new Error('Failed to update leader record: ' + updateError.message);
      }

      leaderId = existingLeaderByUserId.id;
      console.log('✅ Updated existing leader record:', leaderId);
    } else {
      // No leader for this user - create new one with user_id
      const { data: newLeader, error: createError } = await supabase
        .from('leaders')
        .insert({
          user_id: ownerUserId, // Critical: Link to auth.users for RLS
          email: leaderEmail,
          name: contactData?.fullName || null,
          role: contactData?.roleTitle || null,
          company: contactData?.companyName || null,
          company_size_band: contactData?.companySize || null,
          primary_focus: contactData?.primaryFocus || null,
        })
        .select('id')
        .single();

      if (createError || !newLeader) {
        console.error('❌ Failed to create leader:', createError);
        
        // Fallback: If insert failed due to unique constraint on user_id, try to get existing
        const { data: fallbackLeader } = await supabase
          .from('leaders')
          .select('id')
          .eq('user_id', ownerUserId)
          .single();
        
        if (fallbackLeader) {
          leaderId = fallbackLeader.id;
          console.log('✅ Found leader via fallback:', leaderId);
        } else {
          throw new Error('Failed to create leader record: ' + (createError?.message || 'Unknown error'));
        }
      } else {
        leaderId = newLeader.id;
        console.log('✅ Created new leader record:', leaderId);
      }
    }

    // Step 2: Create leader_assessment record (bypasses RLS with service role)
    const { data: assessment, error: assessmentError } = await supabase
      .from('leader_assessments')
      .insert({
        leader_id: leaderId,
        owner_user_id: ownerUserId, // Critical: links assessment to auth.uid() for RLS
        source,
        benchmark_score: benchmarkScore,
        benchmark_tier: benchmarkTier,
        learning_style: assessmentData?.learningStyle || null,
        has_deep_profile: !!deepProfileData,
        has_full_diagnostic: false,
        session_id: sessionId, // Keep for backward compatibility
        schema_version: '1.0',
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
