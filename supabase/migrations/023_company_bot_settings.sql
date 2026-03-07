CREATE TABLE public.company_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_mode TEXT NOT NULL DEFAULT 'always' CHECK (schedule_mode IN ('always', 'off_hours', 'custom')),
  custom_start_time TIME,
  custom_end_time TIME,
  tone TEXT NOT NULL DEFAULT 'polite' CHECK (tone IN ('formal', 'polite', 'concise')),
  escalation_keywords TEXT[] DEFAULT ARRAY['급여', '계약', '불만', '사고', '보험'],
  notify_on_escalation BOOLEAN DEFAULT true,
  total_responses INTEGER DEFAULT 0,
  total_escalations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_settings
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
