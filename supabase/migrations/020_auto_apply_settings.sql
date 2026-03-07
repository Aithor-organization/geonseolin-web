CREATE TABLE public.auto_apply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  max_daily_applications INTEGER NOT NULL DEFAULT 3 CHECK (max_daily_applications BETWEEN 1 AND 10),
  apply_time TIME NOT NULL DEFAULT '09:00:00',
  preferred_locations TEXT[] DEFAULT '{}',
  min_daily_rate INTEGER DEFAULT 0,
  job_types TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',
  templates JSONB DEFAULT '[]',
  active_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id)
);

ALTER TABLE public.auto_apply_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회/수정" ON public.auto_apply_settings
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());
