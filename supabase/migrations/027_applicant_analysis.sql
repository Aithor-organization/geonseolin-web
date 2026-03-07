CREATE TABLE public.applicant_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_grade TEXT NOT NULL CHECK (match_grade IN ('A', 'B', 'C', 'D')),
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  concerns JSONB NOT NULL DEFAULT '[]',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  model_version TEXT DEFAULT 'v1',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id)
);

ALTER TABLE public.applicant_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공고 소유 기업만 조회" ON public.applicant_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applicant_analysis.job_id
      AND jobs.company_id = auth.uid()
    )
  );

CREATE INDEX idx_analysis_job ON public.applicant_analysis(job_id, match_score DESC);
