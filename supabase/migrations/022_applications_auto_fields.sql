ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_auto_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_apply_log_id UUID REFERENCES public.auto_apply_logs(id) ON DELETE SET NULL;
