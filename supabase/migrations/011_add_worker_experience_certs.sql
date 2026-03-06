-- 경력 사항 테이블
CREATE TABLE public.worker_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  work_period TEXT,
  responsibility TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자격증 테이블
CREATE TABLE public.worker_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  cert_name TEXT NOT NULL,
  acquired_date DATE,
  issuing_agency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- worker_profiles 추가 컬럼 (대시보드 통계용)
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS preferred_regions TEXT[] DEFAULT '{}';

-- profiles 약관 동의 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false;

-- RLS 정책
ALTER TABLE public.worker_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read experiences" ON public.worker_experiences FOR SELECT USING (true);
CREATE POLICY "Workers manage own experiences" ON public.worker_experiences FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers update own experiences" ON public.worker_experiences FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "Workers delete own experiences" ON public.worker_experiences FOR DELETE USING (worker_id = auth.uid());

ALTER TABLE public.worker_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certificates" ON public.worker_certificates FOR SELECT USING (true);
CREATE POLICY "Workers manage own certificates" ON public.worker_certificates FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers update own certificates" ON public.worker_certificates FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "Workers delete own certificates" ON public.worker_certificates FOR DELETE USING (worker_id = auth.uid());

-- 인덱스
CREATE INDEX idx_worker_experiences_worker_id ON public.worker_experiences(worker_id);
CREATE INDEX idx_worker_certificates_worker_id ON public.worker_certificates(worker_id);

-- 프로필 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_profile_views(worker_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.worker_profiles
  SET profile_views = profile_views + 1
  WHERE id = worker_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- total_earnings 자동 업데이트 트리거 (결제 완료 시)
CREATE OR REPLACE FUNCTION update_worker_total_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.worker_profiles
    SET total_earnings = total_earnings + NEW.amount
    WHERE id = (
      SELECT worker_id FROM public.contracts WHERE id = NEW.contract_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_payment_completed
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_worker_total_earnings();
