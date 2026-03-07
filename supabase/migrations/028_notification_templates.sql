CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN (
    'application_accepted',
    'application_rejected',
    'contract_created',
    'review_requested',
    'auto_apply_result'
  )),
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
