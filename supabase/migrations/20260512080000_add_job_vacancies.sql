-- Create job_vacancies table
CREATE TABLE IF NOT EXISTS job_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  salary_range TEXT,
  description TEXT,
  qualifications TEXT,
  requirements TEXT,
  benefits TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
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

CREATE TRIGGER update_job_vacancies_updated_at
  BEFORE UPDATE ON job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO job_vacancies (title, department, location, employment_type, salary_range, description, qualifications, status) VALUES
  ('Senior Frontend Developer', 'Engineering', 'Jakarta', 'Full-time', 'Rp 15-25 juta', 'Kami mencari Senior Frontend Developer berpengalaman untuk membangun antarmuka web yang modern dan responsif.', 'Minimal 3 tahun pengalaman dengan React/Next.js\nPaham TypeScript\nPengalaman dengan state management (Redux, Zustand)', 'active'),
  ('UI/UX Designer', 'Design', 'Bandung', 'Full-time', 'Rp 10-18 juta', 'Bertanggung jawab atas desain antarmuka pengguna dan pengalaman pengguna aplikasi web dan mobile.', 'Minimal 2 tahun pengalaman sebagai UI/UX Designer\nPaham Figma, Adobe XD\nPortofolio yang kuat', 'active'),
  ('Marketing Specialist', 'Marketing', 'Jakarta', 'Full-time', 'Rp 8-15 juta', 'Mengembangkan dan mengeksekusi strategi marketing untuk meningkatkan brand awareness dan akuisisi user.', 'Pengalaman minimal 2 tahun di digital marketing\nPaham SEO, SEM, social media marketing\nKemampuan analisis data', 'active'),
  ('Data Analyst', 'Data', 'Surabaya', 'Full-time', 'Rp 12-20 juta', 'Menganalisis data untuk memberikan insight yang dapat membantu pengambilan keputusan bisnis.', 'Paham SQL, Python, atau R\nPengalaman dengan data visualization tools (Tableau, Power BI)\nKemampuan komunikasi yang baik', 'draft'),
  ('HR Manager', 'Human Resources', 'Jakarta', 'Full-time', 'Rp 18-30 juta', 'Memimpin tim HR dan mengelola seluruh proses rekrutmen, training, dan employee relations.', 'Minimal 5 tahun pengalaman di HR\nPaham HRIS dan employment law\nKemampuan leadership yang kuat', 'active');
