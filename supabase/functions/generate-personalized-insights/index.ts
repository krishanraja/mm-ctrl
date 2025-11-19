import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Helper: Exchange JWT for OAuth2 access token
async function getVertexAIAccessToken(serviceAccountJson: string): Promise<string | null> {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const jwt = await generateServiceAccountJWT(serviceAccount);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    } else {
      const errorText = await tokenResponse.text();
      console.error('❌ OAuth2 token exchange failed:', tokenResponse.status, errorText);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Failed to get access token:', error.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentData, contactData, deepProfileData } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey && !openaiApiKey && !lovableApiKey) {
      console.error('❌ No API keys configured');
      throw new Error('At least one API key required (GEMINI_SERVICE_ACCOUNT_KEY, OPENAI, or LOVABLE)');
    }

    console.log('Generating personalized insights for:', contactData.fullName);

    const prompt = buildPersonalizedPrompt(assessmentData, contactData, deepProfileData);
    
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
        
        const accessToken = await getVertexAIAccessToken(geminiApiKey);
        
        if (!accessToken) {
          throw new Error('Failed to obtain OAuth2 access token');
        }
        
        const geminiController = new AbortController();
        const geminiTimeoutId = setTimeout(() => geminiController.abort(), 10000);

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
              maxOutputTokens: 4000,
              responseMimeType: "application/json"
            },
            tools: [{
              google_search: {}
            }]
          })
        });
        
        clearTimeout(geminiTimeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          const groundingMetadata = geminiData.candidates?.[0]?.groundingMetadata;
          
          if (groundingMetadata) {
            console.log('📚 RAG grounding used:', {
              webSearchQueries: groundingMetadata.webSearchQueries,
              retrievalQueries: groundingMetadata.retrievalQueries
            });
          }
          
          if (content) {
            personalizedInsights = JSON.parse(content);
            generationSource = 'vertex-gemini-2.5-flash-rag';
            console.log('✅ Vertex AI + RAG succeeded in', Date.now() - startTime, 'ms');
            console.log('📊 Generation metrics:', {
              source: 'vertex-gemini-2.5-flash-rag',
              durationMs: Date.now() - startTime,
              success: true
            });
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
      const openaiTimeoutId = setTimeout(() => openaiController.abort(), 5000);

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
                content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative.' 
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
      const lovableTimeoutId = setTimeout(() => lovableController.abort(), 6000);

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
          details: `${contactData.fullName}'s ${avgScore}/100 score shows ${avgScore >= 60 ? 'strong readiness' : 'solid progress'} in ${contactData.primaryFocus}.${deepProfileData?.transformationGoal ? ` Focus: ${deepProfileData.transformationGoal}` : ''}`
        },
        leadershipStage: {
          stage: avgScore >= 75 ? "Confident" : avgScore >= 60 ? "Aware" : "Emerging",
          preview: avgScore >= 60 ? "Leading AI adoption" : "Building AI literacy",
          details: `Ready to ${avgScore >= 60 ? 'scale AI adoption with team' : 'start pilot projects'}.${deepProfileData?.delegateTasks?.[0] ? ` Next: ${deepProfileData.delegateTasks[0]}` : ''}`
        },
        keyFocus: {
          category: keyFocusMap[contactData.primaryFocus] || "Strategic Execution",
          preview: `Optimize ${contactData.primaryFocus.toLowerCase()}`,
          details: `Focus on ${deepProfileData?.delegateTasks?.[0] || 'priority tasks'} to address ${deepProfileData?.biggestChallenge || 'key challenges'}`
        },
        quickWins: [
          {
            title: `Automate ${deepProfileData?.delegateTasks?.[0] || 'repetitive tasks'}`,
            impact: `Save ${Math.min(deepProfileData?.timeWaste || 20, 30)}% of time currently spent on repetitive ${deepProfileData?.timeWasteExamples || 'manual processes'}`,
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

    return new Response(
      JSON.stringify({ 
        personalizedInsights, 
        generationSource,
        durationMs: Date.now() - startTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-personalized-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

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
