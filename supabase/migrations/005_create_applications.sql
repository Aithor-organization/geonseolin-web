CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers read own applications" ON public.applications FOR SELECT
  USING (worker_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id = auth.uid()
  ));
CREATE POLICY "Workers insert own applications" ON public.applications FOR INSERT
  WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Companies update application status" ON public.applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION increment_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs SET applicant_count = applicant_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION increment_applicant_count();

CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_worker_id ON public.applications(worker_id);
