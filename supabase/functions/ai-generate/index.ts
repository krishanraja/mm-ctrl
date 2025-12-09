import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentData, contactData } = await req.json();

    console.log('🚀 AI Generate - Starting with Plan A (Vertex AI)');

    const prompt = buildPrompt(assessmentData, contactData);
    
    // Plan A: Try Vertex AI (with service account)
    const vertexResult = await tryVertexAI(prompt);
    if (vertexResult.success) {
      console.log('✅ Plan A (Vertex AI) succeeded');
      return new Response(JSON.stringify({
        success: true,
        source: 'vertex-ai',
        data: vertexResult.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Plan B: Fall back to OpenAI
    console.log('⚠️ Plan A failed, trying Plan B (OpenAI)');
    const openaiResult = await tryOpenAI(prompt);
    if (openaiResult.success) {
      console.log('✅ Plan B (OpenAI) succeeded');
      return new Response(JSON.stringify({
        success: true,
        source: 'openai',
        data: openaiResult.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Both failed
    console.error('❌ Both Plan A and B failed');
    return new Response(JSON.stringify({
      success: false,
      error: 'Both AI providers failed',
      data: getFallbackContent()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-generate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: getFallbackContent()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildPrompt(assessmentData: any, contactData: any): string {
  const scores = Object.entries(assessmentData)
    .filter(([key]) => key.includes('Score'))
    .map(([key, value]) => `${key}: ${value}/100`)
    .join(', ');

  return `You are an AI leadership assessment analyzer with deep expertise in organizational AI adoption. 
Generate personalized, actionable insights for:

Contact: ${contactData.fullName} (${contactData.role || 'Leader'}) at ${contactData.companyName || 'their company'}
Assessment Scores: ${scores}

=== 10/10 QUALITY SELF-CHECK (Apply before finalizing) ===
Before generating your response, verify:
1. GROUNDING: Is every insight tied to a specific score or data point provided? If data is missing, acknowledge it.
2. CLEAR NEXT MOVE: Does yourNextMove contain ONE specific, actionable step for the next 7 days? No vague coaching.
3. USEFUL SURPRISE: Does at least one tension reveal a non-obvious blind spot or contradiction?
4. SPECIFICITY: Are recommendations tied to their specific role, company, and scores? No generic advice.
5. REUSABILITY: Can every score and label be written directly to a database?

=== ANTI-FLUFF RULES ===
- NO generic advice like "communicate more" or "be open to change"
- Every recommendation MUST reference a specific score or input
- When uncertain, provide two scenarios: "If X, then Y. If not-X, then Z."

Generate a JSON response with this EXACT structure:

{
  "yourEdge": "One sentence describing their unique competitive advantage",
  "yourRisk": "One sentence describing their biggest hidden risk",
  "yourNextMove": "One specific action they should take in the next 7 days",
  "dimensionScores": [
    {
      "key": "ai_readiness",
      "score": 75,
      "label": "Advancing",
      "summary": "Brief insight about this dimension"
    }
  ],
  "tensions": [
    {
      "key": "speed_vs_quality",
      "summary": "Brief description of a strategic tension"
    }
  ],
  "risks": [
    {
      "key": "shadow_ai",
      "level": "medium",
      "description": "A specific risk signal"
    }
  ],
  "scenarios": [
    {
      "key": "high_velocity_path",
      "summary": "A strategic scenario recommendation"
    }
  ],
  "prompts": [
    {
      "category": "strategic_planning",
      "title": "AI Strategy Prompts",
      "description": "Prompts for strategic planning",
      "whatItsFor": "When you need to plan AI initiatives",
      "whenToUse": "During quarterly planning",
      "howToUse": "Copy and paste into ChatGPT",
      "prompts": ["Specific AI prompt they can use today"]
    }
  ],
  "firstMoves": [
    "First concrete action to take this week",
    "Second concrete action to take this week",
    "Third concrete action to take this week"
  ]
}

CRITICAL ENUM CONSTRAINTS (use ONLY these exact values):
- risk.key: Must be one of ["shadow_ai", "skills_gap", "roi_leakage", "decision_friction"]
- risk.level: Must be one of ["low", "medium", "high"]
- scenario.key: Must be one of ["stagnation_loop", "shadow_ai_instability", "high_velocity_path", "culture_capability_mismatch"]
- prompt.category: Must be one of ["strategic_planning", "daily_efficiency", "team_enablement", "stakeholder_management"]
- dimensionScores[].key: Use snake_case like "ai_readiness", "value_clarity", "team_capability", "governance_maturity"
- dimensionScores[].label: Must be one of ["Emerging", "Establishing", "Advancing", "Leading"]

REQUIRED OUTPUT:
- Generate exactly 3-5 dimensionScores covering the key AI leadership dimensions
- Generate exactly 2-3 tensions showing strategic contradictions in their responses
- Generate exactly 2-3 risks with appropriate severity levels based on their scores
- Generate exactly 2 scenarios showing possible paths forward
- Generate exactly 2-4 prompt sets with 2-3 actionable prompts each
- Generate exactly 3 firstMoves as concrete actions for this week

Make it personal to ${contactData.fullName}'s specific role as ${contactData.role || 'a leader'} at ${contactData.companyName || 'their organization'}. 
Reference their specific scores. No generic advice.`;
}

function sanitizeEnums(data: any): any {
  const validRiskKeys = ['shadow_ai', 'skills_gap', 'roi_leakage', 'decision_friction'];
  const validRiskLevels = ['low', 'medium', 'high'];
  const validScenarioKeys = ['stagnation_loop', 'shadow_ai_instability', 'high_velocity_path', 'culture_capability_mismatch'];
  const validPromptCategories = ['strategic_planning', 'daily_efficiency', 'team_enablement', 'stakeholder_management'];

  if (data.risks) {
    data.risks = data.risks.map((r: any) => ({
      ...r,
      key: validRiskKeys.includes(r.key) ? r.key : 'shadow_ai',
      level: validRiskLevels.includes(r.level) ? r.level : 'medium'
    }));
  }

  if (data.scenarios) {
    data.scenarios = data.scenarios.map((s: any) => ({
      ...s,
      key: validScenarioKeys.includes(s.key) ? s.key : 'high_velocity_path'
    }));
  }

  if (data.prompts) {
    data.prompts = data.prompts.map((p: any) => ({
      ...p,
      category: validPromptCategories.includes(p.category) ? p.category : 'strategic_planning'
    }));
  }

  return data;
}

function validateResponse(data: any): boolean {
  if (!data) return false;
  
  const hasCore = data.yourEdge && data.yourRisk && data.yourNextMove;
  const hasDimensions = Array.isArray(data.dimensionScores) && data.dimensionScores.length > 0;
  const hasTensions = Array.isArray(data.tensions) && data.tensions.length > 0;
  const hasRisks = Array.isArray(data.risks) && data.risks.length > 0;
  const hasScenarios = Array.isArray(data.scenarios) && data.scenarios.length > 0;
  const hasPrompts = Array.isArray(data.prompts) && data.prompts.length > 0;
  const hasMoves = Array.isArray(data.firstMoves) && data.firstMoves.length === 3;
  
  return hasCore && hasDimensions && hasTensions && hasRisks && hasScenarios && hasPrompts && hasMoves;
}

async function tryVertexAI(prompt: string, retries = 1): Promise<{ success: boolean; data?: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }

      const serviceAccountKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
      if (!serviceAccountKey) {
        console.log('⚠️ GEMINI_SERVICE_ACCOUNT_KEY not found');
        return { success: false };
      }

      const credentials = JSON.parse(serviceAccountKey);
      const projectId = credentials.project_id;

      const tokenResponse = await getGoogleOAuthToken(credentials);
      if (!tokenResponse.success) {
        console.error('Failed to get OAuth token');
        continue;
      }

      const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vertex AI error:', response.status, errorText);
        continue;
      }

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        data = JSON.parse(jsonText);
      }
      
      // Sanitize enums to valid values
      data = sanitizeEnums(data);
      
      // Validate response structure
      if (!validateResponse(data)) {
        console.warn('⚠️ Response validation failed, will retry or fallback');
        continue;
      }
      
      return { success: true, data };

    } catch (error) {
      console.error(`Vertex AI error (attempt ${attempt + 1}):`, error);
      if (attempt === retries) {
        return { success: false };
      }
    }
  }
  
  return { success: false };
}

async function getGoogleOAuthToken(credentials: any): Promise<{ success: boolean; token?: string }> {
  try {
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = btoa(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));

    // Import private key
    const privateKeyPem = credentials.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    
    const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign JWT
    const signatureInput = `${jwtHeader}.${jwtPayload}`;
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${signatureInput}.${signatureBase64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth token error:', errorText);
      return { success: false };
    }

    const tokenData = await tokenResponse.json();
    return { success: true, token: tokenData.access_token };

  } catch (error) {
    console.error('OAuth token generation error:', error);
    return { success: false };
  }
}

async function tryOpenAI(prompt: string, retries = 1): Promise<{ success: boolean; data?: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        console.log('⚠️ OPENAI_API_KEY not found');
        return { success: false };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an AI leadership assessment analyzer. Always return valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        continue;
      }

      const result = await response.json();
      const text = result.choices[0].message.content;
      
      let data = JSON.parse(text);
      data = sanitizeEnums(data);
      
      if (!validateResponse(data)) {
        console.warn('⚠️ Response validation failed, will retry or fallback');
        continue;
      }
      
      return { success: true, data };

    } catch (error) {
      console.error(`OpenAI error (attempt ${attempt + 1}):`, error);
      if (attempt === retries) {
        return { success: false };
      }
    }
  }
  
  return { success: false };
}

function getFallbackContent() {
  return {
    yourEdge: "Your systematic approach to AI adoption positions you for sustainable transformation",
    yourRisk: "Without immediate pilot programs, competitive advantage may erode within 6 months",
    yourNextMove: "Schedule a 2-hour AI strategy workshop with your leadership team this week",
    dimensionScores: [
      { key: "ai_readiness", score: 65, label: "Establishing", summary: "Strong foundation with clear opportunities for acceleration" },
      { key: "value_clarity", score: 70, label: "Advancing", summary: "Business case articulation is solid but needs operational detail" },
      { key: "team_capability", score: 60, label: "Establishing", summary: "Team shows promise but requires structured enablement" }
    ],
    tensions: [
      { key: "speed_vs_quality", summary: "Balancing rapid AI experimentation with governance requirements" },
      { key: "innovation_vs_risk", summary: "Managing innovation ambition against organizational risk tolerance" }
    ],
    risks: [
      { key: "shadow_ai", level: "medium", description: "Uncoordinated AI adoption creating governance gaps" },
      { key: "skills_gap", level: "medium", description: "Team AI literacy below threshold for sustainable adoption" }
    ],
    scenarios: [
      { key: "high_velocity_path", summary: "Accelerate through focused pilot programs with cross-functional teams" },
      { key: "stagnation_loop", summary: "Risk of analysis paralysis without clear 90-day milestones" }
    ],
    prompts: [
      {
        category: "strategic_planning",
        title: "AI Strategy Prompts",
        description: "Strategic planning and roadmap development",
        whatItsFor: "Building AI initiatives aligned with business goals",
        whenToUse: "During quarterly planning or strategy sessions",
        howToUse: "Copy into ChatGPT and customize with your context",
        prompts: [
          "What are the top 3 business processes in my organization where AI could reduce cycle time by 50%?",
          "Generate a 90-day AI pilot roadmap for [your specific department]",
          "Identify AI use cases that could deliver ROI within 6 months"
        ]
      },
      {
        category: "daily_efficiency",
        title: "Daily Productivity",
        description: "Day-to-day efficiency and automation",
        whatItsFor: "Immediate productivity gains",
        whenToUse: "Daily work optimization",
        howToUse: "Use directly in your workflow",
        prompts: [
          "Summarize this meeting transcript and extract action items",
          "Draft an executive summary of this report in 3 bullet points"
        ]
      }
    ],
    firstMoves: [
      "Identify 2-3 high-impact AI use cases and assign executive sponsors by end of week",
      "Schedule 60-minute AI literacy session for leadership team within 10 days",
      "Create simple AI experimentation framework with clear success metrics"
    ]
  };
}
