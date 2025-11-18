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
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      throw new Error('GEMINI_API_KEY required');
    }

    console.log('Generating personalized insights for:', contactData.fullName);

    const prompt = buildPersonalizedPrompt(assessmentData, contactData, deepProfileData);
    
    let personalizedInsights = null;
    let generationSource = '';
    const startTime = Date.now();

    // ============= PLAN A: YOUR FINE-TUNED GEMINI (15s timeout) =============
    console.log('🔄 Calling YOUR fine-tuned Gemini API...');
    const geminiController = new AbortController();
    const geminiTimeoutId = setTimeout(() => geminiController.abort(), 15000);

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          signal: geminiController.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              responseMimeType: "application/json"
            }
          })
        }
      );
      clearTimeout(geminiTimeoutId);

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const geminiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiContent) {
          personalizedInsights = JSON.parse(geminiContent);
          generationSource = 'gemini-custom';
          console.log('✅ YOUR Gemini succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'gemini-custom',
            durationMs: Date.now() - startTime,
            success: true,
            attemptNumber: 1
          });
        }
      } else {
        const errorText = await geminiResponse.text();
        console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      }
    } catch (error: any) {
      clearTimeout(geminiTimeoutId);
      console.error('❌ YOUR Gemini failed:', error.message);
    }

    // ============= PLAN B: OPENAI FALLBACK (15s timeout) =============
    if (!personalizedInsights && openaiApiKey) {
      console.log('⚠️ Gemini failed, trying OpenAI fallback...');
      const openaiController = new AbortController();
      const openaiTimeoutId = setTimeout(() => openaiController.abort(), 15000);

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: openaiController.signal,
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            max_completion_tokens: 3000,
            messages: [
              { 
                role: 'system', 
                content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative.' 
              },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_personalized_insights",
                description: "Generate personalized AI leadership insights",
                parameters: {
                  type: "object",
                  properties: {
                    growthReadiness: {
                      type: "object",
                      properties: {
                        level: { type: "string", enum: ["High", "Medium-High", "Medium", "Developing"] },
                        preview: { type: "string", maxLength: 50 },
                        details: { type: "string", maxLength: 120 }
                      },
                      required: ["level", "preview", "details"]
                    },
                    leadershipStage: {
                      type: "object",
                      properties: {
                        stage: { type: "string", enum: ["Orchestrator", "Confident", "Aware", "Emerging"] },
                        preview: { type: "string", maxLength: 50 },
                        details: { type: "string", maxLength: 120 }
                      },
                      required: ["stage", "preview", "details"]
                    },
                    keyFocus: {
                      type: "object",
                      properties: {
                        category: { 
                          type: "string", 
                          enum: ["Team Alignment", "Strategic Execution", "Decision Quality", "Time Leverage"]
                        },
                        preview: { type: "string", maxLength: 50 },
                        details: { type: "string", maxLength: 120 }
                      },
                      required: ["category", "preview", "details"]
                    },
                    quickWins: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", maxLength: 60 },
                          impact: { type: "string", maxLength: 100 },
                          timeToValue: { type: "string", enum: ["1 week", "2 weeks", "1 month"] }
                        },
                        required: ["title", "impact", "timeToValue"]
                      },
                      minItems: 3,
                      maxItems: 4
                    }
                  },
                  required: ["growthReadiness", "leadershipStage", "keyFocus", "quickWins"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_personalized_insights" } }
          })
        });
        clearTimeout(openaiTimeoutId);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const toolCall = openaiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            personalizedInsights = JSON.parse(toolCall.function.arguments);
            generationSource = 'openai';
            console.log('✅ OpenAI succeeded in', Date.now() - startTime, 'ms');
            console.log('📊 Generation metrics:', {
              source: 'openai',
              durationMs: Date.now() - startTime,
              success: true
            });
          }
        }
      } catch (error: any) {
        clearTimeout(openaiTimeoutId);
        console.error('❌ OpenAI failed:', error.message);
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
1. growthReadiness: Assess their AI adoption readiness (High/Medium-High/Medium/Developing) with 50-char preview and 120-char actionable detail
2. leadershipStage: Determine stage (Orchestrator/Confident/Aware/Emerging) with 50-char preview and 120-char next step
3. keyFocus: Pick ONE category (Team Alignment/Strategic Execution/Decision Quality/Time Leverage) most relevant to their ${contactData.primaryFocus} with 50-char preview and 120-char action
4. quickWins: 3-4 specific, personalized quick wins with title (60 chars), impact (100 chars), and realistic timeToValue (1 week/2 weeks/1 month)

Make every insight hyper-personalized to ${contactData.fullName}'s context. Be specific, quantitative, and actionable.`;
}
