import { supabase } from '@/integrations/supabase/client';
import { deriveLeadershipComparison } from './scaleUpsMapping';

export async function runAssessment(
  contactData: any,
  assessmentData: any,
  deepProfileData: any,
  sessionId: string
) {
  console.log('🚀 Starting assessment pipeline');

  try {
    // Step 1: Create leader assessment record
    const { data: createData, error: createError } = await supabase.functions.invoke(
      'create-leader-assessment',
      {
        body: {
          contactData,
          assessmentData,
          deepProfileData,
          sessionId
        }
      }
    );

    if (createError) throw createError;
    if (!createData?.assessmentId) throw new Error('No assessment ID returned');

    const assessmentId = createData.assessmentId;
    console.log('✅ Assessment created:', assessmentId);

    // Step 2: Generate AI content (Gemini Plan A, OpenAI Plan B)
    const { data: aiData, error: aiError } = await supabase.functions.invoke(
      'ai-generate',
      {
        body: {
          assessmentData,
          contactData
        }
      }
    );

    if (aiError) {
      console.error('⚠️ AI generation error:', aiError);
    }

    const aiContent = aiData?.data || {};
    console.log('✅ AI content generated via:', aiData?.source || 'fallback');

    // Step 3: Store tensions
    if (aiContent.tensions?.length > 0) {
      const tensionRecords = aiContent.tensions.map((t: any) => ({
        assessment_id: assessmentId,
        dimension_key: t.key,
        summary_line: t.summary
      }));

      const { error: tensionError } = await supabase
        .from('leader_tensions')
        .insert(tensionRecords);

      if (tensionError) {
        console.error('⚠️ Failed to store tensions:', tensionError);
      } else {
        console.log('✅ Tensions stored:', tensionRecords.length);
      }
    }

    // Step 4: Store risk signals
    if (aiContent.risks?.length > 0) {
      const riskRecords = aiContent.risks.map((r: any) => ({
        assessment_id: assessmentId,
        risk_key: r.key,
        risk_level: r.level,
        description: r.description
      }));

      const { error: riskError } = await supabase
        .from('leader_risk_signals')
        .insert(riskRecords);

      if (riskError) {
        console.error('⚠️ Failed to store risks:', riskError);
      } else {
        console.log('✅ Risk signals stored:', riskRecords.length);
      }
    }

    // Step 5: Store org scenarios
    if (aiContent.scenarios?.length > 0) {
      const scenarioRecords = aiContent.scenarios.map((s: any) => ({
        assessment_id: assessmentId,
        scenario_key: s.key,
        summary: s.summary
      }));

      const { error: scenarioError } = await supabase
        .from('leader_org_scenarios')
        .insert(scenarioRecords);

      if (scenarioError) {
        console.error('⚠️ Failed to store scenarios:', scenarioError);
      } else {
        console.log('✅ Org scenarios stored:', scenarioRecords.length);
      }
    }

    // Step 6: Store insights as metadata in leader_assessments
    if (aiContent.yourEdge || aiContent.yourRisk || aiContent.yourNextMove || aiContent.prompts) {
      const metadata: any = {};
      
      if (aiContent.yourEdge) metadata.your_edge = aiContent.yourEdge;
      if (aiContent.yourRisk) metadata.your_risk = aiContent.yourRisk;
      if (aiContent.yourNextMove) metadata.your_next_move = aiContent.yourNextMove;
      if (aiContent.prompts) metadata.prompt_library = aiContent.prompts;

      const { error: updateError } = await supabase
        .from('leader_assessments')
        .update({ generation_status: metadata })
        .eq('id', assessmentId);

      if (updateError) {
        console.error('⚠️ Failed to store insights metadata:', updateError);
      } else {
        console.log('✅ Insights and prompts stored in metadata');
      }
    }

    console.log('✅ Assessment pipeline complete');

    return {
      success: true,
      assessmentId,
      source: aiData?.source || 'fallback'
    };

  } catch (error) {
    console.error('❌ Assessment pipeline failed:', error);
    return {
      success: false,
      assessmentId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
