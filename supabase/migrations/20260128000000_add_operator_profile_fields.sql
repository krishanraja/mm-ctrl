-- Add missing fields to operator_profiles table
-- tools_tried: Array of AI tools user has tried
-- failed_lead_magnets: Array of failed workflows/templates

ALTER TABLE operator_profiles 
ADD COLUMN IF NOT EXISTS tools_tried TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS failed_lead_magnets TEXT[] DEFAULT '{}';

-- Update existing rows to have empty arrays if they're null
UPDATE operator_profiles 
SET tools_tried = '{}' WHERE tools_tried IS NULL;

UPDATE operator_profiles 
SET failed_lead_magnets = '{}' WHERE failed_lead_magnets IS NULL;
