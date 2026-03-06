CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  applicant_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active jobs" ON public.jobs FOR SELECT USING (status = 'active' OR company_id = auth.uid());
CREATE POLICY "Companies insert own jobs" ON public.jobs FOR INSERT WITH CHECK (company_id = auth.uid());
CREATE POLICY "Companies update own jobs" ON public.jobs FOR UPDATE USING (company_id = auth.uid());
CREATE POLICY "Companies delete own jobs" ON public.jobs FOR DELETE USING (company_id = auth.uid());

CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_location ON public.jobs(location);
