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

  return `You are an AI leadership assessment analyzer. Generate personalized insights for:

Contact: ${contactData.fullName} (${contactData.role || 'Leader'}) at ${contactData.companyName || 'their company'}
Scores: ${scores}

Generate a JSON response with this EXACT structure:
{
  "yourEdge": "One sentence describing their unique competitive advantage based on scores",
  "yourRisk": "One sentence describing their biggest hidden risk",
  "yourNextMove": "One specific action they should take in the next 7 days",
  "tensions": [
    { "key": "tension_1", "summary": "Brief description of a strategic tension" }
  ],
  "risks": [
    { "key": "risk_1", "level": "medium", "description": "A specific risk signal" }
  ],
  "scenarios": [
    { "key": "scenario_1", "summary": "A strategic scenario recommendation" }
  ],
  "prompts": [
    {
      "category": "daily_efficiency",
      "title": "Quick Wins",
      "prompts": ["Specific AI prompt they can use today"]
    }
  ]
}

Make it personal, specific, and actionable. No generic advice.`;
}

async function tryVertexAI(prompt: string): Promise<{ success: boolean; data?: any }> {
  try {
    const serviceAccountKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      console.log('⚠️ GEMINI_SERVICE_ACCOUNT_KEY not found');
      return { success: false };
    }

    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountKey);
    const projectId = credentials.project_id;

    // Get OAuth token
    const tokenResponse = await getGoogleOAuthToken(credentials);
    if (!tokenResponse.success) {
      console.error('Failed to get OAuth token');
      return { success: false };
    }

    // Call Vertex AI Gemini
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
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', response.status, errorText);
      return { success: false };
    }

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    
    // Vertex AI with responseMimeType returns JSON directly, but still check for markdown
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      data = JSON.parse(jsonText);
    }
    
    return { success: true, data };

  } catch (error) {
    console.error('Vertex AI error:', error);
    return { success: false };
  }
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

async function tryOpenAI(prompt: string): Promise<{ success: boolean; data?: any }> {
  try {
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
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return { success: false };
    }

    const result = await response.json();
    const text = result.choices[0].message.content;
    
    const data = JSON.parse(text);
    return { success: true, data };

  } catch (error) {
    console.error('OpenAI error:', error);
    return { success: false };
  }
}

function getFallbackContent() {
  return {
    yourEdge: "Your systematic approach to AI adoption positions you for sustainable transformation",
    yourRisk: "Without immediate pilot programs, competitive advantage may erode within 6 months",
    yourNextMove: "Schedule a 2-hour AI strategy workshop with your leadership team this week",
    tensions: [
      { key: "speed_vs_quality", summary: "Balancing rapid AI experimentation with governance requirements" }
    ],
    risks: [
      { key: "adoption_lag", level: "medium", description: "Team AI adoption velocity below industry benchmark" }
    ],
    scenarios: [
      { key: "quick_wins", summary: "Target 3 high-ROI use cases for immediate AI implementation" }
    ],
    prompts: [
      {
        category: "strategic_planning",
        title: "AI Strategy Prompts",
        prompts: [
          "What are the top 3 business processes in my organization where AI could reduce cycle time by 50%?",
          "Generate a 90-day AI pilot roadmap for [your specific department]"
        ]
      }
    ]
  };
}
