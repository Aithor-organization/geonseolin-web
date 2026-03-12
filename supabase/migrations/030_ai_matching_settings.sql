-- 030: AI 매칭 설정 컬럼 추가
-- 사용자가 AI 자동매칭을 켜고/끌 수 있고, 세부 설정 가능

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ai_matching_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS matching_min_score INTEGER DEFAULT 50 CHECK (matching_min_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS matching_max_results INTEGER DEFAULT 5 CHECK (matching_max_results BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS matching_preferred_locations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS matching_preferred_types TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.user_settings.ai_matching_enabled IS 'AI 매칭 기능 활성화 여부';
COMMENT ON COLUMN public.user_settings.matching_min_score IS 'AI 매칭 최소 점수 (0-100)';
COMMENT ON COLUMN public.user_settings.matching_max_results IS '매칭 결과 최대 개수 (1-20)';
COMMENT ON COLUMN public.user_settings.matching_preferred_locations IS '선호 지역 필터';
COMMENT ON COLUMN public.user_settings.matching_preferred_types IS '선호 공종/직종 필터';
