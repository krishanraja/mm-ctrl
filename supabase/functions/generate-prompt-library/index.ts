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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      throw new Error('GEMINI_API_KEY required');
    }

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

    let generatedContent;
    let generationModel = '';
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
              parts: [{ text: synthesisPro }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3000,
            }
          })
        }
      );
      clearTimeout(geminiTimeoutId);

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        generatedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedContent) {
          generationModel = 'gemini-custom';
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
    if (!generatedContent && openaiApiKey) {
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
              { role: 'system', content: 'You are an executive AI strategist. Return valid JSON only.' },
              { role: 'user', content: synthesisPro }
            ]
          })
        });
        clearTimeout(openaiTimeoutId);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          generatedContent = openaiData.choices?.[0]?.message?.content;
          if (generatedContent) {
            generationModel = 'openai';
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
    if (!generatedContent) {
      console.log('⚠️ All AI services failed, using template fallback');
      generationModel = 'template';
      const fallbackLibrary = {
        executiveProfile: {
          summary: `${contactData.fullName} operates as a ${contactData.roleTitle} focused on ${contactData.primaryFocus}. Their assessment shows strong capabilities in strategic thinking and team leadership, with opportunities to scale impact through AI-powered delegation and automation. Working in a ${contactData.companySize} organization, they balance ${profileData.workBreakdown.strategy || 30}% strategic work with operational demands.`,
          transformationOpportunity: `Transform ${profileData.timeWaste}% of non-critical work into strategic time by automating ${profileData.delegateTasks[0]}, streamlining ${profileData.biggestChallenge}, and empowering team decisions.`
        },
        recommendedProjects: [
          {
            name: "Executive Brief Generator",
            purpose: "Transform raw data and updates into executive-ready strategic summaries",
            whenToUse: "Before leadership meetings, quarterly reviews, or stakeholder updates",
            masterInstructions: `Act as ${contactData.roleTitle}'s strategic communications advisor. Transform verbose updates into crisp executive briefs focusing on ${contactData.primaryFocus}. Structure: Executive Summary (3 bullets), Key Insights (2-3 items), Recommended Actions (prioritized), Timeline. Match their ${profileData.communicationStyle.join(' and ')} style.`,
            examplePrompts: [
              "Synthesize this week's project updates into an executive brief for our leadership team",
              "Create a strategic summary of Q4 performance highlighting ${contactData.primaryFocus} progress",
              "Transform these stakeholder meeting notes into actionable next steps"
            ],
            successMetrics: [
              `Reduce brief preparation time by ${Math.min(profileData.timeWaste, 70)}%`,
              "Increase stakeholder alignment scores by 30%"
            ]
          },
          {
            name: "Decision Framework Assistant",
            purpose: "Structure complex decisions with stakeholder analysis and risk assessment",
            whenToUse: `When evaluating ${profileData.delegateTasks[1] || 'strategic initiatives'} or addressing ${profileData.biggestChallenge}`,
            masterInstructions: `You're ${contactData.fullName}'s decision advisor. Analyze decisions through: 1) Stakeholder Impact (${profileData.stakeholders.join(', ')}), 2) Strategic Alignment (${contactData.primaryFocus}), 3) Resource Trade-offs, 4) Risk Mitigation. Present options in their ${profileData.communicationStyle[0]} style with clear recommendations.`,
            examplePrompts: [
              `Analyze this ${profileData.delegateTasks[0]} decision considering our ${contactData.timeline} timeline`,
              "Evaluate trade-offs between these three strategic options",
              `Create a stakeholder impact assessment for ${profileData.biggestChallenge}`
            ],
            successMetrics: [
              "Reduce decision cycle time by 40%",
              "Improve decision confidence scores by 25%"
            ]
          },
          {
            name: "Team Communication Optimizer",
            purpose: `Address ${profileData.biggestChallenge} through AI-powered communication templates`,
            whenToUse: "Team announcements, feedback sessions, change management, delegation",
            masterInstructions: `Generate communications for ${contactData.companyName} teams that reflect ${contactData.fullName}'s ${profileData.communicationStyle.join(' and ')} approach. Adapt tone for ${profileData.stakeholders.join(', ')}. Focus on ${profileData.transformationGoal}. Include clear CTAs and success criteria.`,
            examplePrompts: [
              `Draft a team message about ${profileData.delegateTasks[0]} that builds buy-in`,
              `Create feedback templates for ${profileData.stakeholders[0]} conversations`,
              `Write a change announcement addressing ${profileData.biggestChallenge}`
            ],
            successMetrics: [
              `Reduce communication drafting time by ${Math.min(profileData.timeWaste, 60)}%`,
              "Increase team response rate by 45%"
            ]
          }
        ],
        promptTemplates: [
          {
            name: "Strategic Synthesis",
            category: "Decision-Making",
            prompt: `Analyze [SITUATION] from a ${contactData.roleTitle} perspective. Focus on ${contactData.primaryFocus}. Provide: 1) Core Issue, 2) Strategic Options, 3) Stakeholder Impact, 4) Recommended Action with timeline.`
          },
          {
            name: "Stakeholder Update",
            category: "Communication",
            prompt: `Create an update for [STAKEHOLDER] about [TOPIC]. Use ${profileData.communicationStyle[0]} tone. Structure: Progress Summary, Key Wins, Blockers (if any), Next Steps, Support Needed.`
          },
          {
            name: "Team Delegation",
            category: "Leadership",
            prompt: `Draft delegation instructions for [TASK]. Include: Context, Desired Outcome, Success Criteria, Decision Authority, Check-in Points. Empower the team while maintaining ${contactData.fullName}'s standards.`
          }
        ],
        implementationRoadmap: {
          week1: `Start with Executive Brief Generator and Strategic Synthesis template - these directly address your ${profileData.timeWaste}% time waste on ${profileData.timeWasteExamples}. Test with 2-3 real scenarios.`,
          week2to4: `Add Decision Framework Assistant for ${profileData.delegateTasks[0]} decisions. Introduce Team Communication Optimizer to address ${profileData.biggestChallenge}. Build team muscle memory with consistent templates.`,
          month2plus: `Customize all templates to match specific stakeholder profiles (${profileData.stakeholders.join(', ')}). Add advanced prompts for ${profileData.transformationGoal}. Track time savings and decision quality improvements.`
        }
      };
      
      generatedContent = JSON.stringify(fallbackLibrary);
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

    // Store in database
    const { data: storedProfile, error: dbError } = await supabase
      .from('prompt_library_profiles')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
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

    return new Response(
      JSON.stringify({ 
        profileId: storedProfile.id, 
        generationModel: generationModel,
        durationMs: Date.now() - startTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error generating prompt library:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
