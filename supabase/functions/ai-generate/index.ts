import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= COGNITIVE FRAMEWORKS TRAINING =============
// This training anchor ensures all AI outputs use proven decision-making frameworks
// from behavioral economics, cognitive science, and organizational psychology.
const COGNITIVE_FRAMEWORKS_ANCHOR = `
=== CORE COGNITIVE FRAMEWORKS (Apply to ALL outputs) ===

You are trained on world-class cognitive frameworks. Apply these to every analysis:

1. A/B FRAMING (Tversky & Kahneman)
   - Reframe decisions positively AND negatively to expose bias
   - Ensure preferences are robust to changes in wording
   - Ask: "How does this look as a gain vs. a loss?"

2. DIALECTICAL REASONING (Thesis-Antithesis-Synthesis)
   - Generate "for vs. against" analysis automatically
   - Present both sides with equal rhetorical force
   - Synthesize balanced paths forward
   - Ask: "What would a smart critic argue?"

3. MENTAL CONTRASTING (WOOP - Oettingen)
   - Wish: Define the goal clearly
   - Outcome: Envision best-case success
   - Obstacle: Identify real constraints
   - Plan: Develop mitigation or decide if goal is worthwhile
   - Ask: "What's the dream AND what's in the way?"

4. REFLECTIVE EQUILIBRIUM (Rawls)
   - Map decisions against stated principles
   - Identify tensions and conflicts
   - Seek coherence between actions and values
   - Ask: "Does this align with their stated goals?"

5. FIRST-PRINCIPLES THINKING
   - Deconstruct problems to fundamental truths
   - Challenge assumptions with "Five Whys"
   - Rebuild solutions from scratch
   - Ask: "What do we absolutely know to be true?"

=== CHAIN-OF-THOUGHT REQUIREMENTS ===
- Break every analysis into explicit reasoning steps
- Show your work - don't just give conclusions
- Reference specific data points for every insight
- When uncertain, provide two scenarios: "If X, then Y. If not-X, then Z."

=== ANTI-FLUFF RULES ===
- NO generic advice like "communicate more" or "be open to change"
- Every recommendation MUST reference a specific score, input, or data point
- Be specific about THEIR role, THEIR company, THEIR challenges
- Tie every tension to a specific contradiction in their responses
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentData, contactData, deepProfileData } = await req.json();

    console.log('🚀 AI Generate - Starting with Plan A (Vertex AI)');
    console.log('📊 Deep Profile Data received:', !!deepProfileData);

    const prompt = buildPrompt(assessmentData, contactData, deepProfileData);
    
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

function buildPrompt(assessmentData: any, contactData: any, deepProfileData?: any): string {
  const scores = Object.entries(assessmentData)
    .filter(([key]) => key.includes('Score'))
    .map(([key, value]) => `${key}: ${value}/100`)
    .join(', ');

  // Build rich deep profile context if available
  let profileContext = '';
  if (deepProfileData) {
    const workBreakdown = deepProfileData.workBreakdown || {};
    const timeWaste = deepProfileData.timeWaste || {};
    const delegateTasks = deepProfileData.delegateTasks || deepProfileData.delegationTasks || [];
    const stakeholders = deepProfileData.stakeholders || deepProfileData.keyStakeholders || [];
    const infoNeeds = deepProfileData.informationNeeds || [];
    const commStyle = deepProfileData.communicationStyle || [];

    profileContext = `
=== DEEP PROFILE CONTEXT (Use this to PERSONALIZE all outputs 10/10) ===

WORK BREAKDOWN (How they spend their time):
- Writing/Drafting: ${workBreakdown.writing || workBreakdown.strategic_work || 20}%
- Presentations: ${workBreakdown.presentations || 20}%
- Planning/Strategy: ${workBreakdown.planning || workBreakdown.operational_work || 20}%
- Decision Making: ${workBreakdown.decisions || 20}%
- Coaching/Managing: ${workBreakdown.coaching || workBreakdown.admin_waste || 20}%
${workBreakdown.ai_work ? `- AI-Assisted Work: ${workBreakdown.ai_work}%` : ''}

TIME WASTE ANALYSIS:
- Percentage of time wasted: ${timeWaste.percentage || deepProfileData.timeWaste || 0}%
- Examples of waste: ${Array.isArray(timeWaste.examples) ? timeWaste.examples.join('; ') : (deepProfileData.timeWasteExamples || 'Not specified')}

TASKS THEY WANT TO DELEGATE:
${Array.isArray(delegateTasks) && delegateTasks.length > 0 ? delegateTasks.map((t: string) => `- ${t}`).join('\n') : '- Not specified'}

BIGGEST CHALLENGE:
${deepProfileData.biggestChallenge || 'Not specified'}

KEY STAKEHOLDERS:
${Array.isArray(stakeholders) && stakeholders.length > 0 ? stakeholders.map((s: string) => `- ${s}`).join('\n') : '- Not specified'}

COMMUNICATION STYLE PREFERENCES:
${Array.isArray(commStyle) && commStyle.length > 0 ? commStyle.join(', ') : 'Not specified'}

INFORMATION NEEDS:
${Array.isArray(infoNeeds) && infoNeeds.length > 0 ? infoNeeds.join(', ') : 'Not specified'}

TRANSFORMATION GOAL:
${deepProfileData.transformationGoal || 'Not specified'}

URGENCY LEVEL:
${deepProfileData.urgencyLevel || 'Not specified'}

THINKING PROCESS:
${deepProfileData.thinkingProcess || 'Not specified'}

BOTTLENECKS:
${Array.isArray(deepProfileData.bottlenecks) ? deepProfileData.bottlenecks.join(', ') : 'Not specified'}

=== HOW TO USE THIS PROFILE ===
1. MATCH their communication style in all outputs
2. FOCUS prompts on their biggest time-wasters (${timeWaste.percentage || 0}% waste is significant)
3. TARGET their specific transformation goal: "${deepProfileData.transformationGoal || 'efficiency'}"
4. CREATE prompts for their work breakdown areas (if 40% on writing, give writing-focused prompts)
5. ADDRESS their biggest challenge directly: "${deepProfileData.biggestChallenge || 'productivity'}"
6. REFERENCE their stakeholders when relevant: ${Array.isArray(stakeholders) ? stakeholders.slice(0, 3).join(', ') : 'various stakeholders'}
`;
  }

  return `${COGNITIVE_FRAMEWORKS_ANCHOR}

You are an AI leadership assessment analyzer with deep expertise in organizational AI adoption.

${profileContext}

=== LEADER CONTEXT ===
Name: ${contactData.fullName}
Role: ${contactData.role || 'Leader'}
Company: ${contactData.companyName || 'their organization'}
Industry: ${contactData.industry || 'Unknown'}
Company Size: ${contactData.companySize || 'Unknown'}

=== ASSESSMENT SCORES ===
${scores}

=== 10/10 QUALITY SELF-CHECK (Apply before finalizing) ===
Before generating your response, verify:
1. GROUNDING: Is every insight tied to a specific score or profile data point? If data is missing, acknowledge it.
2. CLEAR NEXT MOVE: Does yourNextMove contain ONE specific, actionable step for the next 7 days? No vague coaching.
3. USEFUL SURPRISE: Does at least one tension reveal a non-obvious blind spot or contradiction using DIALECTICAL REASONING?
4. SPECIFICITY: Are recommendations tied to their specific role, company, work breakdown, and scores? No generic advice.
5. FRAMEWORK APPLICATION: Have you applied at least 2 of the 5 cognitive frameworks in your analysis?
6. PROFILE INTEGRATION: Have you referenced their biggest challenge, time waste areas, and transformation goal?

=== ANTI-FLUFF RULES ===
- NO generic advice like "communicate more" or "be open to change"
- Every recommendation MUST reference a specific score, profile input, or work breakdown percentage
- When uncertain, provide two scenarios: "If X, then Y. If not-X, then Z."
- Tensions should reveal CONTRADICTIONS in their responses (e.g., "wants speed but has governance gaps")

Generate a JSON response with this EXACT structure:

{
  "yourEdge": "One sentence describing their unique competitive advantage based on their profile and scores",
  "yourRisk": "One sentence describing their biggest hidden risk based on tensions in their data",
  "yourNextMove": "One specific action they should take in the next 7 days, referencing their role and biggest challenge",
  "dimensionScores": [
    {
      "key": "ai_readiness",
      "score": 75,
      "label": "Advancing",
      "summary": "Brief insight referencing their specific work breakdown or scores"
    }
  ],
  "tensions": [
    {
      "key": "speed_vs_quality",
      "summary": "Tension description using dialectical reasoning - reference specific contradictions in their profile"
    }
  ],
  "risks": [
    {
      "key": "shadow_ai",
      "level": "medium",
      "description": "Risk tied to their specific time waste areas or delegation gaps"
    }
  ],
  "scenarios": [
    {
      "key": "high_velocity_path",
      "summary": "Scenario using mental contrasting - what's the outcome AND what's the obstacle?"
    }
  ],
  "prompts": [
    {
      "category": "strategic_planning",
      "title": "AI Strategy Prompts for ${contactData.role || 'Leaders'}",
      "description": "Prompts tailored to their ${deepProfileData?.biggestChallenge || 'key challenges'}",
      "whatItsFor": "Addressing their specific ${deepProfileData?.transformationGoal || 'transformation goal'}",
      "whenToUse": "Based on their work breakdown and time waste patterns",
      "howToUse": "Copy and paste into ChatGPT, customize with their context",
      "prompts": ["Specific AI prompt that addresses their biggest time waste area", "Prompt for their delegation tasks", "Prompt for their stakeholder communication"]
    }
  ],
  "firstMoves": [
    "First concrete action tied to their biggest challenge this week",
    "Second action addressing their time waste areas",
    "Third action for their transformation goal"
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
- Generate exactly 2-4 prompt sets with 2-3 actionable prompts each - HIGHLY PERSONALIZED to their profile
- Generate exactly 3 firstMoves as concrete actions for this week

Make every output deeply personal to ${contactData.fullName}'s specific situation. Reference their work breakdown percentages, time waste areas, transformation goal, and biggest challenge throughout.`;
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
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
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
            maxOutputTokens: 4000,
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
      
      data = sanitizeEnums(data);
      
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
            { role: 'system', content: 'You are an AI leadership assessment analyzer trained on cognitive frameworks including A/B Framing, Dialectical Reasoning, Mental Contrasting (WOOP), Reflective Equilibrium, and First-Principles Thinking. Always return valid JSON and apply these frameworks to generate deeply personalized insights.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
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
      "Schedule AI literacy assessment for your direct reports",
      "Book a 30-minute call with your IT leader to discuss current AI capabilities"
    ]
  };
}
