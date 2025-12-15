-- Create RPC function for atomic assessment data insertion
-- This ensures all assessment data is inserted atomically (transaction safety)

CREATE OR REPLACE FUNCTION insert_assessment_data_atomic(
  p_assessment_id UUID,
  p_dimension_scores JSONB DEFAULT '[]'::JSONB,
  p_tensions JSONB DEFAULT '[]'::JSONB,
  p_risk_signals JSONB DEFAULT '[]'::JSONB,
  p_org_scenarios JSONB DEFAULT '[]'::JSONB,
  p_prompt_sets JSONB DEFAULT '[]'::JSONB,
  p_first_moves JSONB DEFAULT '[]'::JSONB,
  p_assessment_events JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{"success": true, "inserted": {}, "errors": []}'::JSONB;
  v_error TEXT;
  v_count INTEGER;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Insert dimension scores
  IF jsonb_array_length(p_dimension_scores) > 0 THEN
    BEGIN
      INSERT INTO leader_dimension_scores (
        assessment_id,
        dimension_key,
        score_numeric,
        dimension_tier,
        explanation
      )
      SELECT
        p_assessment_id,
        (item->>'dimension_key')::TEXT,
        (item->>'score_numeric')::NUMERIC,
        (item->>'dimension_tier')::TEXT,
        (item->>'explanation')::TEXT
      FROM jsonb_array_elements(p_dimension_scores) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,dimension_scores}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'dimension_scores: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert tensions
  IF jsonb_array_length(p_tensions) > 0 THEN
    BEGIN
      INSERT INTO leader_tensions (
        assessment_id,
        dimension_key,
        summary_line,
        priority_rank
      )
      SELECT
        p_assessment_id,
        (item->>'dimension_key')::TEXT,
        (item->>'summary_line')::TEXT,
        (item->>'priority_rank')::INTEGER
      FROM jsonb_array_elements(p_tensions) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,tensions}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'tensions: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert risk signals
  IF jsonb_array_length(p_risk_signals) > 0 THEN
    BEGIN
      INSERT INTO leader_risk_signals (
        assessment_id,
        risk_key,
        level,
        description,
        priority_rank
      )
      SELECT
        p_assessment_id,
        (item->>'risk_key')::TEXT,
        (item->>'level')::TEXT,
        (item->>'description')::TEXT,
        (item->>'priority_rank')::INTEGER
      FROM jsonb_array_elements(p_risk_signals) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,risk_signals}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'risk_signals: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert org scenarios
  IF jsonb_array_length(p_org_scenarios) > 0 THEN
    BEGIN
      INSERT INTO leader_org_scenarios (
        assessment_id,
        scenario_key,
        summary,
        priority_rank
      )
      SELECT
        p_assessment_id,
        (item->>'scenario_key')::TEXT,
        (item->>'summary')::TEXT,
        (item->>'priority_rank')::INTEGER
      FROM jsonb_array_elements(p_org_scenarios) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,org_scenarios}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'org_scenarios: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert prompt sets
  IF jsonb_array_length(p_prompt_sets) > 0 THEN
    BEGIN
      INSERT INTO leader_prompt_sets (
        assessment_id,
        category_key,
        title,
        description,
        what_its_for,
        when_to_use,
        how_to_use,
        prompts_json,
        priority_rank
      )
      SELECT
        p_assessment_id,
        (item->>'category_key')::TEXT,
        (item->>'title')::TEXT,
        (item->>'description')::TEXT,
        (item->>'what_its_for')::TEXT,
        (item->>'when_to_use')::TEXT,
        (item->>'how_to_use')::TEXT,
        (item->>'prompts_json')::JSONB,
        (item->>'priority_rank')::INTEGER
      FROM jsonb_array_elements(p_prompt_sets) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,prompt_sets}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'prompt_sets: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert first moves
  IF jsonb_array_length(p_first_moves) > 0 THEN
    BEGIN
      INSERT INTO leader_first_moves (
        assessment_id,
        move_number,
        content
      )
      SELECT
        p_assessment_id,
        (item->>'move_number')::INTEGER,
        (item->>'content')::TEXT
      FROM jsonb_array_elements(p_first_moves) AS item;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,first_moves}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'first_moves: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- Insert assessment events (with idempotency)
  IF jsonb_array_length(p_assessment_events) > 0 THEN
    BEGIN
      INSERT INTO assessment_events (
        assessment_id,
        session_id,
        question_id,
        question_text,
        raw_input,
        structured_values,
        event_type,
        tool_name,
        flow_name
      )
      SELECT
        p_assessment_id,
        (item->>'session_id')::TEXT,
        (item->>'question_id')::TEXT,
        (item->>'question_text')::TEXT,
        (item->>'raw_input')::TEXT,
        (item->>'structured_values')::JSONB,
        (item->>'event_type')::TEXT,
        (item->>'tool_name')::TEXT,
        (item->>'flow_name')::TEXT
      FROM jsonb_array_elements(p_assessment_events) AS item
      ON CONFLICT (assessment_id, question_id, session_id) DO NOTHING;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_result := jsonb_set(v_result, '{inserted,assessment_events}', to_jsonb(v_count));
    EXCEPTION WHEN OTHERS THEN
      v_error := 'assessment_events: ' || SQLERRM;
      v_result := jsonb_set(
        v_result,
        '{errors}',
        (v_result->'errors') || jsonb_build_array(v_error)
      );
      v_result := jsonb_set(v_result, '{success}', 'false'::jsonb);
    END;
  END IF;

  -- If any errors occurred, rollback (implicit in function - all or nothing)
  IF (v_result->>'success')::BOOLEAN = false THEN
    RAISE EXCEPTION 'Atomic insert failed: %', v_result->'errors';
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION insert_assessment_data_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION insert_assessment_data_atomic TO service_role;

COMMENT ON FUNCTION insert_assessment_data_atomic IS 
  'Atomically inserts all assessment data in a single transaction. Returns success status and counts of inserted records.';

