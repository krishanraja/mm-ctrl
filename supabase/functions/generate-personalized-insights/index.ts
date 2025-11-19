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
    const { assessmentData, contactData, deepProfileData } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY required');
    }

    console.log('Generating personalized insights for:', contactData.fullName);

    const prompt = buildPersonalizedPrompt(assessmentData, contactData, deepProfileData);
    
    let personalizedInsights = null;
    let generationSource = '';
    const startTime = Date.now();

    // ============= PLAN A: OPENAI GPT-4O-MINI (10s timeout) =============
    console.log('🔄 Plan A: Calling OpenAI gpt-4o-mini...');
    const openaiController = new AbortController();
    const openaiTimeoutId = setTimeout(() => openaiController.abort(), 10000);

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
        generationSource = 'openai-gpt4omini';
        console.log('✅ OpenAI succeeded in', Date.now() - startTime, 'ms');
        console.log('📊 Generation metrics:', {
          source: 'openai-gpt4omini',
          durationMs: Date.now() - startTime,
          success: true
        });
      }
    } catch (error: any) {
      clearTimeout(openaiTimeoutId);
      console.error('❌ OpenAI failed:', error.message);
    }

    // ============= PLAN B: LOVABLE AI GEMINI FALLBACK (12s timeout) =============
    if (!personalizedInsights && lovableApiKey) {
      console.log('⚠️ OpenAI failed, trying Lovable AI Gemini...');
      const lovableController = new AbortController();
      const lovableTimeoutId = setTimeout(() => lovableController.abort(), 12000);

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
          details: `${contactData.fullName}'s ${avgScore}/100 score shows ${avgScore >= 60 ? 'strong readiness' : 'solid progress'} in ${contactData.primaryFocus}. Focus: ${deepProfileData.transformationGoal}`
        },
        leadershipStage: {
          stage: avgScore >= 75 ? "Confident" : avgScore >= 60 ? "Aware" : "Emerging",
          preview: avgScore >= 60 ? "Leading AI adoption" : "Building AI literacy",
          details: `Ready to ${avgScore >= 60 ? 'scale AI adoption with team' : 'start pilot projects'}. Next: ${deepProfileData.delegateTasks[0]}`
        },
        keyFocus: {
          category: keyFocusMap[contactData.primaryFocus] || "Strategic Execution",
          preview: `Optimize ${contactData.primaryFocus.toLowerCase()}`,
          details: `Focus on ${deepProfileData.delegateTasks[0]} to address ${deepProfileData.biggestChallenge}`
        },
        quickWins: [
          {
            title: `Automate ${deepProfileData.delegateTasks[0]}`,
            impact: `Save ${Math.min(deepProfileData.timeWaste, 30)}% of time currently spent on repetitive ${deepProfileData.timeWasteExamples}`,
            timeToValue: "2 weeks"
          },
          {
            title: `AI-powered ${contactData.primaryFocus} assistant`,
            impact: `Streamline ${deepProfileData.stakeholders[0]} communications and ${deepProfileData.biggestChallenge}`,
            timeToValue: "1 month"
          },
          {
            title: "Team prompt library for common tasks",
            impact: `Standardize ${deepProfileData.communicationStyle[0]} approach across ${contactData.companySize} team`,
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
  return `Generate personalized AI leadership insights for ${contactData.fullName}, ${contactData.roleTitle} at ${contactData.companyName}.

ASSESSMENT SCORES:
${Object.entries(assessmentData).map(([key, value]) => `- ${key}: ${value}/100`).join('\n')}

CONTEXT:
- Primary Focus: ${contactData.primaryFocus}
- Timeline: ${contactData.timeline}
- Company Size: ${contactData.companySize}
- Transformation Goal: ${deepProfileData.transformationGoal}
- Time Waste: ${deepProfileData.timeWaste}% on ${deepProfileData.timeWasteExamples}
- Top Delegation Priorities: ${deepProfileData.delegateTasks.join(', ')}
- Communication Challenge: ${deepProfileData.biggestChallenge}
- Key Stakeholders: ${deepProfileData.stakeholders.join(', ')}

Generate:
1. growthReadiness: 
   - level: (High/Medium-High/Medium/Developing) 
   - preview: 2-3 sentence summary of their current state
   - details: 3-5 detailed paragraphs with specific, actionable recommendations tied to their transformation goal ("${deepProfileData.transformationGoal}"), work breakdown patterns, and time management data. Include specific examples, quantitative targets, and clear next steps. Reference their ${deepProfileData.timeWaste}% time waste on "${deepProfileData.timeWasteExamples}" and how AI can address this.

2. leadershipStage: 
   - stage: (Orchestrator/Confident/Aware/Emerging)
   - preview: 2-3 sentence assessment
   - details: 3-5 detailed paragraphs explaining why they're at this stage, what specific capabilities they have, what gaps exist, and concrete steps to advance. Include specific actions tied to their delegation priorities (${deepProfileData.delegateTasks.join(', ')}) and stakeholder context (${deepProfileData.stakeholders.join(', ')}).

3. keyFocus: 
   - category: ONE category (Team Alignment/Strategic Execution/Decision Quality/Time Leverage) most relevant to ${contactData.primaryFocus}
   - preview: 2-3 sentence rationale
   - details: 3-5 detailed paragraphs on why this is their top priority, specific strategies they can implement immediately, expected outcomes with metrics, and how this addresses their biggest challenge ("${deepProfileData.biggestChallenge}"). Include timeline-specific milestones matching their ${contactData.timeline} window.

4. quickWins: 3-4 specific, personalized quick wins with:
   - title (descriptive, no char limit)
   - impact (detailed explanation with quantitative projections)
   - realistic timeToValue (1 week/2 weeks/1 month)
   - implementation steps (2-3 specific actions)

CRITICAL: Make every insight hyper-personalized to ${contactData.fullName}'s actual context. Be specific, quantitative, and actionable. Use their actual data points, not generic advice. Reference their specific time wasters, transformation goals, and work patterns throughout.`;
}
