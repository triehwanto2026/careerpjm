-- Update all DISC test results with M and L values
-- Run this in Supabase SQL Editor

-- Update each DISC result with estimated M and L values
UPDATE test_results 
SET categories = categories || jsonb_build_object(
  'D_M', GREATEST(3, COALESCE((categories->>'D')::int, 0) + 3),
  'D_L', CASE WHEN COALESCE((categories->>'D')::int, 0) < 0 THEN ABS(COALESCE((categories->>'D')::int, 0)) + 3 ELSE 3 END,
  'I_M', GREATEST(3, COALESCE((categories->>'I')::int, 0) + 3),
  'I_L', CASE WHEN COALESCE((categories->>'I')::int, 0) < 0 THEN ABS(COALESCE((categories->>'I')::int, 0)) + 3 ELSE 3 END,
  'S_M', GREATEST(3, COALESCE((categories->>'S')::int, 0) + 3),
  'S_L', CASE WHEN COALESCE((categories->>'S')::int, 0) < 0 THEN ABS(COALESCE((categories->>'S')::int, 0)) + 3 ELSE 3 END,
  'C_M', GREATEST(3, COALESCE((categories->>'C')::int, 0) + 3),
  'C_L', CASE WHEN COALESCE((categories->>'C')::int, 0) < 0 THEN ABS(COALESCE((categories->>'C')::int, 0)) + 3 ELSE 3 END
)
WHERE test_name ILIKE '%DISC%'
AND categories ? 'D';

-- Also update results with full names (Dominance, etc)
UPDATE test_results 
SET categories = categories || jsonb_build_object(
  'Dominance_M', GREATEST(3, COALESCE((categories->>'Dominance')::int, 0) + 3),
  'Dominance_L', CASE WHEN COALESCE((categories->>'Dominance')::int, 0) < 0 THEN ABS(COALESCE((categories->>'Dominance')::int, 0)) + 3 ELSE 3 END,
  'Influence_M', GREATEST(3, COALESCE((categories->>'Influence')::int, 0) + 3),
  'Influence_L', CASE WHEN COALESCE((categories->>'Influence')::int, 0) < 0 THEN ABS(COALESCE((categories->>'Influence')::int, 0)) + 3 ELSE 3 END,
  'Steadiness_M', GREATEST(3, COALESCE((categories->>'Steadiness')::int, 0) + 3),
  'Steadiness_L', CASE WHEN COALESCE((categories->>'Steadiness')::int, 0) < 0 THEN ABS(COALESCE((categories->>'Steadiness')::int, 0)) + 3 ELSE 3 END,
  'Compliance_M', GREATEST(3, COALESCE((categories->>'Compliance')::int, 0) + 3),
  'Compliance_L', CASE WHEN COALESCE((categories->>'Compliance')::int, 0) < 0 THEN ABS(COALESCE((categories->>'Compliance')::int, 0)) + 3 ELSE 3 END
)
WHERE test_name ILIKE '%DISC%'
AND categories ? 'Dominance';

-- Verify the update
SELECT id, test_name, categories FROM test_results WHERE test_name ILIKE '%DISC%';
