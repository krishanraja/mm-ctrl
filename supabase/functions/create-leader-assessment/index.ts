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

    // Normalize email and name for matching
    const normalizedEmail = leaderEmail.toLowerCase().trim();
    const normalizedName = contactData?.fullName?.trim().toLowerCase().replace(/\s+/g, ' ') || null;
    const leaderName = contactData?.fullName?.trim() || null;

    console.log('🔐 Creating assessment with service role for user_id:', ownerUserId, 'email:', normalizedEmail);

    // Enhanced Profile Lookup Strategy (Anti-Fragile Design):
    // 1. Try user_id lookup first (most reliable, prevents cross-user overwrites)
    // 2. Try email+name matching (normalized, case-insensitive)
    // 3. Try email-only matching
    // 4. Create new profile with upsert logic
    let leaderId: string | null = null;
    let isNewProfile = false;
    
    // Strategy 1: Lookup by user_id (most reliable)
    const { data: existingLeaderByUserId, error: userIdError } = await supabase
      .from('leaders')
      .select('id, email, name, archived_at')
      .eq('user_id', ownerUserId)
      .is('archived_at', null) // Only active profiles
      .maybeSingle();

    if (userIdError) {
      console.warn('⚠️ Lookup by user_id failed:', userIdError.message);
    } else if (existingLeaderByUserId) {
      leaderId = existingLeaderByUserId.id;
      isNewProfile = false;
      console.log('✅ Found profile by user_id:', leaderId);
      
      // Update profile if email/name changed
      const needsUpdate = 
        (normalizedEmail && existingLeaderByUserId.email?.toLowerCase() !== normalizedEmail) ||
        (normalizedName && existingLeaderByUserId.name?.toLowerCase().trim().replace(/\s+/g, ' ') !== normalizedName);

      if (needsUpdate) {
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        if (normalizedEmail) updateData.email = normalizedEmail;
        if (leaderName) updateData.name = leaderName;

        const { error: updateError } = await supabase
          .from('leaders')
          .update(updateData)
          .eq('id', leaderId);

        if (updateError) {
          console.warn('⚠️ Failed to update profile:', updateError.message);
        } else {
          console.log('✅ Updated profile with new email/name');
        }
      }
    }

    // Strategy 2: If not found by user_id, try email+name matching
    if (!leaderId && normalizedEmail && normalizedName) {
      const { data: existingByEmailName, error: emailNameError } = await supabase
        .from('leaders')
        .select('id, email, name, user_id, archived_at')
        .eq('email', normalizedEmail)
        .is('archived_at', null)
        .maybeSingle();

      if (emailNameError) {
        console.warn('⚠️ Lookup by email failed:', emailNameError.message);
      } else if (existingByEmailName) {
        const existingNameNormalized = existingByEmailName.name?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
        
        if (existingNameNormalized === normalizedName) {
          // Email and name match - use this profile
          leaderId = existingByEmailName.id;
          isNewProfile = false;
          console.log('✅ Found profile by email+name:', leaderId);

          // Update user_id if not set
          if (!existingByEmailName.user_id) {
            const { error: updateError } = await supabase
              .from('leaders')
              .update({ 
                user_id: ownerUserId,
                updated_at: new Date().toISOString()
              })
              .eq('id', leaderId);

            if (updateError) {
              console.warn('⚠️ Failed to update user_id:', updateError.message);
            }
          }
        }
      }
    }

    // Strategy 3: If still not found, try email-only matching
    if (!leaderId && normalizedEmail) {
      const { data: existingByEmail, error: emailError } = await supabase
        .from('leaders')
        .select('id, email, name, user_id, archived_at')
        .eq('email', normalizedEmail)
        .is('archived_at', null)
        .maybeSingle();

      if (emailError) {
        console.warn('⚠️ Lookup by email only failed:', emailError.message);
      } else if (existingByEmail) {
        leaderId = existingByEmail.id;
        isNewProfile = false;
        console.log('✅ Found profile by email:', leaderId);

        // Update name and user_id if provided
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        if (leaderName) updateData.name = leaderName;
        if (!existingByEmail.user_id) updateData.user_id = ownerUserId;

        if (Object.keys(updateData).length > 1) { // More than just updated_at
          const { error: updateError } = await supabase
            .from('leaders')
            .update(updateData)
            .eq('id', leaderId);

          if (updateError) {
            console.warn('⚠️ Failed to update profile:', updateError.message);
          }
        }
      }
    }

    // Strategy 4: Create new profile if not found
    if (!leaderId) {
      const insertData = {
        user_id: ownerUserId, // Critical: Link to auth.users for RLS
        email: normalizedEmail,
        name: leaderName || 'Anonymous User',
        role: contactData?.roleTitle || null,
        company: contactData?.companyName || null,
        company_size_band: contactData?.companySize || null,
        primary_focus: contactData?.primaryFocus || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newLeader, error: createError } = await supabase
        .from('leaders')
        .insert(insertData)
        .select('id')
        .single();

      if (createError || !newLeader) {
        console.error('❌ Failed to create leader:', createError);
        
        // Fallback: If insert failed due to unique constraint, try to find existing
        if (createError?.code === '23505' || createError?.message?.includes('unique')) {
          console.log('⚠️ Insert failed due to unique constraint, trying to find existing...');
          
          // Try to find by email
          const { data: existingProfile } = await supabase
            .from('leaders')
            .select('id')
            .eq('email', normalizedEmail)
            .is('archived_at', null)
            .maybeSingle();

          if (existingProfile) {
            leaderId = existingProfile.id;
            isNewProfile = false;
            console.log('✅ Found existing profile after conflict:', leaderId);
          } else if (ownerUserId) {
            // Try to find by user_id
            const { data: existingByUserId } = await supabase
              .from('leaders')
              .select('id')
              .eq('user_id', ownerUserId)
              .is('archived_at', null)
              .maybeSingle();

            if (existingByUserId) {
              leaderId = existingByUserId.id;
              isNewProfile = false;
              console.log('✅ Found existing profile by user_id after conflict:', leaderId);
            }
          }
        }

        if (!leaderId) {
          throw new Error('Failed to create leader record: ' + (createError?.message || 'Unknown error'));
        }
      } else {
        leaderId = newLeader.id;
        isNewProfile = true;
        console.log('✅ Created new leader record:', leaderId);
      }
    }

    // Validate we have a leaderId before proceeding
    if (!leaderId) {
      throw new Error('Failed to obtain leader ID - cannot create assessment');
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
