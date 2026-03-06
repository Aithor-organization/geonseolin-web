CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id),
  worker_id UUID REFERENCES public.worker_profiles(id),
  company_id UUID REFERENCES public.company_profiles(id),
  daily_rate INTEGER NOT NULL,
  work_days INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id),
  amount INTEGER NOT NULL,
  method TEXT CHECK (method IN ('card', 'bank_transfer', 'escrow')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  escrow_released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own contracts" ON public.contracts FOR SELECT
  USING (worker_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "Companies create contracts" ON public.contracts FOR INSERT
  WITH CHECK (company_id = auth.uid());
CREATE POLICY "Parties update contracts" ON public.contracts FOR UPDATE
  USING (worker_id = auth.uid() OR company_id = auth.uid());

CREATE POLICY "Contract parties read payments" ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id
    AND (contracts.worker_id = auth.uid() OR contracts.company_id = auth.uid())
  ));
CREATE POLICY "Companies create payments" ON public.payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id AND contracts.company_id = auth.uid()
  ));
CREATE POLICY "System update payments" ON public.payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id
    AND (contracts.worker_id = auth.uid() OR contracts.company_id = auth.uid())
  ));

CREATE INDEX idx_contracts_worker_id ON public.contracts(worker_id);
CREATE INDEX idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX idx_payments_contract_id ON public.payments(contract_id);
