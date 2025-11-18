import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userId, contactData, assessmentData, profileData } = await req.json();
    console.log('Generating prompt library for session:', sessionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const synthesisPro = `You are an expert AI implementation strategist creating a personalized "AI Command Center" for an executive.

IMPORTANT: Use ONLY gender-neutral language throughout (they/their/them). Never assume the executive's gender.

EXECUTIVE PROFILE:
- Name: ${contactData.fullName}
- Role: ${contactData.roleTitle}
- Company: ${contactData.companyName} (${contactData.companySize})
- Primary Focus: ${contactData.primaryFocus}
- Timeline: ${contactData.timeline}

ASSESSMENT SCORES:
${Object.entries(assessmentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

DEEP PROFILE:
- Thinking Process: ${profileData.thinkingProcess}
- Communication Style: ${profileData.communicationStyle.join(', ')}
- Work Breakdown: ${Object.entries(profileData.workBreakdown).map(([k, v]) => `${k}: ${v}%`).join(', ')}
- Information Needs: ${profileData.informationNeeds.join(', ')}
- Transformation Goal: ${profileData.transformationGoal}
- Time on Non-Critical Work: ${profileData.timeWaste}%
- Specific Time Wasters: ${profileData.timeWasteExamples}
- Top Delegation Priorities: ${profileData.delegateTasks.join(', ')}
- Biggest Communication Challenge: ${profileData.biggestChallenge}
- Key Stakeholders: ${profileData.stakeholders.join(', ')}

YOUR TASK:
Generate a comprehensive "Master Prompt Library Package" in JSON format:

{
  "executiveProfile": {
    "summary": "150-word summary of their thinking style, communication preferences, and work patterns",
    "transformationOpportunity": "The single biggest way AI can create value for them (CRITICAL: MAX 300 characters - be concise, complete, and impactful)"
  },
  "recommendedProjects": [
    {
      "name": "Project name (e.g., Strategic Brief Generator)",
      "purpose": "One sentence on specific value",
      "whenToUse": "Specific use case scenarios",
      "masterInstructions": "300-400 word custom prompt incorporating their style, role, and context. Include: who they are, how they think, what they need, and constraints.",
      "examplePrompts": ["Starter prompt 1", "Starter prompt 2", "Starter prompt 3"],
      "successMetrics": ["Metric 1", "Metric 2"]
    }
  ],
  "promptTemplates": [
    {
      "name": "Template name",
      "category": "Category (e.g., Decision-Making, Stakeholder Communication)",
      "prompt": "The actual prompt template with placeholders"
    }
  ],
  "implementationRoadmap": {
    "week1": "Start with these 2 projects (specify which ones and why)",
    "week2to4": "Expand to these additional use cases",
    "month2plus": "Advanced techniques to try"
  }
}

CRITICAL REQUIREMENTS:
- Generate 3-5 projects (MVP scope)
- Every prompt must reflect THEIR specific communication style
- Address THEIR specific bottlenecks from the profile
- Match THEIR stakeholder context
- Use THEIR language and terminology
- Focus on THEIR transformation goal
- **TRANSFORMATION OPPORTUNITY MUST BE MAX 300 CHARACTERS** - Be concise yet complete. Focus on the single most impactful value proposition.

Return ONLY valid JSON, no markdown formatting.`;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    let generatedContent;
    let generationModel = 'gpt-5-mini-2025-08-07';
    
    // PLAN A: OpenAI with Retry Logic
    const maxRetries = 3;
    const retryDelays = [2000, 4000, 8000];
    let openaiSucceeded = false;
    
    console.log('🔄 Starting OpenAI API call with retry logic...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}/${maxRetries} - Calling OpenAI...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            max_completion_tokens: 4000,
            response_format: { type: "json_object" },
            messages: [
              { role: 'system', content: 'You are an expert AI implementation strategist. Generate detailed, personalized AI prompt libraries in valid JSON format.' },
              { role: 'user', content: synthesisPro }
            ]
          }),
        });
        
        clearTimeout(timeoutId);
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          console.log('✅ OpenAI succeeded on attempt', attempt);
          console.log('Token usage:', aiData.usage);
          
          generatedContent = aiData.choices[0]?.message?.content;
          if (generatedContent) {
            openaiSucceeded = true;
            break;
          }
        }
        
        if ([502, 503, 504].includes(aiResponse.status)) {
          const errorText = await aiResponse.text();
          console.warn(`⚠️ OpenAI infrastructure error ${aiResponse.status} on attempt ${attempt}:`, errorText);
          
          if (attempt < maxRetries) {
            const delay = retryDelays[attempt - 1];
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          } else {
            console.error('❌ OpenAI retries exhausted');
            throw new Error('OPENAI_RETRIES_EXHAUSTED');
          }
        }
        
        const errorText = await aiResponse.text();
        console.error(`❌ OpenAI client error ${aiResponse.status}:`, errorText);
        throw new Error(`OpenAI client error: ${aiResponse.status}`);
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error('❌ OpenAI timeout on attempt', attempt);
          if (attempt >= maxRetries) {
            throw new Error('OPENAI_TIMEOUT');
          }
          await new Promise(r => setTimeout(r, retryDelays[attempt - 1]));
          continue;
        }
        
        throw error;
      }
    }
    
    // PLAN B: Gemini Fallback
    if (!openaiSucceeded) {
      console.log('⚠️ OpenAI failed, attempting Gemini fallback (Plan B)...');
      
      if (!lovableApiKey) {
        console.error('❌ LOVABLE_API_KEY not configured for fallback');
        throw new Error('LOVABLE_API_KEY not configured');
      }
      
      try {
        const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            max_tokens: 4000,
            messages: [
              { role: 'system', content: 'You are an expert AI implementation strategist. Generate detailed, personalized AI prompt libraries in valid JSON format.' },
              { role: 'user', content: synthesisPro }
            ]
          }),
        });
        
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('❌ Gemini fallback failed:', geminiResponse.status, errorText);
          throw new Error('GEMINI_FAILED');
        }
        
        const geminiData = await geminiResponse.json();
        console.log('✅ Gemini fallback succeeded');
        console.log('Token usage:', geminiData.usage);
        
        generatedContent = geminiData.choices[0]?.message?.content;
        generationModel = 'google/gemini-2.5-flash';
        
        if (!generatedContent) {
          throw new Error('GEMINI_FAILED');
        }
        
      } catch (error) {
        // PLAN C: Template Fallback
        if (error.message === 'GEMINI_FAILED' || error.message === 'LOVABLE_API_KEY not configured') {
          console.log('⚠️ Both APIs failed, using template fallback (Plan C)...');
          
          const fallbackLibrary = {
            executiveProfile: {
              summary: `${contactData.fullName} is a ${contactData.roleTitle} at ${contactData.companyName} focused on ${contactData.primaryFocus}. They prefer ${profileData.communicationStyle.join(' and ')} communication and have a ${profileData.thinkingProcess} thinking process. Their main goal is ${profileData.transformationGoal}.`,
              transformationOpportunity: `AI can help ${contactData.roleTitle} reduce the ${profileData.timeWaste}% time spent on ${profileData.timeWasteExamples} by automating routine tasks and enhancing ${contactData.primaryFocus} effectiveness.`
            },
            recommendedProjects: [
              {
                name: "Strategic Analysis Assistant",
                purpose: "Accelerate decision-making with AI-powered analysis",
                whenToUse: "When analyzing complex business situations or preparing strategic recommendations",
                masterInstructions: `You are an AI assistant supporting ${contactData.fullName}, a ${contactData.roleTitle} at ${contactData.companyName}. Focus on ${contactData.primaryFocus}. Use ${profileData.communicationStyle[0]} communication style. Provide concise, actionable insights that address ${profileData.biggestChallenge}.`,
                examplePrompts: [
                  `Analyze this situation from a ${contactData.primaryFocus} perspective...`,
                  `Help me prepare a brief on [topic] for ${profileData.stakeholders[0] || 'leadership'}`,
                  `What are the key risks and opportunities in [scenario]?`
                ],
                successMetrics: ["Reduce analysis time by 30%", "Improve recommendation quality"]
              },
              {
                name: "Communication Drafting Tool",
                purpose: "Speed up stakeholder communication",
                whenToUse: `When communicating with ${profileData.stakeholders.join(', ')}`,
                masterInstructions: `Draft communications for ${contactData.fullName} using ${profileData.communicationStyle[0]} style. Keep it concise and focused on ${contactData.primaryFocus} priorities.`,
                examplePrompts: [
                  "Draft an update email about [project]",
                  "Help me explain [complex topic] simply",
                  "Write a meeting prep brief for [meeting]"
                ],
                successMetrics: ["Save 5+ hours per week on communication", "Improve clarity and impact"]
              }
            ],
            promptTemplates: [
              {
                name: "Quick Analysis",
                category: "Decision-Making",
                prompt: `As my AI chief of staff, analyze [situation] and provide: 1) Key insights, 2) Risks, 3) Recommended action. Keep it under 200 words.`
              },
              {
                name: "Stakeholder Brief",
                category: "Communication",
                prompt: `Draft a ${profileData.communicationStyle[0]} brief for ${profileData.stakeholders[0] || 'stakeholders'} about [topic]. Include key points, risks, and next steps.`
              },
              {
                name: "Task Delegation",
                category: "Productivity",
                prompt: `Help me delegate [task] by creating: 1) Clear instructions, 2) Success criteria, 3) Checkpoints.`
              }
            ],
            implementationRoadmap: {
              week1: "Start with the Strategic Analysis Assistant for daily decision-making",
              week2to4: "Add the Communication Drafting Tool for stakeholder updates",
              month2plus: "Expand to custom prompts for your specific workflows"
            }
          };
          
          generatedContent = JSON.stringify(fallbackLibrary);
          generationModel = 'template-fallback';
          console.log('✅ Template fallback generated');
        } else {
          throw error;
        }
      }
    }

    if (!generatedContent) {
      throw new Error('No content generated from any source');
    }

    console.log('AI generation successful, parsing response...');

    let parsedLibrary;
    try {
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedLibrary = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    const { data: profileRecord, error: dbError } = await supabase
      .from('prompt_library_profiles')
      .insert({
        user_id: userId,
        session_id: sessionId,
        executive_profile: parsedLibrary.executiveProfile || {},
        communication_style: {
          styles: profileData.communicationStyle,
          thinkingProcess: profileData.thinkingProcess,
          biggestChallenge: profileData.biggestChallenge
        },
        bottleneck_analysis: {
          timeWaste: profileData.timeWaste,
          examples: profileData.timeWasteExamples,
          delegatePriorities: profileData.delegateTasks
        },
        stakeholder_map: {
          stakeholders: profileData.stakeholders
        },
        trust_calibration: {
          trustLevel: assessmentData.aiTrustFactor,
          transformationGoal: profileData.transformationGoal
        },
        workflow_preferences: {
          workBreakdown: profileData.workBreakdown,
          informationNeeds: profileData.informationNeeds
        },
        recommended_projects: parsedLibrary.recommendedProjects || [],
        prompt_templates: parsedLibrary.promptTemplates || [],
        implementation_roadmap: parsedLibrary.implementationRoadmap || {},
        generation_model: generationModel,
        generation_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store prompt library');
    }

    console.log('Prompt library stored successfully:', profileRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileId: profileRecord.id,
        generationModel: generationModel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-prompt-library:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
