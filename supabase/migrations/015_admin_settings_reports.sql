-- 플랫폼 설정 (단일 행)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  fee_rate NUMERIC(4,2) DEFAULT 5.0,
  min_daily_rate INTEGER DEFAULT 150000,
  auto_match BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- admin만 읽기/쓰기 (user_metadata.role = 'admin')
CREATE POLICY "Admin read platform_settings" ON public.platform_settings
  FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin update platform_settings" ON public.platform_settings
  FOR UPDATE USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 기본 행 삽입
INSERT INTO public.platform_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- 신고/모더레이션 테이블
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_name TEXT NOT NULL,
  target_role TEXT,
  reporter_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- admin만 전체 접근
CREATE POLICY "Admin full access reports" ON public.reports
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 일반 유저는 본인이 신고한 것만 읽기
CREATE POLICY "Reporter read own reports" ON public.reports
  FOR SELECT USING (reporter_user_id = auth.uid());

-- 일반 유저는 신고 생성 가능
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
