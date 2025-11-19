-- Enable RLS on all leader assessment tables
ALTER TABLE leader_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_tensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_org_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_first_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_prompt_sets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read all assessment data
-- (Assessment data is public for all users who have the assessment ID)
CREATE POLICY "Allow public read access to assessments"
  ON leader_assessments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to dimension scores"
  ON leader_dimension_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to risk signals"
  ON leader_risk_signals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to tensions"
  ON leader_tensions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to org scenarios"
  ON leader_org_scenarios FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to first moves"
  ON leader_first_moves FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to prompt sets"
  ON leader_prompt_sets FOR SELECT
  TO public
  USING (true);