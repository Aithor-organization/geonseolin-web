-- 로그인 시도 제한 (5회 실패 시 30분 잠금)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);

-- 30분 지난 잠금 자동 해제를 위한 함수
CREATE OR REPLACE FUNCTION check_login_lock(p_email TEXT)
RETURNS TABLE(is_locked BOOLEAN, remaining_minutes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN la.locked_until IS NOT NULL AND la.locked_until > NOW() THEN TRUE
      ELSE FALSE
    END AS is_locked,
    CASE
      WHEN la.locked_until IS NOT NULL AND la.locked_until > NOW()
        THEN EXTRACT(MINUTE FROM (la.locked_until - NOW()))::INTEGER
      ELSE 0
    END AS remaining_minutes
  FROM public.login_attempts la
  WHERE la.email = p_email
  ORDER BY la.last_attempt_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
