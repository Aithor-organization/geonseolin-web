CREATE TABLE public.auto_apply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reasons JSONB DEFAULT '[]',
  generated_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'skipped', 'failed')),
  skip_reason TEXT,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

ALTER TABLE public.auto_apply_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회" ON public.auto_apply_logs
  FOR SELECT USING (worker_id = auth.uid());

CREATE INDEX idx_auto_apply_logs_worker ON public.auto_apply_logs(worker_id, executed_at DESC);
