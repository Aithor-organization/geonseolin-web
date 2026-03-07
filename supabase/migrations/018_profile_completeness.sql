-- 프로필 완성도 시스템을 위한 추가 컬럼
-- profiles 테이블에 생년월일, 주소 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
