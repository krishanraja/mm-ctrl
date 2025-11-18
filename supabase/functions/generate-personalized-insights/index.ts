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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating personalized insights for:', contactData.fullName);

    const prompt = buildPersonalizedPrompt(assessmentData, contactData, deepProfileData);

    // ============= 3-TIER FALLBACK SYSTEM =============
    
    const maxRetries = 2;
    const retryDelays = [2000, 3000];
    const timeoutMs = 20000;
    
    let personalizedInsights = null;
    let openaiSucceeded = false;
    let generationSource = '';

    // PLAN A: OpenAI with retry logic
    for (let attempt = 1; attempt <= maxRetries && !openaiSucceeded; attempt++) {
      console.log(`🔄 OpenAI attempt ${attempt}/${maxRetries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            max_completion_tokens: 3000,
            messages: [
              { 
                role: 'system', 
                content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative. Use clear templates for preview text and save detailed personalization for the details section.' 
              },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_personalized_insights",
                description: "Generate personalized AI leadership insights based on executive assessment data",
                parameters: {
                  type: "object",
                  properties: {
                    growthReadiness: {
                      type: "object",
                      properties: {
                        level: { type: "string", enum: ["High", "Medium-High", "Medium", "Developing"] },
                        preview: { type: "string", description: "Ultra-concise preview (max 50 chars) - punchy one-liner", maxLength: 50 },
                        details: { type: "string", description: "Full insight (max 120 chars) - specific, actionable", maxLength: 120 }
                      },
                      required: ["level", "preview", "details"]
                    },
                    leadershipStage: {
                      type: "object",
                      properties: {
                        stage: { type: "string", enum: ["Orchestrator", "Confident", "Aware", "Emerging"] },
                        preview: { type: "string", description: "Ultra-concise preview (max 50 chars) - punchy one-liner", maxLength: 50 },
                        details: { type: "string", description: "Full next step (max 120 chars) - concrete action", maxLength: 120 }
                      },
                      required: ["stage", "preview", "details"]
                    },
                    keyFocus: {
                      type: "object",
                      properties: {
                        category: { 
                          type: "string", 
                          enum: [
                            "Team Alignment",
                            "Process Automation", 
                            "Strategic Planning",
                            "Communication",
                            "Decision Making",
                            "Change Management",
                            "Innovation Culture",
                            "Data Strategy"
                          ],
                          description: "Select ONE category that best matches the executive's primary challenge"
                        },
                        preview: { type: "string", description: "Clear preview (max 50 chars)", maxLength: 50 },
                        details: { type: "string", description: "Specific action plan (max 120 chars)", maxLength: 120 }
                      },
                      required: ["category", "preview", "details"]
                    },
                    roadmapInitiatives: {
                      type: "array",
                      minItems: 3,
                      maxItems: 4,
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Clear, actionable title (max 60 chars)", maxLength: 60 },
                          description: { type: "string", description: "What they'll do (max 150 chars)", maxLength: 150 },
                          basedOn: { 
                            type: "array",
                            items: { type: "string" },
                            minItems: 2,
                            maxItems: 3,
                            description: "Exactly 2-3 specific data points from assessment"
                          },
                          impact: { type: "string", description: "Quantified outcome (max 80 chars)", maxLength: 80 },
                          timeline: { type: "string", enum: ["30 days", "60 days", "90 days"] },
                          growthMetric: { type: "string", description: "% or metric improvement (max 40 chars)", maxLength: 40 },
                          scaleUpsDimensions: {
                            type: "array",
                            items: { 
                              type: "string",
                              enum: ["AI Fluency", "Delegation Mastery", "Strategic Vision", "Decision Agility", "Impact Orientation", "Change Leadership"]
                            },
                            minItems: 1,
                            maxItems: 2
                          }
                        },
                        required: ["title", "description", "basedOn", "impact", "timeline", "growthMetric", "scaleUpsDimensions"]
                      }
                    }
                  },
                  required: ["growthReadiness", "leadershipStage", "keyFocus", "roadmapInitiatives"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_personalized_insights" } }
          }),
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const toolCall = data.choices[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            personalizedInsights = JSON.parse(toolCall.function.arguments);
            console.log(`✅ OpenAI succeeded on attempt ${attempt}`);
            console.log('Token usage:', data.usage);
            openaiSucceeded = true;
            generationSource = 'openai';
            break;
          }
          
          console.warn('⚠️ OpenAI returned 200 but no tool call, retrying...');
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelays[attempt - 1]));
          }
          continue;
        }
        
        if ([502, 503, 504].includes(response.status)) {
          console.warn(`⚠️ OpenAI infrastructure error ${response.status} on attempt ${attempt}`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelays[attempt - 1]));
            continue;
          }
        }
        
        const errorText = await response.text();
        console.error(`❌ OpenAI error ${response.status}: ${errorText}`);
        break; // Continue to fallback instead of throwing
        
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error(`❌ OpenAI timeout on attempt ${attempt}`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelays[attempt - 1]));
            continue;
          } else {
            console.log('⚠️ All OpenAI attempts exhausted, continuing to fallback...');
            break;
          }
        } else {
          console.error(`❌ OpenAI exception on attempt ${attempt}:`, error);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelays[attempt - 1]));
            continue;
          } else {
            console.log('⚠️ All OpenAI attempts exhausted, continuing to fallback...');
            break;
          }
        }
      }
    }

    // PLAN B: Gemini fallback if OpenAI exhausted
    if (!openaiSucceeded) {
      console.log('⚠️ OpenAI failed, attempting Gemini fallback (Plan B)...');
      
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        console.error('❌ LOVABLE_API_KEY not configured');
      } else {
        try {
          const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              max_tokens: 8000,
              messages: [
                { role: 'system', content: 'You are an executive AI leadership coach. Generate personalized insights based on assessment data. Be direct, actionable, and quantitative.' },
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
                          preview: { type: "string" },
                          details: { type: "string" }
                        },
                        required: ["level", "preview", "details"]
                      },
                      leadershipStage: {
                        type: "object",
                        properties: {
                          stage: { type: "string", enum: ["Orchestrator", "Confident", "Aware", "Emerging"] },
                          preview: { type: "string" },
                          details: { type: "string" }
                        },
                        required: ["stage", "preview", "details"]
                      },
                      keyFocus: {
                        type: "object",
                        properties: {
                          category: { type: "string", enum: ["Team Alignment", "Process Automation", "Strategic Planning", "Communication", "Decision Making", "Change Management", "Innovation Culture", "Data Strategy"] },
                          preview: { type: "string" },
                          details: { type: "string" }
                        },
                        required: ["category", "preview", "details"]
                      },
                      roadmapInitiatives: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            basedOn: { type: "array", items: { type: "string" } },
                            impact: { type: "string" },
                            timeline: { type: "string" },
                            growthMetric: { type: "string" },
                            scaleUpsDimensions: { type: "array", items: { type: "string" } }
                          },
                          required: ["title", "description", "basedOn", "impact", "timeline", "growthMetric", "scaleUpsDimensions"]
                        }
                      }
                    },
                    required: ["growthReadiness", "leadershipStage", "keyFocus", "roadmapInitiatives"]
                  }
                }
              }],
              tool_choice: { type: "function", function: { name: "generate_personalized_insights" } }
            }),
          });
          
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const toolCall = geminiData.choices[0]?.message?.tool_calls?.[0];
            
            if (toolCall?.function?.arguments) {
              personalizedInsights = JSON.parse(toolCall.function.arguments);
              console.log('✅ Gemini fallback succeeded');
              generationSource = 'gemini';
            }
          } else {
            console.error('❌ Gemini failed:', geminiResponse.status);
          }
        } catch (geminiError) {
          console.error('❌ Gemini exception:', geminiError);
        }
      }
    }

    // PLAN C: Template fallback
    if (!personalizedInsights) {
      console.log('⚠️ Using template fallback (Plan C)...');
      
      const totalScore = Object.values(assessmentData).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      const normalizedScore = Math.min(100, Math.round((totalScore / 18) * 100));
      
      let readiness = 'Medium';
      let stage = 'Aware';
      
      if (normalizedScore >= 75) { readiness = 'High'; stage = 'Orchestrator'; }
      else if (normalizedScore >= 50) { readiness = 'Medium-High'; stage = 'Confident'; }
      else if (normalizedScore >= 25) { readiness = 'Medium'; stage = 'Aware'; }
      else { readiness = 'Developing'; stage = 'Emerging'; }
      
      personalizedInsights = {
        growthReadiness: {
          level: readiness,
          preview: `AI ready with ${normalizedScore}% score`,
          details: `You scored ${normalizedScore}/100. Focus on practical quick wins to build momentum.`
        },
        leadershipStage: {
          stage: stage,
          preview: `${stage} stage leadership`,
          details: `Strengthen your weakest dimensions to progress to the next tier.`
        },
        keyFocus: {
          category: contactData.primaryFocus || "Strategic Planning",
          preview: "Start with high-impact basics",
          details: `Focus on ${contactData.primaryFocus || 'planning'} improvements for immediate results.`
        },
        roadmapInitiatives: [
          {
            title: "AI Quick Win Pilot",
            description: "Implement one high-impact AI tool in your workflow.",
            basedOn: ["Your assessment", "Role needs"],
            impact: "10-20% time savings",
            timeline: "30 days",
            growthMetric: "15% faster",
            scaleUpsDimensions: ["AI Fluency"]
          },
          {
            title: "Team AI Training",
            description: "Run training to elevate team AI understanding.",
            basedOn: ["Team readiness", "Change needs"],
            impact: "50% faster adoption",
            timeline: "60 days",
            growthMetric: "3x adoption speed",
            scaleUpsDimensions: ["Change Leadership"]
          },
          {
            title: "Strategic AI Plan",
            description: "Develop roadmap aligning AI with business KPIs.",
            basedOn: ["Business context", "Strategic gaps"],
            impact: "Clear ROI framework",
            timeline: "90 days",
            growthMetric: "25% better decisions",
            scaleUpsDimensions: ["Strategic Vision"]
          }
        ]
      };
      
      generationSource = 'template';
      console.log('✅ Template fallback generated');
    }

    console.log(`keyFocus category selected: "${personalizedInsights.keyFocus.category}"`);

    return new Response(
      JSON.stringify({ personalizedInsights, generationSource }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-personalized-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPersonalizedPrompt(assessmentData: any, contactData: any, deepProfileData: any): string {
  return `
# EXECUTIVE PROFILE
Name: ${contactData.fullName}
Role: ${contactData.department}
Company: ${contactData.companyName} (${contactData.companySize})
Primary Focus: ${contactData.primaryFocus}
Timeline: ${contactData.timeline}

# ASSESSMENT RESPONSES
Industry Impact: ${assessmentData.industry_impact}/3
Business Acceleration: ${assessmentData.business_acceleration}/3  
Team Alignment: ${assessmentData.team_alignment}/3
External Positioning: ${assessmentData.external_positioning}/3
KPI Connection: ${assessmentData.kpi_connection}/3
Coaching Champions: ${assessmentData.coaching_champions}/3

# DEEP WORK PROFILE
Strategic Intent: ${deepProfileData?.strategicIntent || 'Not provided'}
Current Bottleneck: ${deepProfileData?.currentBottleneck || 'Not provided'}
Decision Authority: ${deepProfileData?.decisionAuthority || 'Not provided'}
Experience Level: ${deepProfileData?.experienceLevel || 'Not provided'}
Team Size: ${deepProfileData?.teamSize || 'Not provided'}
Urgency: ${deepProfileData?.urgency || 'Not provided'}

Generate personalized AI leadership insights based on this data.`;
}
