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
    const startTime = Date.now();
    const { assessmentId, sessionId, userId, contactData, assessmentData, profileData } = await req.json();
    console.log('Generating prompt library for assessment:', assessmentId);

    // Validate required parameters
    if (!assessmentId) {
      console.error('❌ assessmentId is required');
      throw new Error('assessmentId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const geminiApiKey = Deno.env.get('GEMINI_SERVICE_ACCOUNT_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!geminiApiKey && !openaiApiKey && !lovableApiKey) {
      console.error('❌ No API keys configured');
      throw new Error('At least one API key required (GEMINI_SERVICE_ACCOUNT_KEY, OPENAI, or LOVABLE)');
    }

    // Build prompt with safe null handling for profileData
    let profileSection = '';
    if (profileData && Object.keys(profileData).length > 0) {
      profileSection = `

DEEP PROFILE:
- Thinking Process: ${profileData.thinkingProcess || 'structured'}
- Communication Style: ${profileData.communicationStyle?.join(', ') || 'direct, data-driven'}
- Work Breakdown: ${profileData.workBreakdown ? Object.entries(profileData.workBreakdown).map(([k, v]) => `${k}: ${v}%`).join(', ') : 'strategic planning, team management, operations'}
- Information Needs: ${profileData.informationNeeds?.join(', ') || 'data insights, team updates, strategic guidance'}
- Transformation Goal: ${profileData.transformationGoal || contactData.primaryFocus || 'AI adoption'}
- Time on Non-Critical Work: ${profileData.timeWaste || 30}%
- Specific Time Wasters: ${profileData.timeWasteExamples || 'repetitive tasks, status meetings'}
- Top Delegation Priorities: ${profileData.delegateTasks?.join(', ') || 'routine analysis, reporting, scheduling'}
- Biggest Communication Challenge: ${profileData.biggestChallenge || 'keeping stakeholders aligned'}
- Key Stakeholders: ${profileData.stakeholders?.join(', ') || 'executive team, board members, key clients'}`;
    } else {
      profileSection = `

CONTEXT:
- Primary Focus: ${contactData.primaryFocus || 'General AI adoption'}
- Department: ${contactData.department || 'Leadership'}
- Timeline: ${contactData.timeline || 'Near-term'}`;
    }

    const synthesisPro = `CRITICAL: Generate RADICALLY PERSONALIZED AI command center for this executive.
NO GENERIC PROMPTS ALLOWED - Each must be impossible to generate without their specific data.

IMPORTANT: Use ONLY gender-neutral language throughout (they/their/them).

EXECUTIVE PROFILE:
- Name: ${contactData.fullName || 'the leader'}
- Role: ${contactData.roleTitle || contactData.department || 'Leader'}
- Company: ${contactData.companyName || 'their organization'} (${contactData.companySize || 'mid-size'})
- Primary Focus: ${contactData.primaryFocus || 'AI adoption'}
- Timeline: ${contactData.timeline || 'near-term'}

ASSESSMENT SCORES:
${Object.entries(assessmentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}${profileSection}

ANTI-PATTERNS TO AVOID (These are REJECTED as too generic):
❌ "Analyze this research and information synthesis decision..."
❌ "Evaluate trade-offs between these three strategic options..."  
❌ "Create a stakeholder impact assessment for..."
❌ Any prompt that could work for ANY executive in ANY industry
❌ Generic frameworks without specific names, metrics, or context

QUALITY EXAMPLES (This is what "good" looks like):
✅ "As ${contactData.roleTitle || 'leader'} at ${contactData.companyName || 'the organization'}, draft a 3-minute update for [specific stakeholder from profile] that addresses [specific challenge from profile] using data from recent initiatives, focusing on how AI automation has impacted [specific metric or area]."
✅ "You're presenting to [specific stakeholder from profile] about [specific initiative]. They care about [their priority]. Generate 3 talking points that connect AI ROI to their KPIs, using examples from ${contactData.companySize || 'similar-sized'} companies."
✅ "I spend hours weekly on [specific time-waster from profile]. Design an AI workflow that reduces this by 70% by automating [specific subtask], then draft the delegation instructions for [specific role]."

VALIDATION CHECKLIST (AI must verify before returning):
- [ ] Every conversation mentions actual stakeholders from their profile (or inferred from role/industry)
- [ ] Every delegation addresses actual time-wasters from their profile
- [ ] Every prompt includes role-specific and industry-specific terminology
- [ ] Every playbook step references their specific challenges and timeline
- [ ] Zero generic placeholders or "[insert X]" text
- [ ] A different executive in a different industry could NOT use these exact prompts

YOUR TASK:
Generate a comprehensive Executive AI Command Center in JSON format with radical specificity:

{
  "personalizedInsights": {
    "yourEdge": "Based on [specific strength from their profile], they should focus on [specific opportunity]. Be specific about what gives them competitive advantage. 120-180 characters.",
    "yourRisk": "Their [specific weakness from profile] could cause [specific failure mode]. Be direct and actionable. 120-180 characters.",
    "yourNextMove": "In the next 7 days, prioritize [specific action] because [specific reason tied to their context]. 120-180 characters."
  },
  "immediateActions": {
    "next3Conversations": [
      {
        "stakeholder": "Name/role from their stakeholders list",
        "topic": "Specific conversation topic tied to their challenges",
        "talkingPoints": ["Point 1 with context", "Point 2 with expected outcome", "Point 3 with follow-up"],
        "successLooksLike": "Concrete outcome they can measure"
      }
    ],
    "delegationOpportunities": [
      {
        "task": "Specific task from their time-wasters or delegation priorities",
        "delegateTo": "Suggested role/person type",
        "promptToGiveThem": "Exact words to say when delegating - make it copy-paste ready",
        "successCriteria": ["Criterion 1", "Criterion 2"]
      }
    ],
    "quickDecisions": [
      {
        "decision": "Specific decision they need to make",
        "whyNow": "Why this can't wait",
        "options": [
          {
            "name": "Option name",
            "pros": ["Pro 1", "Pro 2"],
            "cons": ["Con 1", "Con 2"]
          }
        ],
        "recommendation": "AI-suggested best path with reasoning"
      }
    ]
  },
  "masterPromptLibrary": {
    "strategicPrompts": [
      {
        "name": "Prompt set name",
        "purpose": "Specific value",
        "whenToUse": "Scenarios",
        "masterInstructions": "300-400 word tailored prompt",
        "examplePrompts": ["Prompt 1", "Prompt 2", "Prompt 3"],
        "successMetrics": ["Metric 1", "Metric 2"]
      }
    ],
    "operationalPrompts": [
      {
        "name": "Role-specific operational prompt",
        "purpose": "Daily/weekly value",
        "whenToUse": "Operational scenarios",
        "masterInstructions": "Tailored operational prompt",
        "examplePrompts": ["Prompt 1", "Prompt 2"],
        "successMetrics": ["Metric 1"]
      }
    ]
  },
  "executivePlaybooks": [
    {
      "title": "30-Day AI Adoption Sprint",
      "whenToUse": "Starting AI transformation in their specific context",
      "steps": [
        {
          "week": "Week 1",
          "focus": "Focus area",
          "actions": ["Action 1", "Action 2", "Action 3"]
        }
      ],
      "successMetrics": ["Metric 1", "Metric 2", "Metric 3"],
      "riskMitigation": ["Risk 1 mitigation", "Risk 2 mitigation"]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Conversations: 3 specific conversations with actual people/roles from THEIR context (use stakeholders from profile if available, otherwise infer from their role/industry)
- Delegations: 3 tasks from THEIR time-wasters/delegation priorities with exact delegation scripts (copy-paste ready)
- Decisions: 2 urgent decisions tied to THEIR specific challenges with pros/cons that reference THEIR constraints
- Strategic Prompts: 3-4 prompt sets for planning, board prep, stakeholder management - each must use their actual company size, industry, and specific initiatives
- Operational Prompts: 2-3 prompt sets for daily/weekly tasks - each must automate a specific time-waster they mentioned
- Playbooks: 1-2 playbooks with week-by-week steps that reference THEIR timeline, THEIR team structure, and THEIR transformation goals
- Every prompt must include: specific stakeholder names/roles, specific metrics/KPIs, specific tools/processes from their context
- Tone: Match THEIR communication style (${profileData?.communicationStyle?.join(', ') || contactData.primaryFocus || 'direct, action-oriented'})
- NO PLACEHOLDERS: Replace every [thing] with actual specifics from their data

Return ONLY valid JSON, no markdown formatting.`;

    let generatedContent;
    let generationModel = '';

    // ============= PLAN A: GEMINI 2.5 FLASH (5s timeout) =============
    if (geminiApiKey) {
      console.log('🔄 Plan A: Calling Gemini 2.5 Flash...');
      const geminiController = new AbortController();
      const geminiTimeoutId = setTimeout(() => geminiController.abort(), 5000);

      try {
        const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
          method: 'POST',
          signal: geminiController.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: synthesisPro
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
              responseMimeType: "application/json"
            }
          })
        });
        clearTimeout(geminiTimeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            generatedContent = JSON.parse(content);
            generationModel = 'gemini-2.5-flash';
            console.log('✅ Gemini succeeded in', Date.now() - startTime, 'ms');
          }
        }
      } catch (error: any) {
        clearTimeout(geminiTimeoutId);
        console.error('❌ Gemini failed:', error.message);
      }
    }

    // ============= PLAN B: OPENAI GPT-4.1 FALLBACK (5s timeout) =============
    if (!generatedContent && openaiApiKey) {
      console.log('⚠️ Gemini failed, trying OpenAI GPT-4.1...');
      const openaiController = new AbortController();
      const openaiTimeoutId = setTimeout(() => openaiController.abort(), 5000);

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
              { role: 'system', content: 'You are an expert AI strategist generating personalized prompt libraries. Return valid JSON only.' },
              { role: 'user', content: synthesisPro }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(openaiTimeoutId);

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          generatedContent = openaiData.choices[0].message.content;
          generationModel = 'openai-gpt4.1';
          console.log('✅ OpenAI succeeded in', Date.now() - startTime, 'ms');
          console.log('📊 Generation metrics:', {
            source: 'openai-gpt4.1',
            durationMs: Date.now() - startTime,
            success: true
          });
        }
    } catch (error: any) {
      clearTimeout(openaiTimeoutId);
      console.error('❌ OpenAI failed:', error.message);
    }
  }

    // ============= PLAN C: LOVABLE AI GEMINI FALLBACK (6s timeout) =============
    if (!generatedContent && lovableApiKey) {
      console.log('⚠️ Gemini and OpenAI failed, trying Lovable AI as last resort...');
      const lovableController = new AbortController();
      const lovableTimeoutId = setTimeout(() => lovableController.abort(), 6000);

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
              { role: 'system', content: 'You are an expert AI strategist generating personalized prompt libraries. Return valid JSON only.' },
              { role: 'user', content: synthesisPro }
            ],
            response_format: { type: "json_object" }
          })
        });
        clearTimeout(lovableTimeoutId);

        if (lovableResponse.ok) {
          const lovableData = await lovableResponse.json();
          generatedContent = lovableData.choices[0].message.content;
          generationModel = 'lovable-gemini';
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
            prompt: `Analyze [SITUATION] from a ${contactData?.roleTitle || 'Executive'} perspective focusing on ${contactData.primaryFocus}. Consider ${contactData.fullName}'s transformation goal: "${profileData.transformationGoal}". Provide: 1) Core Issue, 2) Strategic Options aligned with ${contactData.timeline} timeline, 3) Stakeholder Impact (${profileData.stakeholders.join(', ')}), 4) Recommended Action addressing ${profileData.biggestChallenge}.`
          },
          {
            name: "Stakeholder Update",
            category: "Communication",
            prompt: `Create an update for [STAKEHOLDER] about [TOPIC]. Use ${profileData.communicationStyle[0]} tone matching ${contactData.fullName}'s style. Consider stakeholder: ${profileData.stakeholders[0]}. Structure: Progress Summary tied to ${profileData.transformationGoal}, Key Wins, Blockers (if any), Next Steps aligned with ${contactData.timeline}, Support Needed.`
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

    // Transform recommendedProjects into promptSets format for leader_prompt_sets table
    const promptSets = parsedLibrary.recommendedProjects.map((project: any, index: number) => ({
      category_key: project.name.toLowerCase().replace(/\s+/g, '_'),
      title: project.name,
      description: project.purpose,
      what_its_for: project.purpose,
      when_to_use: project.whenToUse,
      how_to_use: project.masterInstructions,
      prompts_json: project.examplePrompts || [],
      priority_rank: index + 1,
      assessment_id: assessmentId
    }));

    // Store prompts directly in leader_prompt_sets table
    console.log(`Storing ${promptSets.length} prompt sets to leader_prompt_sets for assessment ${assessmentId}`);
    const { error: promptSetsError } = await supabase
      .from('leader_prompt_sets')
      .insert(promptSets);
    
    if (promptSetsError) {
      console.error('Error storing prompt sets:', promptSetsError);
      throw promptSetsError;
    }
    
    console.log(`✅ Stored ${promptSets.length} prompt sets to leader_prompt_sets`);

    return new Response(
      JSON.stringify({ 
        success: true,
        profileId: storedProfile.id,
        library: parsedLibrary,
        promptSets: promptSets,
        promptSetsStored: promptSets.length,
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
