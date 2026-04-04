-- Increase pending verifications limit from 15 to 50 so users can review
-- more facts in a single session.

CREATE OR REPLACE FUNCTION get_pending_verifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  fact_key TEXT,
  fact_category public.fact_category,
  fact_label TEXT,
  fact_value TEXT,
  fact_context TEXT,
  confidence_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.fact_context,
    um.confidence_score
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND um.verification_status = 'inferred'
  ORDER BY um.is_high_stakes DESC, um.confidence_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
