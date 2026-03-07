CREATE TABLE public.company_bot_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_bot_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_faq
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE INDEX idx_bot_faq_company ON public.company_bot_faq(company_id, priority DESC);
