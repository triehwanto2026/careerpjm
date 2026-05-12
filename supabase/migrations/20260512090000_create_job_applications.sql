-- Create job applications table
-- This migration creates the job applications table to track candidate applications

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cover_letter TEXT,
  admin_notes TEXT,
  activation_code_id UUID REFERENCES activation_codes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for job_applications
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Candidates can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Candidates can insert own applications" ON job_applications;
DROP POLICY IF EXISTS "Candidates can update own applications" ON job_applications;
DROP POLICY IF EXISTS "Admin users can manage applications" ON job_applications;

-- Candidates can only view their own applications
CREATE POLICY "Candidates can view own applications" ON job_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Candidates can insert their own applications
CREATE POLICY "Candidates can insert own applications" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own applications (limited fields)
CREATE POLICY "Candidates can update own applications" ON job_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin users can do everything
CREATE POLICY "Admin users can manage applications" ON job_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy_id ON job_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

-- Create trigger for updated_at timestamps
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for status_updated_at
CREATE OR REPLACE FUNCTION update_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_status_updated_at_trigger ON job_applications;
CREATE TRIGGER update_status_updated_at_trigger
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_status_updated_at();

-- Grant permissions
GRANT ALL ON job_applications TO authenticated;

-- Create function to get application status flow
CREATE OR REPLACE FUNCTION get_application_status_flow()
RETURNS TABLE(status_value TEXT, status_label TEXT, status_order INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 'applied'::TEXT AS status_value, 'Lamaran Diterima'::TEXT AS status_label, 1 AS status_order
  UNION ALL
  SELECT 'screening'::TEXT AS status_value, 'Screening CV'::TEXT AS status_label, 2 AS status_order
  UNION ALL
  SELECT 'interview'::TEXT AS status_value, 'Wawancara'::TEXT AS status_label, 3 AS status_order
  UNION ALL
  SELECT 'offer'::TEXT AS status_value, 'Penawaran'::TEXT AS status_label, 4 AS status_order
  UNION ALL
  SELECT 'hired'::TEXT AS status_value, 'Diterima'::TEXT AS status_label, 5 AS status_order
  UNION ALL
  SELECT 'rejected'::TEXT AS status_value, 'Ditolak'::TEXT AS status_label, 6 AS status_order
  ORDER BY status_order;
END;
$$ LANGUAGE plpgsql;
