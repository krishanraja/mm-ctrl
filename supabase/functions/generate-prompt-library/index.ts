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
    const { 
      sessionId, 
      userId, 
      contactData, 
      assessmentData, 
      profileData 
    } = await req.json();

    console.log('Generating prompt library for session:', sessionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare AI synthesis prompt
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
      "examplePrompts": [
        "Starter prompt 1",
        "Starter prompt 2",
        "Starter prompt 3"
      ],
      "successMetrics": [
        "Metric 1",
        "Metric 2"
      ]
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

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Calling OpenAI for synthesis...');
    
    // Add 60-second timeout to prevent silent hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let aiResponse;
    try {
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('❌ OpenAI API call timed out after 60 seconds');
        throw new Error('AI generation timed out. Please try again.');
      }
      throw error;
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // DIAGNOSTIC LOGGING: Inspect full API response structure
    console.log('OpenAI API Response Structure:', {
      model: aiData.model,
      choices_count: aiData.choices?.length,
      has_choices: !!aiData.choices,
      first_choice_exists: !!aiData.choices?.[0],
      has_message: !!aiData.choices?.[0]?.message,
      has_content: !!aiData.choices?.[0]?.message?.content,
      content_length: aiData.choices?.[0]?.message?.content?.length,
      finish_reason: aiData.choices?.[0]?.finish_reason,
      usage: aiData.usage
    });
    
    const generatedContent = aiData.choices[0]?.message?.content;
    
    if (!generatedContent) {
      console.error('Full AI Response (no content):', JSON.stringify(aiData, null, 2));
    } else {
      console.log('Generated content length:', generatedContent.length);
    }

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    console.log('AI generation successful, parsing response...');

    // Parse JSON response
    let parsedLibrary;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedLibrary = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Store in database
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
        workflow_preferences: {
          workBreakdown: profileData.workBreakdown,
          informationNeeds: profileData.informationNeeds,
          transformationGoal: profileData.transformationGoal
        },
        trust_calibration: {},
        recommended_projects: parsedLibrary.recommendedProjects || [],
        prompt_templates: parsedLibrary.promptTemplates || [],
        implementation_roadmap: parsedLibrary.implementationRoadmap || {},
        generation_model: 'gpt-5-mini-2025-08-07'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Prompt library generated and stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        profileId: profileRecord.id,
        library: parsedLibrary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-prompt-library:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});