-- 긴급 공고 플래그
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 긴급 공고 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_urgent ON public.jobs (is_urgent) WHERE is_urgent = true;
