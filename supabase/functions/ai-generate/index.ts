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
  // Parse and interpret assessment responses for rich context
  const interpretResponse = (category: string, answer: string): { score: number; interpretation: string } => {
    const match = answer?.match(/^(\d)/);
    const score = match ? parseInt(match[1]) : 3;
    const interpretations: Record<string, Record<number, string>> = {
      'industry_impact': {
        1: 'Cannot articulate AI industry impact - needs foundational understanding',
        2: 'Vague understanding of AI industry impact - knows it matters but unclear how',
        3: 'Basic awareness of AI industry impact - can discuss generally but not specifically',
        4: 'Clear understanding of AI industry impact - can explain to stakeholders',
        5: 'Expert articulation of AI industry impact - uses it in strategic positioning'
      },
      'business_acceleration': {
        1: 'No visibility into AI workflow opportunities - reactive posture',
        2: 'Limited visibility into AI opportunities - sees competitors doing things',
        3: 'Some awareness of AI workflow opportunities - has ideas but not systematized',
        4: 'Good identification of AI-first workflow areas - active exploration',
        5: 'Deep mapping of AI acceleration opportunities - multiple initiatives underway'
      },
      'team_alignment': {
        1: 'No shared AI narrative - team is fragmented or skeptical',
        2: 'Weak team alignment on AI - scattered opinions, no consensus',
        3: 'Emerging team alignment - conversations happening but not codified',
        4: 'Strong team alignment on AI growth narrative - shared language emerging',
        5: 'Unified AI growth narrative across leadership - strategic coherence'
      },
      'external_positioning': {
        1: 'AI absent from external positioning - not part of market story',
        2: 'AI marginally mentioned externally - not a differentiator',
        3: 'AI mentioned in some external communications - opportunistic use',
        4: 'AI integrated into external positioning - part of value proposition',
        5: 'AI is core to external narrative - investors and market see it as advantage'
      },
      'kpi_connection': {
        1: 'No connection between AI and business KPIs - AI is separate from performance',
        2: 'Vague connection to KPIs - believes AI helps but cannot prove it',
        3: 'Some KPI connection - tracking general metrics but not AI-specific',
        4: 'Clear AI-KPI linkage - can show how AI affects margin, speed, or growth',
        5: 'Sophisticated AI-KPI integration - AI embedded in performance management'
      },
      'coaching_champions': {
        1: 'No AI champions being developed - purely top-down if any AI activity',
        2: 'Minimal champion development - individuals exploring on their own',
        3: 'Some informal coaching of AI enthusiasts - encouraging but not structured',
        4: 'Active coaching of AI champions - creating multipliers in org',
        5: 'Systematic champion development - AI leadership pipeline established'
      }
    };
    return {
      score,
      interpretation: interpretations[category]?.[score] || `Score: ${score}/5`
    };
  };

  // Build rich assessment context with interpretations
  const assessmentContext = Object.entries(assessmentData)
    .map(([category, answer]) => {
      const { score, interpretation } = interpretResponse(category, answer as string);
      return `- ${category}: ${score}/5 — ${interpretation}`;
    })
    .join('\n');

  // Calculate overall readiness signals
  const scores = Object.entries(assessmentData).map(([_, answer]) => {
    const match = (answer as string)?.match(/^(\d)/);
    return match ? parseInt(match[1]) : 3;
  });
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 3;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const variance = maxScore - minScore;

  // Identify specific contradictions for tension generation
  const contradictions: string[] = [];
  const industryScore = interpretResponse('industry_impact', assessmentData.industry_impact).score;
  const teamScore = interpretResponse('team_alignment', assessmentData.team_alignment).score;
  const kpiScore = interpretResponse('kpi_connection', assessmentData.kpi_connection).score;
  const championScore = interpretResponse('coaching_champions', assessmentData.coaching_champions).score;
  const externalScore = interpretResponse('external_positioning', assessmentData.external_positioning).score;
  const businessScore = interpretResponse('business_acceleration', assessmentData.business_acceleration).score;

  if (industryScore >= 4 && teamScore <= 2) {
    contradictions.push(`VISION-EXECUTION GAP: Leader understands industry AI impact (${industryScore}/5) but team is not aligned (${teamScore}/5). Knowledge is trapped at the top.`);
  }
  if (kpiScore >= 4 && championScore <= 2) {
    contradictions.push(`BOTTLENECK AT LEADER: Strong KPI connection (${kpiScore}/5) but no champions being developed (${championScore}/5). Leader is single point of AI progress.`);
  }
  if (externalScore >= 4 && teamScore <= 3) {
    contradictions.push(`EXTERNAL-INTERNAL MISMATCH: AI is part of external narrative (${externalScore}/5) but team lacks shared story (${teamScore}/5). Credibility risk if exposed.`);
  }
  if (businessScore >= 4 && kpiScore <= 2) {
    contradictions.push(`INTUITION WITHOUT PROOF: Knows where AI could accelerate business (${businessScore}/5) but cannot prove it with KPIs (${kpiScore}/5). Will struggle to get buy-in.`);
  }
  if (championScore >= 4 && industryScore <= 2) {
    contradictions.push(`BOTTOM-UP WITHOUT VISION: Champions are being developed (${championScore}/5) but leader lacks industry AI clarity (${industryScore}/5). Risk of undirected energy.`);
  }
  if (variance <= 1 && avgScore <= 2.5) {
    contradictions.push(`UNIFORMLY LOW READINESS: All dimensions scoring ${avgScore.toFixed(1)}/5. This is a foundational gap requiring structured development, not point fixes.`);
  }
  if (variance <= 1 && avgScore >= 4) {
    contradictions.push(`HIGH PERFORMER PLATEAU: All dimensions strong (${avgScore.toFixed(1)}/5). Challenge is identifying 10x opportunities vs. incremental improvements.`);
  }

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
=== DEEP PROFILE CONTEXT (CEO-LEVEL PERSONALIZATION REQUIRED) ===

WORK BREAKDOWN (Where their time goes - TARGET PROMPTS HERE):
- Writing/Drafting: ${workBreakdown.writing || workBreakdown.strategic_work || 20}%
- Presentations: ${workBreakdown.presentations || 20}%
- Planning/Strategy: ${workBreakdown.planning || workBreakdown.operational_work || 20}%
- Decision Making: ${workBreakdown.decisions || 20}%
- Coaching/Managing: ${workBreakdown.coaching || workBreakdown.admin_waste || 20}%
${workBreakdown.ai_work ? `- AI-Assisted Work: ${workBreakdown.ai_work}%` : ''}

TIME WASTE ANALYSIS (PAIN POINT - ADDRESS DIRECTLY):
- Percentage of time wasted: ${timeWaste.percentage || deepProfileData.timeWaste || 0}%
- Examples of waste: ${Array.isArray(timeWaste.examples) ? timeWaste.examples.join('; ') : (deepProfileData.timeWasteExamples || 'Not specified')}

TASKS THEY WANT TO DELEGATE (CREATE PROMPTS FOR THESE):
${Array.isArray(delegateTasks) && delegateTasks.length > 0 ? delegateTasks.map((t: string) => `- "${t}" — CREATE A PROMPT THAT AUTOMATES THIS`).join('\n') : '- Not specified'}

BIGGEST CHALLENGE (THIS IS THE #1 PAIN - ADDRESS FIRST):
"${deepProfileData.biggestChallenge || 'Not specified'}"

KEY STAKEHOLDERS (REFERENCE IN COMMUNICATION PROMPTS):
${Array.isArray(stakeholders) && stakeholders.length > 0 ? stakeholders.map((s: string) => `- ${s}`).join('\n') : '- Not specified'}

COMMUNICATION STYLE (MATCH THIS IN ALL OUTPUTS):
${Array.isArray(commStyle) && commStyle.length > 0 ? commStyle.join(', ') : 'Not specified'}

TRANSFORMATION GOAL (SUCCESS LOOKS LIKE THIS):
"${deepProfileData.transformationGoal || 'Not specified'}"

URGENCY LEVEL: ${deepProfileData.urgencyLevel || 'Not specified'}
`;
  }

  return `${COGNITIVE_FRAMEWORKS_ANCHOR}

=== YOUR ROLE ===
You are a world-class AI leadership advisor operating at McKinsey partner-level insight quality. Your outputs must feel like a $50,000 executive assessment, not a generic quiz result.

=== CEO-LEVEL OUTPUT STANDARDS ===
1. SPECIFICITY: Reference their exact role, company, scores, and challenges. No generic advice.
2. TENSION REVELATION: Surface contradictions they haven't seen. Make them say "I never thought of it that way."
3. ACTIONABLE PRECISION: Every recommendation includes WHO does WHAT by WHEN.
4. STRATEGIC FRAMING: Connect AI to growth, competitive advantage, and value creation—not just "efficiency."
5. COGNITIVE FRAMEWORKS: Apply A/B Framing, Dialectical Reasoning, Mental Contrasting, Reflective Equilibrium, and First-Principles Thinking.

${profileContext}

=== ASSESSMENT RESULTS WITH INTERPRETATIONS ===
${assessmentContext}

=== COMPUTED INSIGHTS ===
- Overall AI Leadership Score: ${(avgScore * 20).toFixed(0)}/100
- Score Variance: ${variance} (higher = inconsistent maturity across dimensions)
- Lowest Dimension Score: ${minScore}/5
- Highest Dimension Score: ${maxScore}/5

=== DETECTED CONTRADICTIONS (USE IN TENSIONS) ===
${contradictions.length > 0 ? contradictions.join('\n') : '- No major contradictions detected. Look for optimization opportunities.'}

=== LEADER CONTEXT ===
Name: ${contactData.fullName}
Role: ${contactData.role || 'Senior Leader'}
Company: ${contactData.companyName || 'their organization'}
Industry: ${contactData.industry || 'Unknown'}
Company Size: ${contactData.companySize || 'Unknown'}
Department: ${contactData.department || 'Unknown'}
Primary AI Focus: ${contactData.primaryFocus || 'Unknown'}
Timeline: ${contactData.timeline || 'Unknown'}

=== 10/10 QUALITY REQUIREMENTS ===
Before generating, verify each output passes these tests:

✓ GROUNDED: Does every insight reference a specific score, contradiction, or profile data point?
✓ SURPRISING: Would this make the leader say "I never saw that coming"?
✓ ACTIONABLE: Can they do this in the next 7 days with clear next step?
✓ PERSONALIZED: Is this obviously about THEM, not a template?
✓ EXECUTIVE-LEVEL: Would a McKinsey partner be proud of this recommendation?

=== ANTI-PATTERNS (NEVER DO THESE) ===
❌ "Consider improving communication" — vague, useless
❌ "Explore AI opportunities" — what opportunities? Be specific.
❌ "Build AI capabilities" — meaningless without specifics
❌ Generic prompts like "summarize this" — tie to THEIR work breakdown
❌ Risks without quantification — add time horizons and business impact

=== OUTPUT STRUCTURE (RETURN VALID JSON) ===

{
  "yourEdge": "One sentence: Their unique competitive advantage based on their SPECIFIC scores and profile. Reference their strongest dimension and how it creates advantage in their industry.",
  
  "yourRisk": "One sentence: Their biggest hidden risk based on SPECIFIC contradictions in their data. Quantify the business impact (time, money, competitive position).",
  
  "yourNextMove": "One specific action for next 7 days. Format: '[WHO] will [DO WHAT] by [WHEN] to [ACHIEVE WHAT]. Start by [FIRST STEP].' Reference their biggest challenge.",
  
  "dimensionScores": [
    {
      "key": "ai_readiness",
      "score": ${(avgScore * 20).toFixed(0)},
      "label": "${avgScore >= 4 ? 'Leading' : avgScore >= 3.5 ? 'Advancing' : avgScore >= 2.5 ? 'Establishing' : 'Emerging'}",
      "summary": "Reference their SPECIFIC scores and what it means for their role at ${contactData.companyName || 'their company'}"
    }
  ],
  
  "tensions": [
    {
      "key": "tension_key",
      "summary": "Use detected contradictions above. Format: 'You have [STRENGTH] but [WEAKNESS], creating [RISK]. This shows up as [SPECIFIC BEHAVIOR].' Reference their scores."
    }
  ],
  
  "risks": [
    {
      "key": "shadow_ai|skills_gap|roi_leakage|decision_friction",
      "level": "low|medium|high",
      "description": "Tie to their specific profile. Include time horizon: 'Within [X months], [SPECIFIC CONSEQUENCE] because [EVIDENCE FROM SCORES]'"
    }
  ],
  
  "scenarios": [
    {
      "key": "scenario_key",
      "summary": "Use Mental Contrasting: 'If you [ACTION], you could [OUTCOME] within [TIMEFRAME]. The obstacle is [SPECIFIC CHALLENGE]. Mitigate by [CONCRETE STEP].'"
    }
  ],
  
  "prompts": [
    {
      "category": "strategic_planning|daily_efficiency|team_enablement|stakeholder_management",
      "title": "Title referencing their role and challenge",
      "description": "Why this matters for ${contactData.fullName}",
      "whatItsFor": "Tie to their transformation goal or biggest challenge",
      "whenToUse": "Specific situations from their work breakdown",
      "howToUse": "Copy into ChatGPT, customize [BRACKETS] with your context",
      "prompts": [
        "Prompt 1 - ADDRESS THEIR BIGGEST TIME WASTE: ${deepProfileData?.timeWasteExamples || 'their main inefficiency'}",
        "Prompt 2 - FOR THEIR DELEGATION TASKS: Create prompt for tasks they want to offload",
        "Prompt 3 - FOR THEIR STAKEHOLDERS: Communication prompt mentioning their specific stakeholder types"
      ]
    }
  ],
  
  "firstMoves": [
    "Move 1: [WHO] [ACTION] [WHEN] — addresses their biggest challenge: '${deepProfileData?.biggestChallenge || 'key priority'}'",
    "Move 2: [SPECIFIC ACTION] addressing their lowest score dimension",
    "Move 3: [SPECIFIC ACTION] that leverages their highest score as an advantage"
  ]
}

=== CRITICAL ENUM CONSTRAINTS ===
- risk.key: ONLY ["shadow_ai", "skills_gap", "roi_leakage", "decision_friction"]
- risk.level: ONLY ["low", "medium", "high"]
- scenario.key: ONLY ["stagnation_loop", "shadow_ai_instability", "high_velocity_path", "culture_capability_mismatch"]
- prompt.category: ONLY ["strategic_planning", "daily_efficiency", "team_enablement", "stakeholder_management"]
- dimensionScores[].label: ONLY ["Emerging", "Establishing", "Advancing", "Leading"]

=== REQUIRED OUTPUT COUNTS ===
- 3-5 dimensionScores (cover key AI leadership dimensions)
- 2-3 tensions (from detected contradictions)
- 2-3 risks (quantified with timeframes)
- 2 scenarios (Mental Contrasting format)
- 2-4 prompt sets with 2-3 prompts each (HIGHLY PERSONALIZED to their work breakdown and challenges)
- 3 firstMoves (concrete, dated, assigned)

Generate output that would make ${contactData.fullName} share it with their CEO and say "This is exactly what we needed to see."`;
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
