-- Create job_vacancies table
CREATE TABLE IF NOT EXISTS job_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  min_salary INTEGER,
  max_salary INTEGER,
  salary_range TEXT,
  description TEXT,
  qualifications TEXT,
  requirements TEXT,
  benefits TEXT,
  closes_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_vacancies_status ON job_vacancies(status);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_department ON job_vacancies(department);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_location ON job_vacancies(location);

-- Enable RLS
ALTER TABLE job_vacancies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active jobs" ON job_vacancies
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can view all jobs" ON job_vacancies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert jobs" ON job_vacancies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update jobs" ON job_vacancies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete jobs" ON job_vacancies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_vacancies_updated_at ON job_vacancies;
CREATE TRIGGER update_job_vacancies_updated_at
  BEFORE UPDATE ON job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (only if table is empty)
INSERT INTO job_vacancies (title, department, location, employment_type, min_salary, max_salary, description, status)
SELECT * FROM (VALUES
  ('Senior Frontend Developer', 'Engineering', 'Jakarta', 'Full-time', 15000000, 25000000, 'Kami mencari Senior Frontend Developer berpengalaman untuk membangun antarmuka web yang modern dan responsif.', 'active'),
  ('UI/UX Designer', 'Design', 'Bandung', 'Full-time', 10000000, 18000000, 'Bertanggung jawab atas desain antarmuka pengguna dan pengalaman pengguna aplikasi web dan mobile.', 'active'),
  ('Marketing Specialist', 'Marketing', 'Jakarta', 'Full-time', 8000000, 15000000, 'Mengembangkan dan mengeksekusi strategi marketing untuk meningkatkan brand awareness dan akuisisi user.', 'active'),
  ('Data Analyst', 'Data', 'Surabaya', 'Full-time', 12000000, 20000000, 'Menganalisis data untuk memberikan insight yang dapat membantu pengambilan keputusan bisnis.', 'draft'),
  ('HR Manager', 'Human Resources', 'Jakarta', 'Full-time', 18000000, 30000000, 'Memimpin tim HR dan mengelola seluruh proses rekrutmen, training, dan employee relations.', 'active')
) AS t(title, department, location, employment_type, min_salary, max_salary, description, status)
WHERE NOT EXISTS (SELECT 1 FROM job_vacancies LIMIT 1);
