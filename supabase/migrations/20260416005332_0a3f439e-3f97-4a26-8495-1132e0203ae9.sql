-- Add assigned_tests column to activation_codes
ALTER TABLE public.activation_codes 
ADD COLUMN assigned_tests uuid[] DEFAULT '{}';

-- Also allow anon to update activation_codes (for marking as used during login)
CREATE POLICY "Allow anon to update activation_codes"
ON public.activation_codes
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anon to read candidates
CREATE POLICY "Allow anon to read candidates"
ON public.candidates
FOR SELECT
TO anon
USING (true);

-- Allow anon to read test_results
CREATE POLICY "Allow anon to read test_results"
ON public.test_results
FOR SELECT
TO anon
USING (true);

-- Allow anon to read test_answers
CREATE POLICY "Allow anon to read test_answers"
ON public.test_answers
FOR SELECT
TO anon
USING (true);