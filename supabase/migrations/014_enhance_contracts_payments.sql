-- 계약 테이블 강화: 디지털 서명 + 작업 완료 확인
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS signed_by_worker BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_by_company BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS worker_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 결제 테이블 강화: Toss Payments 연동
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_key TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS toss_status TEXT,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 양측 확인 완료 시 에스크로 자동 해제 트리거
CREATE OR REPLACE FUNCTION auto_release_escrow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.worker_confirmed = true AND NEW.company_confirmed = true THEN
    NEW.confirmed_at = NOW();
    NEW.status = 'completed';
    -- 해당 계약의 에스크로 결제 해제
    UPDATE public.payments
    SET escrow_released = true, status = 'completed'
    WHERE contract_id = NEW.id AND status = 'processing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_release_escrow ON public.contracts;
CREATE TRIGGER trg_auto_release_escrow
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION auto_release_escrow();
