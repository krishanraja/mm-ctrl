import { supabase } from '@/integrations/supabase/client';
import { deriveLeadershipComparison } from './scaleUpsMapping';

export async function runAssessment(
  contactData: any,
  assessmentData: any,
  deepProfileData: any,
  sessionId: string
) {
  console.log('🚀 Starting assessment pipeline');
  const startTime = Date.now();

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

    // Helper to update generation_status flags
    const updateGenerationFlags = async (updates: Record<string, any>) => {
      try {
        const { data: current } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', assessmentId)
          .single();

        const existingStatus = (current?.generation_status || {}) as any;
        const mergedStatus = {
          ...existingStatus,
          ...updates,
          last_updated: new Date().toISOString()
        };

        const { error } = await supabase
          .from('leader_assessments')
          .update({ generation_status: mergedStatus })
          .eq('id', assessmentId);

        if (error) console.error('⚠️ Failed to update generation flags:', error);
        else console.log('✅ Generation flags updated:', Object.keys(updates));
      } catch (e) {
        console.error('❌ Error in updateGenerationFlags:', e);
      }
    };

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
      await updateGenerationFlags({ 
        error_log: [{ phase: 'ai-generate', error: aiError.message, timestamp: new Date().toISOString() }] 
      });
    }

    const aiContent = aiData?.data || {};
    const generationSource = aiData?.source || 'fallback';
    console.log('✅ AI content generated via:', generationSource);

    // Step 3: Store dimension scores
    try {
      if (aiContent.dimensionScores?.length > 0) {
        const scoreRecords = aiContent.dimensionScores.map((d: any, idx: number) => ({
          assessment_id: assessmentId,
          dimension_key: d.key || d.dimension_key,
          score: d.score,
          label: d.label,
          insight_summary: d.summary || d.insight_summary,
          priority_rank: idx + 1
        }));

        const { error: scoresError } = await supabase
          .from('leader_dimension_scores')
          .insert(scoreRecords);

        if (scoresError) {
          console.error('⚠️ Failed to store dimension scores:', scoresError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'dimension_scores', error: scoresError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ Dimension scores stored:', scoreRecords.length);
          await updateGenerationFlags({ insights_generated: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing dimension scores:', e);
    }

    // Step 4: Store tensions
    try {
      if (aiContent.tensions?.length > 0) {
        const tensionRecords = aiContent.tensions.map((t: any, idx: number) => ({
          assessment_id: assessmentId,
          dimension_key: t.key || t.dimension_key,
          summary_line: t.summary || t.summary_line,
          priority_rank: idx + 1
        }));

        const { error: tensionError } = await supabase
          .from('leader_tensions')
          .insert(tensionRecords);

        if (tensionError) {
          console.error('⚠️ Failed to store tensions:', tensionError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'tensions', error: tensionError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ Tensions stored:', tensionRecords.length);
          await updateGenerationFlags({ tensions_computed: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing tensions:', e);
    }

    // Step 5: Store risk signals
    try {
      if (aiContent.risks?.length > 0) {
        const riskRecords = aiContent.risks.map((r: any, idx: number) => ({
          assessment_id: assessmentId,
          risk_key: r.key || r.risk_key,
          risk_level: r.level || r.risk_level,
          description: r.description,
          priority_rank: idx + 1
        }));

        const { error: riskError } = await supabase
          .from('leader_risk_signals')
          .insert(riskRecords);

        if (riskError) {
          console.error('⚠️ Failed to store risks:', riskError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'risks', error: riskError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ Risk signals stored:', riskRecords.length);
          await updateGenerationFlags({ risks_computed: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing risks:', e);
    }

    // Step 6: Store org scenarios
    try {
      if (aiContent.scenarios?.length > 0) {
        const scenarioRecords = aiContent.scenarios.map((s: any, idx: number) => ({
          assessment_id: assessmentId,
          scenario_key: s.key || s.scenario_key,
          summary: s.summary,
          priority_rank: idx + 1
        }));

        const { error: scenarioError } = await supabase
          .from('leader_org_scenarios')
          .insert(scenarioRecords);

        if (scenarioError) {
          console.error('⚠️ Failed to store scenarios:', scenarioError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'scenarios', error: scenarioError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ Org scenarios stored:', scenarioRecords.length);
          await updateGenerationFlags({ scenarios_generated: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing scenarios:', e);
    }

    // Step 7: Store prompt sets
    try {
      if (aiContent.prompts?.length > 0) {
        const promptRecords = aiContent.prompts.map((p: any, idx: number) => ({
          assessment_id: assessmentId,
          category_key: p.category || p.category_key,
          title: p.title,
          description: p.description || '',
          what_its_for: p.whatItsFor || p.what_its_for || '',
          when_to_use: p.whenToUse || p.when_to_use || '',
          how_to_use: p.howToUse || p.how_to_use || '',
          prompts_json: p.prompts || [],
          priority_rank: idx + 1
        }));

        const { error: promptError } = await supabase
          .from('leader_prompt_sets')
          .insert(promptRecords);

        if (promptError) {
          console.error('⚠️ Failed to store prompts:', promptError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'prompts', error: promptError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ Prompt sets stored:', promptRecords.length);
          await updateGenerationFlags({ prompts_generated: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing prompts:', e);
    }

    // Step 8: Store first moves
    try {
      if (aiContent.firstMoves?.length > 0) {
        const moveRecords = aiContent.firstMoves.map((move: string, idx: number) => ({
          assessment_id: assessmentId,
          move_text: move,
          priority_rank: idx + 1
        }));

        const { error: movesError } = await supabase
          .from('leader_first_moves')
          .insert(moveRecords);

        if (movesError) {
          console.error('⚠️ Failed to store first moves:', movesError);
          await updateGenerationFlags({ 
            error_log: [{ phase: 'first_moves', error: movesError.message, timestamp: new Date().toISOString() }] 
          });
        } else {
          console.log('✅ First moves stored:', moveRecords.length);
          await updateGenerationFlags({ first_moves_generated: true });
        }
      }
    } catch (e) {
      console.error('❌ Error storing first moves:', e);
    }

    // Step 9: Store executive insights in generation_status
    try {
      await updateGenerationFlags({
        your_edge: aiContent.yourEdge,
        your_risk: aiContent.yourRisk,
        your_next_move: aiContent.yourNextMove,
        generation_source: generationSource,
        generation_duration_ms: Date.now() - startTime
      });
      console.log('✅ Executive insights stored in generation_status');
    } catch (e) {
      console.error('❌ Error storing executive insights:', e);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Assessment pipeline complete in ${duration}ms`);

    return {
      success: true,
      assessmentId,
      source: generationSource,
      durationMs: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Assessment pipeline failed:', error);
    
    // Log critical failure
    try {
      const { data: current } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', sessionId)
        .single();

      const existingStatus = (current?.generation_status || {}) as any;
      await supabase
        .from('leader_assessments')
        .update({ 
          generation_status: {
            ...existingStatus,
            error_log: [
              ...(existingStatus.error_log || []),
              { 
                phase: 'pipeline', 
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString() 
              }
            ]
          }
        })
        .eq('id', sessionId);
    } catch (logError) {
      console.error('❌ Failed to log pipeline error:', logError);
    }
    
    return {
      success: false,
      assessmentId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime
    };
  }
}
