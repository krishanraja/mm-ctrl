import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonalizedInsightsResponse {
  success: boolean;
  personalizedInsights: any;
  generationSource: string;
  durationMs: number;
}

// CRITICAL: Profile validation - duplicated here for edge function isolation
interface SafeProfileData {
  workBreakdown: { writing: number; presentations: number; planning: number; decisions: number; coaching: number };
  timeWaste: number;
  timeWasteExamples: string;
  delegationTasks: string[];
  delegateTasks: string[];
  biggestChallenge: string;
  stakeholders: string[];
  communicationStyle: string[];
  informationNeeds: string[];
  transformationGoal: string;
  urgency: string;
  primaryBottleneck: string;
  thinkingProcess: string;
}

const DEFAULT_PROFILE: SafeProfileData = {
  workBreakdown: { writing: 20, presentations: 20, planning: 20, decisions: 20, coaching: 20 },
  timeWaste: 30,
  timeWasteExamples: "status updates, meeting prep, email management",
  delegationTasks: ["routine reporting", "data gathering"],
  delegateTasks: ["routine reporting", "data gathering"],
  biggestChallenge: "scaling team capacity",
  stakeholders: ["executive team", "direct reports"],
  communicationStyle: ["Concise & data-driven"],
  informationNeeds: ["Performance metrics"],
  transformationGoal: "operational efficiency",
  urgency: "moderate",
  primaryBottleneck: "time constraints",
  thinkingProcess: "systematic and methodical"
};

function validateProfileData(profile: any): SafeProfileData {
  if (!profile || typeof profile !== 'object') {
    console.warn('⚠️ Invalid profile data, using defaults');
    return DEFAULT_PROFILE;
  }

  const safeWorkBreakdown = profile.workBreakdown && typeof profile.workBreakdown === 'object'
    ? {
        writing: typeof profile.workBreakdown.writing === 'number' ? profile.workBreakdown.writing : DEFAULT_PROFILE.workBreakdown.writing,
        presentations: typeof profile.workBreakdown.presentations === 'number' ? profile.workBreakdown.presentations : DEFAULT_PROFILE.workBreakdown.presentations,
        planning: typeof profile.workBreakdown.planning === 'number' ? profile.workBreakdown.planning : DEFAULT_PROFILE.workBreakdown.planning,
        decisions: typeof profile.workBreakdown.decisions === 'number' ? profile.workBreakdown.decisions : DEFAULT_PROFILE.workBreakdown.decisions,
        coaching: typeof profile.workBreakdown.coaching === 'number' ? profile.workBreakdown.coaching : DEFAULT_PROFILE.workBreakdown.coaching,
      }
    : DEFAULT_PROFILE.workBreakdown;

  return {
    workBreakdown: safeWorkBreakdown,
    timeWaste: typeof profile.timeWaste === 'number' ? profile.timeWaste : DEFAULT_PROFILE.timeWaste,
    timeWasteExamples: typeof profile.timeWasteExamples === 'string' ? profile.timeWasteExamples : DEFAULT_PROFILE.timeWasteExamples,
    delegationTasks: Array.isArray(profile.delegationTasks) ? profile.delegationTasks : DEFAULT_PROFILE.delegationTasks,
    delegateTasks: Array.isArray(profile.delegateTasks) ? profile.delegateTasks : DEFAULT_PROFILE.delegateTasks,
    biggestChallenge: typeof profile.biggestChallenge === 'string' ? profile.biggestChallenge : DEFAULT_PROFILE.biggestChallenge,
    stakeholders: Array.isArray(profile.stakeholders) ? profile.stakeholders : DEFAULT_PROFILE.stakeholders,
    communicationStyle: Array.isArray(profile.communicationStyle) ? profile.communicationStyle : DEFAULT_PROFILE.communicationStyle,
    informationNeeds: Array.isArray(profile.informationNeeds) ? profile.informationNeeds : DEFAULT_PROFILE.informationNeeds,
    transformationGoal: typeof profile.transformationGoal === 'string' ? profile.transformationGoal : DEFAULT_PROFILE.transformationGoal,
    urgency: typeof profile.urgency === 'string' ? profile.urgency : DEFAULT_PROFILE.urgency,
    primaryBottleneck: typeof profile.primaryBottleneck === 'string' ? profile.primaryBottleneck : DEFAULT_PROFILE.primaryBottleneck,
    thinkingProcess: typeof profile.thinkingProcess === 'string' ? profile.thinkingProcess : DEFAULT_PROFILE.thinkingProcess,
  };
}

// Helper: Convert PEM to ArrayBuffer for crypto operations
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Generate JWT signed with service account private key
async function generateServiceAccountJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${claimB64}`;
  
  // Import private key for signing
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${unsignedToken}.${signatureB64}`;
}

// Helper: Exchange JWT for OAuth2 access token (CP3: with dedicated timeout)
async function getVertexAIAccessToken(serviceAccountJson: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const oauthStart = Date.now();
    const serviceAccount = JSON.parse(serviceAccountJson);
    const jwt = await generateServiceAccountJWT(serviceAccount);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      console.log('✅ CP3: OAuth completed in', Date.now() - oauthStart, 'ms');
      return tokenData.access_token;
    } else {
      const errorText = await tokenResponse.text();
      console.error('❌ CP3: OAuth2 token exchange failed:', tokenResponse.status, errorText);
      return null;
    }
  } catch (error: any) {
    console.error('❌ CP3: OAuth failed:', error.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentData, contactData, deepProfileData, assessmentId, leaderId } = await req.json();
    
    // CRITICAL: Validate profile data at entry point
    const safeProfile = validateProfileData(deepProfileData);
    console.log('✅ Profile data validated with safe defaults');
    
    // CP1: Verify Environment Variables Actually Exist
    console.log('🔑 CP1: API Keys check:', {
      gemini: !!Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY') && Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY')!.length > 50,
      openai: !!Deno.env.get('OPENAI_API_KEY') && Deno.env.get('OPENAI_API_KEY')!.startsWith('sk-'),
      lovable: !!Deno.env.get('LOVABLE_API_KEY') && Deno.env.get('LOVABLE_API_KEY')!.length > 20,
    });

    if (Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY')) {
      try {
        const sa = JSON.parse(Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY')!);
        console.log('📍 CP1: Vertex AI config:', {
          projectId: sa.project_id,
          clientEmail: sa.client_email?.substring(0, 30) + '...',
          hasPrivateKey: !!sa.private_key
        });
      } catch (e) {
        console.error('❌ CP1: GEMINI_SERVICE_ACCOUNT_KEY is not valid JSON!');
      }
    }

    // CP2: Test Basic Network Connectivity
    console.log('🌐 CP2: Testing network connectivity...');
    try {
      const testController = new AbortController();
      setTimeout(() => testController.abort(), 5000);
      const testResponse = await fetch('https://www.googleapis.com', { signal: testController.signal });
      console.log('✅ CP2: googleapis.com reachable:', testResponse.status);
    } catch (netError: any) {
      console.error('❌ CP2: googleapis.com UNREACHABLE:', netError.message);
      console.error('⚠️ CP2: This will cause ALL LLM calls to fail');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    // Phase 2: Build comprehensive context before generating insights
    let fullContext = null;
    let contextFormatted = '';
    
    if (assessmentId && leaderId) {
      console.log('🔍 Building comprehensive assessment context...');
      try {
        const { buildAssessmentContext, formatContextForPrompt } = await import('../_shared/context-builder.ts');
        fullContext = await buildAssessmentContext(supabase, leaderId, assessmentId);
        contextFormatted = formatContextForPrompt(fullContext);
        console.log('✅ Context built with', fullContext.contextMetadata.dataCompleteness, '% completeness');
      } catch (contextError) {
        console.warn('⚠️ Context building failed, proceeding with basic data:', contextError);
      }
    }
    
    const geminiApiKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey && !openaiApiKey && !lovableApiKey) {
      console.error('❌ No API keys configured');
      throw new Error('At least one API key required (GEMINI_SERVICE_ACCOUNT_KEY, OPENAI, or LOVABLE)');
    }

    console.log('Generating personalized insights for:', contactData.fullName);

    // Phase 2: Use prompt templates with quality guardrails
    let prompt = buildPersonalizedPrompt(assessmentData, contactData, deepProfileData);
    try {
      const { buildPrompt } = await import('../_shared/prompt-templates.ts');
      const contextData = contextFormatted || prompt;
      prompt = buildPrompt('assessment_analyzer', contextData);
      console.log('✅ Using enhanced prompt template with quality guardrails');
    } catch (importError) {
      console.warn('⚠️ Could not import prompt templates, using basic prompt');
    }
    
    let personalizedInsights = null;
    let generationSource = '';
    const startTime = Date.now();

    // ============= PLAN A: VERTEX AI GEMINI 2.5 FLASH + RAG (10s timeout) =============
    if (geminiApiKey) {
      console.log('🔄 Plan A: Calling Vertex AI Gemini 2.5 Flash with RAG...');
      
      try {
        // Parse service account and get OAuth token
        const serviceAccount = JSON.parse(geminiApiKey);
        const projectId = serviceAccount.project_id;
        const location = 'us-central1';
        
        console.log(`📍 Using Vertex AI project: ${projectId}, region: ${location}`);
        
        // CP3: Add timeout to OAuth call itself
        const oauthController = new AbortController();
        const oauthTimeoutId = setTimeout(() => oauthController.abort(), 15000);
        
        let accessToken;
        try {
          accessToken = await getVertexAIAccessToken(geminiApiKey, oauthController.signal);
          clearTimeout(oauthTimeoutId);
          
          if (!accessToken) {
            throw new Error('OAuth returned null token');
          }
        } catch (oauthError: any) {
          clearTimeout(oauthTimeoutId);
          console.error('❌ CP3: OAuth failed:', oauthError.message);
          throw oauthError;
        }
        
        const geminiController = new AbortController();
        const geminiTimeoutId = setTimeout(() => geminiController.abort(), 60000);
        console.log('✅ CP3: Vertex AI API timeout set to 60s (OAuth already complete)');

        const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;
        
        const geminiResponse = await fetch(vertexEndpoint, {
          method: 'POST',
          signal: geminiController.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative.

${prompt}

Return ONLY valid JSON matching the required structure.`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 10000
            }
          })
        });
        
        clearTimeout(geminiTimeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          
          // PHASE 1: Enhanced diagnostic logging with safety ratings
          console.log('📦 PHASE 1: Full Gemini response structure:', JSON.stringify({
            ok: geminiResponse.ok,
            status: geminiResponse.status,
            headers: Object.fromEntries(geminiResponse.headers.entries()),
            candidatesCount: geminiData.candidates?.length,
            firstCandidate: geminiData.candidates?.[0] ? {
              finishReason: geminiData.candidates[0].finishReason,
              safetyRatings: geminiData.candidates[0].safetyRatings,
              contentPartsCount: geminiData.candidates[0].content?.parts?.length,
              firstPartTextLength: geminiData.candidates[0].content?.parts?.[0]?.text?.length,
              firstPartTextPreview: geminiData.candidates[0].content?.parts?.[0]?.text?.substring(0, 100)
            } : null
          }, null, 2));
          
          // PHASE 1: Dump full geminiData for one test run
          console.log('🔍 PHASE 1: Complete geminiData dump:', JSON.stringify(geminiData, null, 2));
          
          // CP1: Defensive parsing for multiple Gemini response formats
          let content;
          const candidate = geminiData.candidates?.[0];
          if (candidate?.content?.parts?.[0]?.text) {
            content = candidate.content.parts[0].text;
            console.log('✅ CP1: Found content in parts[0].text format');
          } else if (candidate?.content?.text) {
            content = candidate.content.text;
            console.log('✅ CP1: Found content in direct text format');
          } else if (typeof candidate?.content === 'string') {
            content = candidate.content;
            console.log('✅ CP1: Found content as direct string');
          } else {
            console.error('❌ CP1: No content found in any expected format');
            console.error('❌ CP1: Full candidate structure:', JSON.stringify(candidate, null, 2));
          }
          const groundingMetadata = candidate?.groundingMetadata;
          
          if (groundingMetadata) {
            console.log('📚 RAG grounding used:', {
              webSearchQueries: groundingMetadata.webSearchQueries,
              retrievalQueries: groundingMetadata.retrievalQueries
            });
          }
          
          if (content) {
            // Clean markdown code blocks and other formatting issues
            let cleanContent = content.trim();

            // Remove markdown code blocks (various formats)
            if (cleanContent.includes('```')) {
              cleanContent = cleanContent
                .replace(/```json\s*/g, '')
                .replace(/```javascript\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            }

            // Remove leading/trailing whitespace and newlines
            cleanContent = cleanContent.trim();

            // If response starts with non-JSON text, try to extract JSON
            if (!cleanContent.startsWith('{') && !cleanContent.startsWith('[')) {
              const jsonMatch = cleanContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
              if (jsonMatch) {
                cleanContent = jsonMatch[0];
              }
            }

            // Validate it's not empty
            if (!cleanContent || cleanContent.length < 10) {
              throw new Error('Gemini returned empty or invalid response');
            }

            try {
              personalizedInsights = JSON.parse(cleanContent);
              
              // Phase 2: Validate against schema
              try {
                const { PersonalizedInsightsSchema } = await import('../_shared/schemas.ts');
                const { validateQualityGates } = await import('../_shared/quality-guardrails.ts');
                const validated = PersonalizedInsightsSchema.parse(personalizedInsights);
                const qualityCheck = validateQualityGates(validated);
                if (!qualityCheck.passed) {
                  console.warn('⚠️ Quality gates failed:', qualityCheck.failedGates);
                } else {
                  console.log('✅ All quality gates passed');
                }
              } catch (validationError: any) {
                console.warn('⚠️ Schema validation warning:', validationError.message);
              }
              
              console.log('✅ Vertex AI JSON parsed successfully');
            } catch (parseError) {
              console.error('❌ Vertex AI JSON parse failed');
              console.error('Raw response length:', content.length);
              console.error('Cleaned response length:', cleanContent.length);
              console.error('First 200 chars:', cleanContent.substring(0, 200));
              console.error('Last 200 chars:', cleanContent.substring(cleanContent.length - 200));
              console.error('Parse error:', parseError);
              throw parseError;
            }
            generationSource = 'vertex-gemini-2.5-flash-rag';
            console.log('✅ Vertex AI + RAG succeeded in', Date.now() - startTime, 'ms');
            console.log('📊 Generation metrics:', {
              source: 'vertex-gemini-2.5-flash-rag',
              durationMs: Date.now() - startTime,
              success: true,
              ragUsed: !!groundingMetadata
            });
            
            // Status will be updated after all DB writes complete
          }
        } else {
          const errorText = await geminiResponse.text();
          console.error('❌ Vertex AI error:', geminiResponse.status, errorText);
        }
      } catch (error: any) {
        console.error('❌ Vertex AI + RAG failed:', error.message);
      }
    }

    // ============= PLAN B: OPENAI GPT-4.1 FALLBACK (5s timeout) =============
    if (!personalizedInsights && openaiApiKey) {
      console.log('⚠️ Gemini failed, trying OpenAI GPT-4.1...');
      const openaiController = new AbortController();
      const openaiTimeoutId = setTimeout(() => openaiController.abort(), 15000); // CP3: Reduced from 25s to 15s

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: openaiController.signal,
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            max_completion_tokens: 4000,
            messages: [
              { 
                role: 'system', 
                content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative. Return valid JSON format.' 
              },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(openaiTimeoutId);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          personalizedInsights = JSON.parse(openaiData.choices[0].message.content);
          generationSource = 'openai-gpt4.1';
          console.log('✅ OpenAI succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'openai-gpt4.1',
            durationMs: Date.now() - startTime,
            success: true
          });
          
          // Status will be updated after all DB writes complete
        } else {
          const errorText = await openaiResponse.text();
          console.error('❌ OpenAI error:', openaiResponse.status, errorText);
        }
      } catch (error: any) {
        clearTimeout(openaiTimeoutId);
        console.error('❌ OpenAI failed:', error.message);
      }
    }

    // ============= PLAN C: LOVABLE AI GEMINI FALLBACK (6s timeout) =============
    if (!personalizedInsights && lovableApiKey) {
      console.log('⚠️ Gemini and OpenAI failed, trying Lovable AI as last resort...');
      const lovableController = new AbortController();
      const lovableTimeoutId = setTimeout(() => lovableController.abort(), 20000); // CP3: Reduced from 35s to 20s

      try {
        const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          signal: lovableController.signal,
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative.' 
              },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(lovableTimeoutId);

        if (lovableResponse.ok) {
          const lovableData = await lovableResponse.json();
          personalizedInsights = JSON.parse(lovableData.choices[0].message.content);
          generationSource = 'lovable-gemini';
          console.log('✅ Lovable AI Gemini succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'lovable-gemini',
            durationMs: Date.now() - startTime,
            success: true
          });
          
          // Status will be updated after all DB writes complete
        }
      } catch (error: any) {
        clearTimeout(lovableTimeoutId);
        console.error('❌ Lovable AI failed:', error.message);
      }
    }

    // ============= PLAN C: TEMPLATE FALLBACK =============
    if (!personalizedInsights) {
      console.log('⚠️ All AI services failed, using template fallback');
      generationSource = 'template';
      
      const avgScore = Math.round(
        (assessmentData.businessContext + assessmentData.strategyAlignment + 
         assessmentData.teamReadiness + assessmentData.aiLiteracy + 
         assessmentData.changeManagement + assessmentData.trustGaps) / 6
      );

      const keyFocusMap: Record<string, string> = {
        'Launching first pilots': 'Team Alignment',
        'Building team literacy': 'Team Alignment', 
        'Scaling existing use cases': 'Strategic Execution',
        'Governance and compliance': 'Decision Quality',
        'Change management': 'Team Alignment'
      };

      personalizedInsights = {
        growthReadiness: {
          level: avgScore >= 75 ? "High" : avgScore >= 60 ? "Medium-High" : avgScore >= 45 ? "Medium" : "Developing",
          preview: `Score: ${avgScore}/100 - ${avgScore >= 60 ? 'Strong foundation' : 'Building momentum'}`,
          details: `${contactData.fullName}'s ${avgScore}/100 score shows ${avgScore >= 60 ? 'strong readiness' : 'solid progress'} in ${contactData.primaryFocus}. Focus: ${safeProfile.transformationGoal}`
        },
        leadershipStage: {
          stage: avgScore >= 75 ? "Confident" : avgScore >= 60 ? "Aware" : "Emerging",
          preview: avgScore >= 60 ? "Leading AI adoption" : "Building AI literacy",
          details: `Ready to ${avgScore >= 60 ? 'scale AI adoption with team' : 'start pilot projects'}. Next: ${safeProfile.delegateTasks[0]}`
        },
        keyFocus: {
          category: keyFocusMap[contactData.primaryFocus] || "Strategic Execution",
          preview: `Optimize ${contactData.primaryFocus.toLowerCase()}`,
          details: `Focus on ${safeProfile.delegateTasks[0]} to address ${safeProfile.biggestChallenge}`
        },
        quickWins: [
          {
            title: `Automate ${safeProfile.delegateTasks[0]}`,
            impact: `Save ${Math.min(safeProfile.timeWaste, 30)}% of time currently spent on repetitive ${safeProfile.timeWasteExamples}`,
            timeToValue: "2 weeks"
          },
          {
            title: `AI-powered ${contactData.primaryFocus} assistant`,
            impact: `Streamline ${deepProfileData?.stakeholders?.[0] || 'team'} communications and ${deepProfileData?.biggestChallenge || 'workflow challenges'}`,
            timeToValue: "1 month"
          },
          {
            title: "Team prompt library for common tasks",
            impact: `Standardize ${deepProfileData?.communicationStyle?.[0] || 'collaborative'} approach across ${contactData.companySize} team`,
            timeToValue: "1 week"
          }
        ]
      };
      
      console.log('📊 Generation metrics:', {
        source: 'template',
        durationMs: Date.now() - startTime,
        success: true,
        fallback: true
      });
    }

    // Update generation_status AFTER successful data return
    if (assessmentId) {
      console.log('✅ Updating generation_status.insights_generated = true');
      const { data: currentStatus } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();
      
      await supabase
        .from('leader_assessments')
        .update({
          generation_status: {
            ...(currentStatus?.generation_status || {}),
            insights_generated: true,
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', assessmentId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        personalizedInsights,
        generationSource,
        durationMs: Date.now() - startTime,
      } as PersonalizedInsightsResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Complete failure in generate-personalized-insights:', error);
    
    // EMERGENCY FALLBACK: Always return something
    const emergencyInsights = getEmergencyFallbackInsights(contactData);
    
    return new Response(
      JSON.stringify({
        success: true,
        personalizedInsights: emergencyInsights,
        generationSource: 'emergency-fallback',
        durationMs: Date.now() - (startTime || Date.now()),
      } as PersonalizedInsightsResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});

function getEmergencyFallbackInsights(contactData: any) {
  return {
    summary: `${contactData.fullName}, your AI leadership assessment is being finalized. Your results will be available shortly.`,
    key_actions: [
      {
        action: "Review your baseline AI fluency assessment",
        why_now: "Understanding your current position is the first step to strategic AI adoption",
        metric_to_track: "Personal AI tool usage frequency",
        evidence: "Assessment submitted"
      }
    ],
    surprise_or_tension: {
      observation: "Your results are processing",
      evidence: ["Assessment data received"],
      implication: "Full insights will be available shortly"
    },
    scores: {
      ai_fluency: { score: 50, tier: 'establishing', evidence: "Baseline" },
      decision_velocity: { score: 50, tier: 'establishing', evidence: "Baseline" },
      experimentation_cadence: { score: 50, tier: 'establishing', evidence: "Baseline" },
      delegation_augmentation: { score: 50, tier: 'establishing', evidence: "Baseline" },
      alignment_communication: { score: 50, tier: 'establishing', evidence: "Baseline" },
      risk_governance: { score: 50, tier: 'establishing', evidence: "Baseline" }
    },
    firstMoves: {
      move1: "Set up a 15-minute AI experimentation block this week",
      move2: "Identify one repetitive task that AI could assist with",
      move3: "Share one AI learning with your team"
    }
  };
}

function buildPersonalizedPrompt(assessmentData: any, contactData: any, deepProfileData: any): string {
  // Safely extract ALL values with fallbacks for null deepProfileData
  const transformationGoal = deepProfileData?.transformationGoal || contactData?.primaryFocus || 'AI adoption';
  const timeWaste = deepProfileData?.timeWaste || 30;
  const timeWasteExamples = deepProfileData?.timeWasteExamples || 'repetitive tasks, status updates';
  const delegateTasks = deepProfileData?.delegateTasks?.join(', ') || 'routine analysis, reporting';
  const biggestChallenge = deepProfileData?.biggestChallenge || 'aligning stakeholders and driving adoption';
  const stakeholders = deepProfileData?.stakeholders?.join(', ') || 'executive team, direct reports';
  
  return `Generate personalized AI leadership insights for ${contactData.fullName}, ${contactData.roleTitle} at ${contactData.companyName}.

ASSESSMENT SCORES:
${Object.entries(assessmentData).map(([key, value]) => `- ${key}: ${value}/100`).join('\n')}

CONTEXT:
- Primary Focus: ${contactData.primaryFocus}
- Timeline: ${contactData.timeline}
- Company Size: ${contactData.companySize}
- Transformation Goal: ${transformationGoal}
- Time Waste: ${timeWaste}% on ${timeWasteExamples}
- Top Delegation Priorities: ${delegateTasks}
- Communication Challenge: ${biggestChallenge}
- Key Stakeholders: ${stakeholders}

Generate:
1. growthReadiness: 
   - level: (High/Medium-High/Medium/Developing) 
   - preview: 2-3 sentence summary of their current state
   - details: 3-5 detailed paragraphs with specific, actionable recommendations tied to their transformation goal ("${transformationGoal}"), work breakdown patterns, and time management data. Include specific examples, quantitative targets, and clear next steps. Reference their ${timeWaste}% time waste on "${timeWasteExamples}" and how AI can address this.

2. leadershipStage: 
   - stage: (Orchestrator/Confident/Aware/Emerging)
   - preview: 2-3 sentence assessment
   - details: 3-5 detailed paragraphs explaining why they're at this stage, what specific capabilities they have, what gaps exist, and concrete steps to advance. Include specific actions tied to their delegation priorities (${delegateTasks}) and stakeholder context (${stakeholders}).

3. keyFocus: 
   - category: ONE category (Team Alignment/Strategic Execution/Decision Quality/Time Leverage) most relevant to ${contactData.primaryFocus}
   - preview: 2-3 sentence rationale
   - details: 3-5 detailed paragraphs on why this is their top priority, specific strategies they can implement immediately, expected outcomes with metrics, and how this addresses their biggest challenge ("${biggestChallenge}"). Include timeline-specific milestones matching their ${contactData.timeline} window.

4. quickWins: 3-4 specific, personalized quick wins with:
   - title (descriptive, no char limit)
   - impact (detailed explanation with quantitative projections)
   - realistic timeToValue (1 week/2 weeks/1 month)
   - implementation steps (2-3 specific actions)

5. firstMoves: Your 3-move action plan - THREE numbered moves based on their tier, dimensions, and context:
   - move1: IMMEDIATE action (1-2 weeks), max 2 sentences, concrete and specific. Reference their actual scores, risks, and context.
   - move2: BUILD MOMENTUM (1 month), max 2 sentences, builds on move 1. Ties to their ${contactData.timeline} timeline.
   - move3: INSTITUTIONALIZE (3 months), max 2 sentences, creates lasting change. Connects to their transformation goal.
   
   Each move must be:
   - Tied to specific data points (their scores, time waste, delegation priorities, stakeholder needs)
   - Concrete enough to put on a calendar
   - Progressive (each builds on the previous)
   - Realistic for a ${contactData.roleTitle} with ${contactData.timeline} timeline

CRITICAL: Make every insight hyper-personalized to ${contactData.fullName}'s actual context. Be specific, quantitative, and actionable. Use their actual data points, not generic advice. Reference their specific time wasters, transformation goals, and work patterns throughout.`;
}
