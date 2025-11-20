import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromptLibraryResponse {
  success: boolean;
  promptSetsCount: number;
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
    const startTime = Date.now();
    const { assessmentId, sessionId, userId, contactData, assessmentData, profileData, leaderId } = await req.json();
    console.log('Generating prompt library for assessment:', assessmentId);
    
    // CRITICAL: Validate profile data at entry point
    const safeProfile = validateProfileData(profileData);
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
    
    // Phase 2: Build comprehensive context
    let fullContext = null;
    let contextFormatted = '';
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    if (assessmentId && leaderId) {
      console.log('🔍 Building context for prompt library...');
      try {
        const { buildAssessmentContext, formatContextForPrompt } = await import('../_shared/context-builder.ts');
        fullContext = await buildAssessmentContext(supabase, leaderId, assessmentId);
        contextFormatted = formatContextForPrompt(fullContext);
        console.log('✅ Context built:', fullContext.contextMetadata.dataCompleteness, '% complete');
      } catch (contextError) {
        console.warn('⚠️ Context building failed:', contextError);
      }
    }
    console.log('📦 Received body:', JSON.stringify({ 
      hasAssessmentId: !!assessmentId, 
      assessmentId, 
      assessmentIdType: typeof assessmentId,
      hasSessionId: !!sessionId,
      hasAssessmentData: !!assessmentData,
      hasContactData: !!contactData 
    }));

    // Validate required parameters
    if (!assessmentId) {
      console.error('❌ assessmentId is required');
      throw new Error('assessmentId is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!geminiApiKey && !openaiApiKey && !lovableApiKey) {
      console.error('❌ No API keys configured');
      throw new Error('At least one API key required (GEMINI_SERVICE_ACCOUNT_KEY, OPENAI, or LOVABLE)');
    }

    // Build prompt with safe null handling for profileData
    let profileSection = '';
    if (Object.keys(safeProfile).length > 0) {
      profileSection = `

DEEP PROFILE:
- Thinking Process: ${safeProfile.thinkingProcess}
- Communication Style: ${safeProfile.communicationStyle.join(', ')}
- Work Breakdown: ${Object.entries(safeProfile.workBreakdown).map(([k, v]) => `${k}: ${v}%`).join(', ')}
- Information Needs: ${safeProfile.informationNeeds.join(', ')}
- Transformation Goal: ${safeProfile.transformationGoal}
- Time on Non-Critical Work: ${safeProfile.timeWaste}%
- Specific Time Wasters: ${safeProfile.timeWasteExamples}
- Top Delegation Priorities: ${safeProfile.delegateTasks.join(', ')}
- Biggest Communication Challenge: ${safeProfile.biggestChallenge}
- Key Stakeholders: ${safeProfile.stakeholders.join(', ')}`;
    } else {
      profileSection = `

CONTEXT:
- Primary Focus: ${contactData.primaryFocus || 'General AI adoption'}
- Department: ${contactData.department || 'Leadership'}
- Timeline: ${contactData.timeline || 'Near-term'}`;
    }

    const synthesisPro = `PHASE 3: OPTIMIZED PROMPT - Create THE DEFINITIVE AI COMMAND CENTER for this executive.

POSITIONING: Ultra-confident master prompts they'll copy-paste verbatim. Use gender-neutral language (they/their/them).

EXECUTIVE: ${contactData.fullName || 'Leader'} | ${contactData.roleTitle || contactData.department} | ${contactData.companyName || 'Organization'} (${contactData.companySize || 'mid-size'})
FOCUS: ${contactData.primaryFocus || 'AI adoption'} | Timeline: ${contactData.timeline || 'near-term'}

ASSESSMENT: ${Object.entries(assessmentData).map(([key, value]) => `${key}: ${value}`).join(' | ')}${profileSection}

RULES:
✅ Definitive authority: "Your AI Command Prompt" NOT "example"
✅ 300-400 words per prompt with specific stakeholders/metrics/context
✅ Zero placeholders - use actual data from profile
❌ Generic frameworks that work for any executive
❌ Suggestive language: "might", "consider", "could try"

TASK: Generate comprehensive Executive AI Command Center JSON with radical specificity:

{
  "personalizedInsights": {
    "yourEdge": "Based on [specific strength from their profile], they should focus on [specific opportunity]. Be specific about what gives them competitive advantage. 120-180 characters.",
    "yourRisk": "Their [specific weakness from profile] could cause [specific failure mode]. Be direct and actionable. 120-180 characters.",
    "yourNextMove": "In the next 7 days, prioritize [specific action] because [specific reason tied to their context]. 120-180 characters."
  },
  "immediateActions": {
    "next3Conversations": [
      {
        "stakeholder": "Name/role from their stakeholders list",
        "topic": "Specific conversation topic tied to their challenges",
        "talkingPoints": ["Point 1 with context", "Point 2 with expected outcome", "Point 3 with follow-up"],
        "successLooksLike": "Concrete outcome they can measure"
      }
    ],
    "delegationOpportunities": [
      {
        "task": "Specific task from their time-wasters or delegation priorities",
        "delegateTo": "Suggested role/person type",
        "promptToGiveThem": "Exact words to say when delegating - make it copy-paste ready",
        "successCriteria": ["Criterion 1", "Criterion 2"]
      }
    ],
    "quickDecisions": [
      {
        "decision": "Specific decision they need to make",
        "whyNow": "Why this can't wait",
        "options": [
          {
            "name": "Option name",
            "pros": ["Pro 1", "Pro 2"],
            "cons": ["Con 1", "Con 2"]
          }
        ],
        "recommendation": "AI-suggested best path with reasoning"
      }
    ]
  },
  "masterPromptLibrary": {
    "strategicPrompts": [
      {
        "name": "Prompt set name",
        "purpose": "Specific value",
        "whenToUse": "Scenarios",
        "masterInstructions": "300-400 word tailored prompt",
        "examplePrompts": ["Prompt 1", "Prompt 2", "Prompt 3"],
        "successMetrics": ["Metric 1", "Metric 2"]
      }
    ],
    "operationalPrompts": [
      {
        "name": "Role-specific operational prompt",
        "purpose": "Daily/weekly value",
        "whenToUse": "Operational scenarios",
        "masterInstructions": "Tailored operational prompt",
        "examplePrompts": ["Prompt 1", "Prompt 2"],
        "successMetrics": ["Metric 1"]
      }
    ]
  },
  "executivePlaybooks": [
    {
      "title": "30-Day AI Adoption Sprint",
      "whenToUse": "Starting AI transformation in their specific context",
      "steps": [
        {
          "week": "Week 1",
          "focus": "Focus area",
          "actions": ["Action 1", "Action 2", "Action 3"]
        }
      ],
      "successMetrics": ["Metric 1", "Metric 2", "Metric 3"],
      "riskMitigation": ["Risk 1 mitigation", "Risk 2 mitigation"]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Conversations: 3 specific conversations with actual people/roles from THEIR context (use stakeholders from profile if available, otherwise infer from their role/industry)
- Delegations: 3 tasks from THEIR time-wasters/delegation priorities with exact delegation scripts (copy-paste ready)
- Decisions: 2 urgent decisions tied to THEIR specific challenges with pros/cons that reference THEIR constraints
- Strategic Prompts: 3-4 prompt sets for planning, board prep, stakeholder management - each must use their actual company size, industry, and specific initiatives
- Operational Prompts: 2-3 prompt sets for daily/weekly tasks - each must automate a specific time-waster they mentioned
- Playbooks: 1-2 playbooks with week-by-week steps that reference THEIR timeline, THEIR team structure, and THEIR transformation goals
- Every prompt must include: specific stakeholder names/roles, specific metrics/KPIs, specific tools/processes from their context
- Tone: Match THEIR communication style (${profileData?.communicationStyle?.join(', ') || contactData.primaryFocus || 'direct, action-oriented'})
- NO PLACEHOLDERS: Replace every [thing] with actual specifics from their data

Return ONLY valid JSON, no markdown formatting.`;

    let generatedContent;
    let generationModel = '';

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
                text: synthesisPro
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 14000
            }
          })
        });
        
        clearTimeout(geminiTimeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          
          // CP5: Comprehensive response logging
          console.log('📦 CP5: Full Gemini response structure:', JSON.stringify({
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
              JSON.parse(cleanContent); // Validate it's parseable
              console.log('✅ Vertex AI JSON parsed successfully');
              generatedContent = cleanContent;
            } catch (parseError) {
              console.error('❌ Vertex AI JSON parse failed');
              console.error('Raw response length:', content.length);
              console.error('Cleaned response length:', cleanContent.length);
              console.error('First 200 chars:', cleanContent.substring(0, 200));
              console.error('Last 200 chars:', cleanContent.substring(cleanContent.length - 200));
              console.error('Parse error:', parseError);
              throw parseError;
            }
            generationModel = 'vertex-gemini-2.5-flash-rag';
            console.log('✅ Vertex AI + RAG succeeded in', Date.now() - startTime, 'ms');
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
    if (!generatedContent && openaiApiKey) {
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
              { role: 'system', content: 'You are an expert AI strategist generating personalized prompt libraries. Return valid JSON format only.' },
              { role: 'user', content: synthesisPro }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(openaiTimeoutId);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          generatedContent = openaiData.choices[0].message.content;
          generationModel = 'openai-gpt4.1';
          console.log('✅ OpenAI succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'openai-gpt4.1',
            durationMs: Date.now() - startTime,
            success: true
          });
          
          // CP4: Update generation_status for OpenAI
          if (assessmentId) {
            console.log('✅ CP4: Updating generation_status.prompts_generated = true (OpenAI)');
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
                  prompts_generated: true,
                  prompts_source: 'openai',
                  last_updated: new Date().toISOString()
                }
              })
              .eq('id', assessmentId);
          }
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
    if (!generatedContent && lovableApiKey) {
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
              { role: 'system', content: 'You are an expert AI strategist generating personalized prompt libraries. Return valid JSON only.' },
              { role: 'user', content: synthesisPro }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(lovableTimeoutId);

        if (lovableResponse.ok) {
          const lovableData = await lovableResponse.json();
          generatedContent = lovableData.choices[0].message.content;
          generationModel = 'lovable-gemini';
          console.log('✅ Lovable AI Gemini succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'lovable-gemini',
            durationMs: Date.now() - startTime,
            success: true
          });
          
          // CP4: Update generation_status for Lovable AI
          if (assessmentId) {
            console.log('✅ CP4: Updating generation_status.prompts_generated = true (Lovable AI)');
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
                  prompts_generated: true,
                  prompts_source: 'lovable-ai',
                  last_updated: new Date().toISOString()
                }
              })
              .eq('id', assessmentId);
          }
        }
      } catch (error: any) {
        clearTimeout(lovableTimeoutId);
        console.error('❌ Lovable AI failed:', error.message);
      }
    }

    // ============= PLAN C: TEMPLATE FALLBACK =============
    if (!generatedContent) {
      console.log('⚠️ All AI services failed, using template fallback');
      generationModel = 'template';
      
      // safeProfile already exists from validation at entry point
      const fallbackLibrary = {
        executiveProfile: {
          summary: `${contactData.fullName} operates as a ${contactData.roleTitle} focused on ${contactData.primaryFocus}. Their assessment shows strong capabilities in strategic thinking and team leadership, with opportunities to scale impact through AI-powered delegation and automation. Working in a ${contactData.companySize} organization, they balance ${safeProfile.workBreakdown.planning}% strategic work with operational demands.`,
          transformationOpportunity: `Transform ${safeProfile.timeWaste}% of non-critical work into strategic time by automating ${safeProfile.delegateTasks[0]}, streamlining ${safeProfile.biggestChallenge}, and empowering team decisions.`
        },
        recommendedProjects: [
          {
            name: "Executive Brief Generator",
            purpose: "Transform raw data and updates into executive-ready strategic summaries",
            whenToUse: "Before leadership meetings, quarterly reviews, or stakeholder updates",
            masterInstructions: `Act as ${contactData.roleTitle}'s strategic communications advisor. Transform verbose updates into crisp executive briefs focusing on ${contactData.primaryFocus}. Structure: Executive Summary (3 bullets), Key Insights (2-3 items), Recommended Actions (prioritized), Timeline. Match their ${safeProfile.communicationStyle.join(' and ')} style.`,
            examplePrompts: [
              "Synthesize this week's project updates into an executive brief for our leadership team",
              "Create a strategic summary of Q4 performance highlighting ${contactData.primaryFocus} progress",
              "Transform these stakeholder meeting notes into actionable next steps"
            ],
            successMetrics: [
              `Reduce brief preparation time by ${Math.min(safeProfile.timeWaste, 70)}%`,
              "Increase stakeholder alignment scores by 30%"
            ]
          },
          {
            name: "Decision Framework Assistant",
            purpose: "Structure complex decisions with stakeholder analysis and risk assessment",
            whenToUse: `When evaluating ${safeProfile.delegateTasks[1]} or addressing ${safeProfile.biggestChallenge}`,
            masterInstructions: `You're ${contactData.fullName}'s decision advisor. Analyze decisions through: 1) Stakeholder Impact (${safeProfile.stakeholders.join(', ')}), 2) Strategic Alignment (${contactData.primaryFocus}), 3) Resource Trade-offs, 4) Risk Mitigation. Present options in their ${safeProfile.communicationStyle[0]} style with clear recommendations.`,
            examplePrompts: [
              `Analyze this ${safeProfile.delegateTasks[0]} decision considering our ${contactData.timeline} timeline`,
              "Evaluate trade-offs between these three strategic options",
              `Create a stakeholder impact assessment for ${safeProfile.biggestChallenge}`
            ],
            successMetrics: [
              "Reduce decision cycle time by 40%",
              "Improve decision confidence scores by 25%"
            ]
          },
          {
            name: "Team Communication Optimizer",
            purpose: `Address ${safeProfile.biggestChallenge} through AI-powered communication templates`,
            whenToUse: "Team announcements, feedback sessions, change management, delegation",
            masterInstructions: `Generate communications for ${contactData.companyName} teams that reflect ${contactData.fullName}'s ${safeProfile.communicationStyle.join(' and ')} approach. Adapt tone for ${safeProfile.stakeholders.join(', ')}. Focus on ${safeProfile.transformationGoal}. Include clear CTAs and success criteria.`,
            examplePrompts: [
              `Draft a team message about ${safeProfile.delegateTasks[0]} that builds buy-in`,
              `Create feedback templates for ${safeProfile.stakeholders[0]} conversations`,
              `Write a change announcement addressing ${safeProfile.biggestChallenge}`
            ],
            successMetrics: [
              `Reduce communication drafting time by ${Math.min(safeProfile.timeWaste, 60)}%`,
              "Increase team response rate by 45%"
            ]
          }
        ],
        promptTemplates: [
          {
            name: "Strategic Synthesis",
            category: "Decision-Making",
            prompt: `Analyze [SITUATION] from a ${contactData?.roleTitle || 'Executive'} perspective focusing on ${contactData.primaryFocus}. Consider ${contactData.fullName}'s transformation goal: "${safeProfile.transformationGoal}". Provide: 1) Core Issue, 2) Strategic Options aligned with ${contactData.timeline} timeline, 3) Stakeholder Impact (${safeProfile.stakeholders.join(', ')}), 4) Recommended Action addressing ${safeProfile.biggestChallenge}.`
          },
          {
            name: "Stakeholder Update",
            category: "Communication",
            prompt: `Create an update for [STAKEHOLDER] about [TOPIC]. Use ${safeProfile.communicationStyle[0]} tone matching ${contactData.fullName}'s style. Consider stakeholder: ${safeProfile.stakeholders[0]}. Structure: Progress Summary tied to ${safeProfile.transformationGoal}, Key Wins, Blockers (if any), Next Steps aligned with ${contactData.timeline}, Support Needed.`
          },
          {
            name: "Team Delegation",
            category: "Leadership",
            prompt: `Draft delegation instructions for [TASK]. Include: Context, Desired Outcome, Success Criteria, Decision Authority, Check-in Points. Empower the team while maintaining ${contactData.fullName}'s standards.`
          }
        ],
        implementationRoadmap: {
          week1: `Start with Executive Brief Generator and Strategic Synthesis template - these directly address your ${safeProfile.timeWaste}% time waste on ${safeProfile.timeWasteExamples}. Test with 2-3 real scenarios.`,
          week2to4: `Add Decision Framework Assistant for ${safeProfile.delegateTasks[0]} decisions. Introduce Team Communication Optimizer to address ${safeProfile.biggestChallenge}. Build team muscle memory with consistent templates.`,
          month2plus: `Customize all templates to match specific stakeholder profiles (${safeProfile.stakeholders.join(', ')}). Add advanced prompts for ${safeProfile.transformationGoal}. Track time savings and decision quality improvements.`
        }
      };
      
      generatedContent = JSON.stringify(fallbackLibrary);
      console.log('✅ Template fallback completed successfully with safe defaults');
      console.log('📊 Profile data availability:', {
        hasWorkBreakdown: !!profileData?.workBreakdown,
        hasDelegateTasks: !!profileData?.delegateTasks,
        hasStakeholders: !!profileData?.stakeholders,
        hasCommunicationStyle: !!profileData?.communicationStyle,
        hasTransformationGoal: !!profileData?.transformationGoal
      });
      console.log('📊 Generation metrics:', {
        source: 'template',
        durationMs: Date.now() - startTime,
        success: true,
        fallback: true
      });
    }

    // Parse and validate
    let cleanContent = generatedContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    const parsedLibrary = JSON.parse(cleanContent);

    // CP3: Store in database with leader_id support for anonymous users
    const { data: storedProfile, error: dbError } = await supabase
      .from('prompt_library_profiles')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        leader_id: leaderId || null, // CP3: Support anonymous assessments
        executive_profile: parsedLibrary.executiveProfile,
        recommended_projects: parsedLibrary.recommendedProjects,
        prompt_templates: parsedLibrary.promptTemplates,
        implementation_roadmap: parsedLibrary.implementationRoadmap,
        bottleneck_analysis: parsedLibrary.bottleneckAnalysis || {},
        stakeholder_map: parsedLibrary.stakeholderMap || {},
        workflow_preferences: parsedLibrary.workflowPreferences || {},
        communication_style: parsedLibrary.communicationStyle || {},
        trust_calibration: parsedLibrary.trustCalibration || {},
        generation_model: generationModel,
        generation_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log('Prompt library stored successfully:', storedProfile.id);

    // Combine strategic and operational prompts from actual Gemini schema
    const allPrompts = [
      ...(parsedLibrary.masterPromptLibrary?.strategicPrompts || []),
      ...(parsedLibrary.masterPromptLibrary?.operationalPrompts || [])
    ];

    const promptSets = allPrompts.map((project: any, index: number) => ({
      category_key: project.name?.toLowerCase().replace(/\s+/g, '_') || `prompt_${index}`,
      title: project.name || 'Untitled Prompt',
      description: project.purpose || '',
      what_its_for: project.purpose || '',
      when_to_use: project.whenToUse || '',
      how_to_use: project.masterInstructions || '',
      prompts_json: project.examplePrompts || [],
      priority_rank: index + 1,
      assessment_id: assessmentId
    }));

    // Store prompts directly in leader_prompt_sets table ONLY if we have data
    if (promptSets.length > 0) {
      console.log(`Storing ${promptSets.length} prompt sets to leader_prompt_sets for assessment ${assessmentId}`);
      const { error: promptSetsError } = await supabase
        .from('leader_prompt_sets')
        .insert(promptSets);
      
      if (promptSetsError) {
        console.error('Error storing prompt sets:', promptSetsError);
        throw new Error(`Failed to store prompt sets: ${promptSetsError.message}`);
      }
      
      console.log(`✅ Stored ${promptSets.length} prompt sets to leader_prompt_sets`);

      // Update generation status ONLY AFTER successful DB writes
      if (assessmentId) {
        console.log('✅ Updating generation_status.prompts_generated = true (after DB write)');
        const { data: currentStatus } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', assessmentId)
          .single();
        
        const { error: statusError } = await supabase
          .from('leader_assessments')
          .update({
            generation_status: {
              ...(currentStatus?.generation_status || {}),
              prompts_generated: true,
              last_updated: new Date().toISOString()
            }
          })
          .eq('id', assessmentId);
          
        if (statusError) {
          console.error('Failed to update generation status:', statusError);
        }
      }
    } else {
      console.warn('⚠️ No prompt sets to store - skipping flag update');
    }

    return new Response(
      JSON.stringify({
        success: true,
        profileId: storedProfile.id,
        promptSetsCount: promptSets.length,
        generationSource: generationModel,
        durationMs: Date.now() - startTime,
      } as PromptLibraryResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Complete failure in prompt library generation:', error);
    
    // EMERGENCY: Store minimal guaranteed prompts
    const emergencyPrompts = [
      {
        assessment_id: assessmentId,
        category_key: 'strategic_planning',
        title: 'Strategic AI Planning Prompts',
        description: 'Core prompts for AI strategy development',
        what_its_for: 'Developing AI adoption strategies',
        when_to_use: 'When planning AI initiatives',
        how_to_use: 'Adapt these prompts to your specific context',
        prompts_json: [
          "Help me create a 90-day AI adoption plan for my team",
          "What are the top 3 AI use cases for my role?",
          "How can I measure the ROI of our AI experiments?"
        ],
        priority_rank: 1
      },
      {
        assessment_id: assessmentId,
        category_key: 'personal_productivity',
        title: 'Personal Productivity Prompts',
        description: 'AI prompts for individual effectiveness',
        what_its_for: 'Boosting personal productivity with AI',
        when_to_use: 'For daily AI-assisted tasks',
        how_to_use: 'Use with ChatGPT or Claude',
        prompts_json: [
          "Summarize this meeting transcript and extract action items",
          "Draft a response to this email maintaining my communication style",
          "Help me prioritize these tasks based on impact and urgency"
        ],
        priority_rank: 2
      },
      {
        assessment_id: assessmentId,
        category_key: 'team_enablement',
        title: 'Team Enablement Prompts',
        description: 'Prompts for enabling your team with AI',
        what_its_for: 'Building team AI capability',
        when_to_use: 'When supporting team AI adoption',
        how_to_use: 'Share with your team',
        prompts_json: [
          "Create a simple AI use case template for my team",
          "What's a safe, low-risk AI experiment my team can try?",
          "Help me explain AI benefits to non-technical stakeholders"
        ],
        priority_rank: 3
      }
    ];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      for (const prompt of emergencyPrompts) {
        await supabase.from('leader_prompt_sets').insert(prompt);
      }
    } catch (insertError) {
      console.error('❌ Emergency prompt insertion also failed:', insertError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        promptSetsCount: 3,
        generationSource: 'emergency-fallback',
        durationMs: Date.now() - (startTime || Date.now()),
      } as PromptLibraryResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
