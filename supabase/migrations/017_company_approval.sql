-- 기업 승인 시스템: company_profiles에 approval_status 추가
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 승인 관련 메타데이터
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 기존 기업 데이터가 있으면 approved로 설정
UPDATE public.company_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;
